import { tool } from "@anthropic-ai/claude-code";
import { ToolUnion } from "@anthropic-ai/sdk/resources";
import { WS_EVENT_APPLICATION_REFRESH } from "../../consts";
import { deleteOne, findOne, insertOne, updateOne } from "../../db/jsonDb";
import { APPLICATION_RUNNING_TASKS_COLLECTION, APPLICATIONS_COLLECTION } from "../../db/models/application/consts";
import { Application, ApplicationTask } from "../../db/models/application/types";
import { broadcast } from "../../ws/wsServer";

type SaveApplicationOutput = {
  success: boolean;
};

export const saveApplicationDefine: ToolUnion = {
  name: 'save_application',
  description: 'Application创建成功或修改成功后，保存Application信息。无需输入值。返回值为是否保存成功。',
  input_schema: {
    type: 'object',
    properties: {},
  },
};

export const saveApplicationTool = tool(
  saveApplicationDefine.name,
  saveApplicationDefine.description ?? '',
  {},
  async () => {
    return saveApplicationExec();
  }
);

export const saveApplicationExec = async (): Promise<SaveApplicationOutput> => {
  const running = await findOne<ApplicationTask>(APPLICATION_RUNNING_TASKS_COLLECTION, { status: "running" });
  if (!running) {
    return { success: false };
  }
  const application: Application = {
    id: running.id,
    projectName: running.projectName,
    description: running.description,
    prompt: running.prompt,
    createdAt: running.createdAt,
    updatedAt: running.updatedAt,
  };
  const existing = await findOne<Application>(APPLICATIONS_COLLECTION, { id: running.id });
  if (existing) {
    await updateOne<Application>(APPLICATIONS_COLLECTION, { id: running.id }, application);
  } else {
    await insertOne<Application>(APPLICATIONS_COLLECTION, application);
  }
  await deleteOne<ApplicationTask>(APPLICATION_RUNNING_TASKS_COLLECTION, running);
  broadcast({
    type: WS_EVENT_APPLICATION_REFRESH,
    at: new Date().toISOString(),
  });
  return { success: true };
};