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
  description: 'Check whether there is a running task. No input required. ' +
    'Returns whether there is a running task; if so, returns the corresponding Application details.',
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