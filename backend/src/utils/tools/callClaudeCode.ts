import { ToolUnion } from "@anthropic-ai/sdk/resources";
import { randomUUID } from "crypto";
import { handleAgentCode } from "../../claude-code/agentStream";
import { WS_EVENT_APPLICATION_NEW_TASK } from "../../consts";
import { findOne, insertOne } from "../../db/jsonDb";
import { APPLICATION_RUNNING_TASKS_COLLECTION } from "../../db/models/application/consts";
import { ApplicationTask } from "../../db/models/application/types";
import { broadcast } from "../../ws/wsServer";

export type CallClaudeCodeInput = {
    prompt: string;
    projectName: string;
    description: string;
}

type CallClaudeCodeOutput = {
    success: boolean;
    reason?: string;
}

export const callClaudeCodeDefine: ToolUnion = {
    name: 'call_claude_code',
    description: '调用Claude Code以生成代码。' +
        '传入清晰描述能解决用户痛点的、与Claude Code单次交流即后可生成代码的prompt；' +
        '以及一个合适的项目名称，用于在用户工作目录下生成一个新文件夹，作为该项目的工作目录；' +
        '以及一个项目的描述，简洁一些，字数不超过50字。' +
        '返回值为代码生成任务是否创建成功。如果创建失败会返回原因。',
    input_schema: {
        type: 'object',
        properties: {
            prompt: {
                type: 'string',
                description: '清晰描述能解决用户痛点的、与Claude Code交互后可生成代码的prompt'
            },
            projectName: {
                type: 'string',
                description: '合适的项目名称，用于在用户工作目录下生成一个新文件夹，作为该项目的工作目录'
            },
            description: {
                type: 'string',
                description: '项目的描述，简洁一些，字数不超过50字。'
            },
        },
    },
};

export async function callClaudeCodeExec(input: CallClaudeCodeInput): Promise<CallClaudeCodeOutput> {
    const { prompt, projectName, description } = input;
    // 单例任务门禁：若存在 running 任务则拒绝；否则登记并返回成功
    const running = await findOne(APPLICATION_RUNNING_TASKS_COLLECTION, { status: "running" });
    if (running) {
        return { success: false, reason: "There is already a running task. Please wait for it to finish." };
    }
    await insertOne<ApplicationTask>(APPLICATION_RUNNING_TASKS_COLLECTION, {
        id: randomUUID(),
        status: "running",
        prompt,
        projectName,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    
    // 后台启动代码生成流程（不阻塞）
    void handleAgentCode({ prompt });

    broadcast({
        type: WS_EVENT_APPLICATION_NEW_TASK,
        at: new Date().toISOString(),
    });
    return { success: true };
}