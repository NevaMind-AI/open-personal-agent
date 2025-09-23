#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

async function main() {
  const server = new McpServer({ name: 'local_tools', version: '0.1.0' });

  server.tool(
    'call_claude_code',
    'Call Claude Code to generate code.' +
    ' Provide a prompt that clearly describes a solution to the user\'s pain point that Claude Code can use to generate code in a single interaction;' +
    ' and a suitable project name to create a new folder under the user\'s workspace as the project working directory;' +
    ' and a brief project description (no more than 50 characters).' +
    ' The return value indicates whether the code generation task was created successfully. If creation fails, the reason is returned (JSON string).',
    {
      prompt: z.string().describe('A clear prompt that Claude Code can use to generate code in one interaction'),
      projectName: z.string().describe("A suitable project name to create a new folder under the user's workspace"),
      description: z.string().describe('A brief project description (<= 50 characters).'),
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
          { type: 'text', text: await res.text() }
        ]
      };
    }
  );

  server.tool(
    'save_application',
    'After an Application is created or updated, save the Application information. No input required. Returns whether saving succeeded (JSON string).',
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
          { type: 'text', text: await res.text() }
        ]
      };
    }
  );

  server.tool(
    'get_has_running_task',
    'Check whether there is a running task. No input required. ' +
    'Returns whether there is a running task; if so, returns the corresponding Application details (JSON string).',
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
      return { content: [{ type: 'text', text: await res.text() }] };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


