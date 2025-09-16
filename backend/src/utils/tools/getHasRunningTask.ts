import { ToolUnion } from "@anthropic-ai/sdk/resources";
import { findOne } from "../../db/jsonDb";
import { APPLICATION_RUNNING_TASKS_COLLECTION } from "../../db/models/application/consts";
import { ApplicationTask } from "../../db/models/application/types";

type GetHasRunningTaskOutput = {
  hasRunningTask: boolean;
  task: ApplicationTask | null;
};

export const getHasRunningTaskDefine: ToolUnion = {
  name: 'get_has_running_task',
  description: '获取是否有正在运行的任务。无需输入值。' +
    '返回值为是否有正在运行的任务，如果有，那么会返回任务对应的Application的具体信息。',
  input_schema: {
    type: 'object',
    properties: {},
  },
};

export async function getHasRunningTaskExec(): Promise<GetHasRunningTaskOutput> {
  const running = await findOne<ApplicationTask>(APPLICATION_RUNNING_TASKS_COLLECTION, { status: "running" });
  if (running) {
    return { hasRunningTask: true, task: running };
  }
  return { hasRunningTask: false, task: null };
}