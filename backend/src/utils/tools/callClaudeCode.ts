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
    description: 'Call Claude Code to generate code.' +
        " Provide a prompt that clearly describes a solution to the user's pain point that Claude Code can use to generate code in a single interaction;" +
        " and a suitable project name to create a new folder under the user's workspace as the project working directory;" +
        ' and a brief project description (no more than 50 characters). ' +
        ' The return value indicates whether the code generation task was created successfully; if creation fails, the reason is returned.',
    input_schema: {
        type: 'object',
        properties: {
            prompt: {
                type: 'string',
                description: 'A clear prompt that Claude Code can use to generate code in one interaction'
            },
            projectName: {
                type: 'string',
                description: "A suitable project name to create a new folder under the user's workspace as the project working directory"
            },
            description: {
                type: 'string',
                description: 'A brief project description (<= 50 characters)'
            },
        },
    },
};

export async function callClaudeCodeExec(input: CallClaudeCodeInput): Promise<CallClaudeCodeOutput> {
    const { prompt, projectName, description } = input;
    // Singleton task guard: reject if a running task exists; otherwise, register and return success
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
    
    // Start the code generation process in the background (non-blocking)
    void handleAgentCode({ prompt });

    broadcast({
        type: WS_EVENT_APPLICATION_NEW_TASK,
        at: new Date().toISOString(),
    });
    return { success: true };
}