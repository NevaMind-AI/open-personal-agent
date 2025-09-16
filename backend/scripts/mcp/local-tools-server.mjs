#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

async function main() {
  const server = new McpServer({ name: 'local_tools', version: '0.1.0' });

  server.tool(
    'call_claude_code',
    '调用Claude Code以生成代码。' +
    '传入清晰描述能解决用户痛点的、与Claude Code单次交流即后可生成代码的prompt；' +
    '以及一个合适的项目名称，用于在用户工作目录下生成一个新文件夹，作为该项目的工作目录；' +
    '以及一个项目的描述，简洁一些，字数不超过50字。' +
    '返回值为代码生成任务是否创建成功。如果创建失败会返回原因（JSON String）。',
    {
      prompt: z.string().describe('清晰描述能解决用户痛点的、与Claude Code交互后可生成代码的prompt'),
      projectName: z.string().describe('合适的项目名称，用于在用户工作目录下生成一个新文件夹，作为该项目的工作目录'),
      description: z.string().describe('项目的描述，简洁一些，字数不超过50字。'),
    },
    async ({
      prompt,
      projectName,
      description
    }) => {
      const baseUrl = 'http://localhost:5174';
      const res = await fetch(`${baseUrl}/api/agent-code/mcp-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'call_claude_code', data: { prompt, projectName, description } }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`dispatch failed: ${res.status} ${text}`);
      }
      return {
        content: [
          { type: 'text', text: JSON.stringify(res.json()) }
        ]
      };
    }
  );

  server.tool(
    'save_application',
    'Application创建成功或修改成功后，保存Application信息。无需输入值。返回值为是否保存成功（JSON String）。',
    {},
    async ({ }) => {
      const baseUrl = 'http://localhost:5174';
      const res = await fetch(`${baseUrl}/api/agent-code/mcp-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'save_application' }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`dispatch failed: ${res.status} ${text}`);
      }
      return {
        content: [
          { type: 'text', text: JSON.stringify(res.json()) }
        ]
      };
    }
  );

  server.tool(
    'get_has_running_task',
    '获取是否有正在运行的任务。无需输入值。' +
    '返回值为是否有正在运行的任务，如果有，那么会返回任务对应的Application的具体信息（JSON String)。',
    {},
    async ({ }) => {
      const baseUrl = 'http://localhost:5174';
      const res = await fetch(`${baseUrl}/api/agent-code/mcp-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'get_has_running_task' }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`dispatch failed: ${res.status} ${text}`);
      }
      return { content: [{ type: 'text', text: JSON.stringify(res.json()) }] };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


