import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import OpenAI from 'openai';

const DeepResearchInputSchema = z.object({
  query: z.string().describe('Consulta de pesquisa detalhada. Descreva claramente o que deseja saber, pois será usada para buscas profundas em múltiplas fontes.'),
  model: z.enum(['o3-deep-research', 'o4-mini-deep-research'])
    .default('o4-mini-deep-research')
    .describe('Modelo de pesquisa profunda a ser utilizado. "o3-deep-research" para máxima profundidade, "o4-mini-deep-research" para respostas rápidas e eficientes.'),
  background: z.boolean().default(true).describe('Se verdadeiro, executa a pesquisa em background, permitindo que o agente continue outras tarefas enquanto aguarda o resultado.'),
  vector_store_ids: z.array(z.string()).optional().describe('Lista de IDs de vetores para busca em arquivos/documentos privados, além da web.'),
  use_web_search: z.boolean().default(true).describe('Se verdadeiro, ativa busca na web para enriquecer a resposta com informações públicas atualizadas.'),
  use_code_interpreter: z.boolean().default(false).describe('Se verdadeiro, permite uso de code interpreter para análises, cálculos ou manipulação de dados durante a pesquisa.'),
});

type DeepResearchInput = z.infer<typeof DeepResearchInputSchema>;

// Tool: DeepResearchTool
// Description: Esta ferramenta executa pesquisas profundas utilizando modelos avançados da OpenAI (como o o3-deep-research e o o4-mini-deep-research). Permite realizar buscas na web, consultar arquivos em vetores (vector stores) e utilizar code interpreter para análises complexas. Ideal para agentes LLM que precisam de respostas detalhadas, contextualizadas e baseadas em múltiplas fontes, podendo rodar em background e customizar o uso de recursos.
class DeepResearchTool extends MCPTool<typeof DeepResearchInputSchema> {
  name = 'deep-research';
  description = 'Executa pesquisas profundas e contextualizadas usando modelos OpenAI, com suporte a busca web, arquivos e code interpreter.';
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

export default DeepResearchTool;
