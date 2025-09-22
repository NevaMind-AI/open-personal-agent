import { MessageParam } from '@anthropic-ai/sdk/resources';
import { existsSync, readFileSync } from 'fs';
import { CategoryResponse, MemuClient } from 'memu-js';
import { join } from 'path';
import { MEMU_BASE_URL, MEMU_DEFAULT_MAX_RETRIES, MEMU_DEFAULT_TIMEOUT } from '../consts';
import { findOne, insertOne, removeMany, updateOne } from '../db/jsonDb';
import { MEMORY_RETRIEVE_COLLECTION, MEMORY_SHOULD_SUMMARY_TURN, MEMORY_SUMMARY_TASKS_COLLECTION } from '../db/models/memory/consts';
import type { MemuRetrieve, MemuRetrieveHistory, MemuSummaryTask } from '../db/models/memory/types';
import { MemuTaskStatus } from '../db/models/memory/types';

const POLL_MS = 15_000;
const SUMMARY_POLLER_LOG = true;
function pollLog(...args: unknown[]) { if (SUMMARY_POLLER_LOG) console.log('[summaryPoller]', ...args); }
function pollDebug(...args: unknown[]) { if (SUMMARY_POLLER_LOG) console.debug('[summaryPoller]', ...args); }

export function startOrContinuePolling(sessionId: string, apiKey: string, abort: AbortController) {
    const timer = setInterval(() => {
        if (abort.signal.aborted) { clearInterval(timer); return; }
        void tick(sessionId, apiKey).catch(() => { /* ignore */ });
    }, POLL_MS);
    pollLog('start polling', { sessionId });
    abort.signal.addEventListener('abort', () => { clearInterval(timer); pollLog('stop polling', { sessionId }); });
}

async function tick(sessionId: string, apiKey: string) {
    pollDebug('tick', { sessionId });
    // check existing task
    const task = await findOne<MemuSummaryTask>(MEMORY_SUMMARY_TASKS_COLLECTION, { sessionId });
    if (!task) {
        await initSummaryTask(sessionId, apiKey);
        return;
    }

    switch (task.summaryTaskStatus) {
        case MemuTaskStatus.PENDING:
        case MemuTaskStatus.PROCESSING: {
            await renewTaskStatus(task, apiKey, sessionId);
            return;
        }
        case MemuTaskStatus.SUCCESS: {
            await retrieveMemory(task, sessionId, apiKey);
            return;
        }
    }
}

async function initSummaryTask(sessionId: string, apiKey: string) {
    // create new task if needed
    const messages = readSessionMessages(sessionId);
    pollDebug('no task, messages', { sessionId, count: messages.length });
    const retrieve = await findOne<MemuRetrieve>(MEMORY_RETRIEVE_COLLECTION, { sessionId });
    const startIndex = retrieve?.nowRetrieve?.summaryRange?.[1] ?? 0;
    const need = (messages.length - startIndex) > MEMORY_SHOULD_SUMMARY_TURN;
    if (!need) { pollDebug('no need summarize', { sessionId, startIndex, length: messages.length }); return; }
    const endIndex = messages.length;

    const client = createMemuClient(apiKey);
    const resp = await client.memorizeConversation(
        messages.slice(startIndex, endIndex).map(m => ({
            role: m.role,
            content: convertMessageParamContentToString(m),
        })),
        'default-user',
        'Default User',
        'default-agent',
        'Default Agent',
    );

    const newTask: MemuSummaryTask = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sessionId,
        summaryRange: [0, endIndex],
        summaryTaskId: String(resp?.taskId ?? ''),
        summaryTaskStatus: MemuTaskStatus.PENDING,
    };
    // replace existing by sessionId
    await removeMany(MEMORY_SUMMARY_TASKS_COLLECTION, { sessionId });
    await insertOne<MemuSummaryTask>(MEMORY_SUMMARY_TASKS_COLLECTION, newTask);
    pollLog('create task', { sessionId, taskId: newTask.summaryTaskId, range: newTask.summaryRange });
}

async function renewTaskStatus(task: MemuSummaryTask, apiKey: string, sid: string) {
    const client = createMemuClient(apiKey);
    if (!task.summaryTaskId) {
        pollDebug('task status pending/processing but no taskId', { sessionId: sid });
        return;
    }
    const info = await client.getTaskStatus(task.summaryTaskId);
    function getStatus(status: string | undefined) {
        switch (status) {
            case 'PENDING':
                return MemuTaskStatus.PENDING;
            case 'PROCESSING':
                return MemuTaskStatus.PROCESSING;
            case 'SUCCESS':
                return MemuTaskStatus.SUCCESS;
            default:
                return MemuTaskStatus.FAILURE;
        }
    }
    const newStatus = getStatus(info?.status);
    await updateOne<MemuSummaryTask>(MEMORY_SUMMARY_TASKS_COLLECTION, { id: task.id }, {
        summaryTaskStatus: newStatus,
    });
    pollDebug('update task status', { sessionId: sid, status: info?.status });
}

async function retrieveMemory(task: MemuSummaryTask, sessionId: string, apiKey: string) {
    const client = createMemuClient(apiKey);
    const cat = await client.retrieveDefaultCategories({
        userId: 'default-user',
        agentId: 'default-agent',
    });

    const newHist: MemuRetrieveHistory = {
        summaryRange: task.summaryRange,
        summaryTaskId: String(task.summaryTaskId || ''),
        summary: parseSummary(cat.categories),
    };

    const existing = await findOne<MemuRetrieve>(MEMORY_RETRIEVE_COLLECTION, { sessionId });
    const history = existing?.history ? [...existing.history] : [];
    if (existing?.nowRetrieve) history.push(existing.nowRetrieve);
    const upsert: MemuRetrieve = {
        id: existing?.id ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sessionId,
        nowRetrieve: newHist,
        history,
    };
    if (existing) {
        await updateOne<MemuRetrieve>(MEMORY_RETRIEVE_COLLECTION, { id: existing.id }, upsert);
    } else {
        await insertOne<MemuRetrieve>(MEMORY_RETRIEVE_COLLECTION, upsert);
    }
    await removeMany(MEMORY_SUMMARY_TASKS_COLLECTION, { sessionId });
    pollLog('finalize summary to retrieve', { sessionId });
}

function readSessionMessages(sessionId: string): MessageParam[] {
    try {
        const p = join(process.cwd(), 'sessions', `${sessionId}.json`);
        if (!existsSync(p)) return [];
        const json = JSON.parse(readFileSync(p, 'utf-8'));
        return Array.isArray(json?.messages) ? json.messages as MessageParam[] : [];
    } catch {
        return [];
    }
}

function createMemuClient(apiKey: string): MemuClient {
    return new MemuClient({
        baseUrl: MEMU_BASE_URL,
        apiKey: apiKey,
        timeout: MEMU_DEFAULT_TIMEOUT,
        maxRetries: MEMU_DEFAULT_MAX_RETRIES,
    });
}

function convertMessageParamContentToString(m: MessageParam): string {
    if (!Array.isArray(m.content)) {
        return String(m.content);
    }
    let content = '';
    for (const c of m.content) {
        switch (c.type) {
            case 'text':
                content += c.text + '\n';
                break;
            case 'tool_use':
                content += JSON.stringify(c) + '\n';
                break;
            case 'tool_result':
                content += JSON.stringify(c) + '\n';
                break;
        }
    }
    return content;
}

function parseSummary(categories: CategoryResponse[]): string {
    return categories.map(category => `[${category.name}] ${category.summary}`).join('\n');
}
