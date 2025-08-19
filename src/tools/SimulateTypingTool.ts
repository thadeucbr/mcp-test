import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import axios from 'axios';



const SimulateTypingInputSchema = z.object({
  to: z.string().describe('ID do destinatário (usuário ou grupo).'),
  on: z.boolean().describe('Se a simulação de digitação deve ser ativada (true) ou desativada (false).'),
});

interface SimulateTypingInput {
  to: string;
  on: boolean;
}

class SimulateTypingTool extends MCPTool<SimulateTypingInput> {
  name = 'simulate_whatsapp_typing';
  description = 'Simula o status de digitação no WhatsApp para um destinatário específico.';
  schema = SimulateTypingInputSchema;

  async execute(input: SimulateTypingInput) {
    const { to, on } = input;
    const WHATSAPP_URL = process.env.WHATSAPP_URL;
    const WHATSAPP_SECRET = process.env.WHATSAPP_SECRET;

    try {
      const response = await axios.post(`${WHATSAPP_URL}/simulateTyping`, {
        args: {
          to: to,
          on: on
        }
      }, {
        headers: {
          'api_key': WHATSAPP_SECRET || '',
        }
      });
      return response.data;
    } catch (error: any) {

      console.error(`Error simulating typing for ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

export default SimulateTypingTool;
