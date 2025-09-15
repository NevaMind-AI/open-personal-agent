// Tool definitions and executors for Anthropic tool_use
import { tool } from "@anthropic-ai/claude-code";
import { ToolUnion } from "@anthropic-ai/sdk/resources";
import { z } from "zod";

export const toolDefinitions: ToolUnion[] = [
  {
    name: 'get_weather',
    description: 'Get current weather for a city.',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name, e.g. Beijing' },
        unit: { type: 'string', enum: ['c', 'f'], description: 'Temperature unit, c or f' },
      },
      required: ['location'],
    },
  },
];

export const codeToolDefinitions = [
  tool(
    'get_weather',
    'Get current weather for a city.',
    {
      location: z.string().describe('City name, e.g. Beijing'),
      unit: z.enum(['c', 'f']).describe('Temperature unit, c or f'),
    },
    async (input) => {
      const location = String((input && input.location) || 'Unknown');
      const unit = (input && (input.unit === 'f' ? 'f' : 'c')) as 'c' | 'f';
      // mock data
      const tempC = 22;
      const tempF = Math.round((tempC * 9) / 5 + 32);
      const temperature = unit === 'f' ? `${tempF}°F` : `${tempC}°C`;
      return {
        location,
        temperature,
      };
    },
  )
];

export async function executeTool(name: string, input: any): Promise<unknown> {
  switch (name) {
    case 'get_weather': {
      const location = String((input && input.location) || 'Unknown');
      const unit = (input && (input.unit === 'f' ? 'f' : 'c')) as 'c' | 'f';
      // mock data
      const tempC = 22;
      const tempF = Math.round((tempC * 9) / 5 + 32);
      const temperature = unit === 'f' ? `${tempF}°F` : `${tempC}°C`;
      return {
        location,
        condition: 'Sunny',
        temperature,
        humidity: '40%',
        wind: '5 km/h',
        source: 'mock',
        fetched_at: new Date().toISOString(),
      };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}


