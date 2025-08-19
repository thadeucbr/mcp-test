import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import OpenAI from 'openai';

const DeepResearchInputSchema = z.object({
  query: z.string().describe('The research query.'),
  model: z.enum(['o3-deep-research', 'o4-mini-deep-research']).default('o4-mini-deep-research').describe('The deep research model to use.'),
  background: z.boolean().default(true).describe('Whether to run the research in the background.'),
  vector_store_ids: z.array(z.string()).optional().describe('An array of vector store IDs to use for file search.'),
  use_web_search: z.boolean().default(true).describe('Whether to use web search.'),
  use_code_interpreter: z.boolean().default(false).describe('Whether to use the code interpreter.'),
});

type DeepResearchInput = z.infer<typeof DeepResearchInputSchema>;

class DeepResearchTool extends MCPTool<typeof DeepResearchInputSchema> {
  name = 'deep_research';
  description = 'Performs deep research using OpenAI models.';
  schema = DeepResearchInputSchema;

  async execute(input: DeepResearchInput) {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set.');
      }

      const openai = new OpenAI({ apiKey, timeout: 3600 * 1000 });

      const tools: any[] = [];

      if (input.use_web_search) {
        tools.push({ type: 'web_search_preview' });
      }

      if (input.vector_store_ids) {
        tools.push({ type: 'file_search', vector_store_ids: input.vector_store_ids });
      }

      if (input.use_code_interpreter) {
        tools.push({ type: 'code_interpreter', container: { type: 'auto' } });
      }

      const response = await openai.responses.create({
        model: input.model,
        input: input.query,
        background: input.background,
        tools: tools,
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to perform deep research: ${errorMessage}`);
    }
  }
}

export default new DeepResearchTool();
