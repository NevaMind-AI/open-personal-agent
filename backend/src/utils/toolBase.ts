// Tool definitions and executors for Anthropic tool_use
import { ToolUnion } from "@anthropic-ai/sdk/resources";
import { callClaudeCodeDefine, callClaudeCodeExec, CallClaudeCodeInput, callClaudeCodeTool } from "./tools/callClaudeCode";
import { getHasRunningTaskDefine, getHasRunningTaskExec, getHasRunningTaskTool } from "./tools/getHasRunningTask";
import { saveApplicationDefine, saveApplicationExec, saveApplicationTool } from "./tools/saveApplication";

export const toolDefinitions: ToolUnion[] = [
  callClaudeCodeDefine,
  // saveApplicationDefine,
  getHasRunningTaskDefine
];

export const codeToolDefinitions = [
  callClaudeCodeTool,
  saveApplicationTool,
  getHasRunningTaskTool
];

export async function executeTool(name: string, input: any): Promise<unknown> {
  switch (name) {
    case callClaudeCodeDefine.name: {
      return callClaudeCodeExec(input as CallClaudeCodeInput);
    }
    case saveApplicationDefine.name: {
      return saveApplicationExec();
    }
    case getHasRunningTaskDefine.name: {
      return getHasRunningTaskExec();
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}


