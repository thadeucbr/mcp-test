import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import axios from 'axios';

interface WhatsappSimulateTypingInput {
  to: string;
  on: boolean;
}

// Tool: WhatsappSimulateTypingTool
// Description: Esta ferramenta simula o status de "digitando" para um usuário ou grupo no WhatsApp, ativando ou desativando a indicação visual. Útil para agentes LLM que desejam criar uma experiência mais natural e humana na interação via WhatsApp.
class WhatsappSimulateTypingTool extends MCPTool<WhatsappSimulateTypingInput> {
  name = 'whatsapp-simulate-typing';
  description = 'Simula o status de digitando para usuários ou grupos no WhatsApp.';

  schema = {
    to: {
      type: z.string(),
      description: 'Recipient ID (user or group).',
    },
    on: {
      type: z.boolean(),
      description: 'Whether to simulate typing or not.',
    },
  };

  async execute(input: WhatsappSimulateTypingInput) {
    const { to, on } = input;
    const WHATSAPP_URL = process.env.WHATSAPP_URL;
    const WHATSAPP_SECRET = process.env.WHATSAPP_SECRET;

    try {
      const response = await axios.post(
        `${WHATSAPP_URL}/simulateTyping`,
        {
          args: {
            to: to,
            on: on,
          },
        },
        {
          headers: {
            api_key: WHATSAPP_SECRET || '',
          },
        }
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`Error simulating typing for ${to}:`, error.message);
      return { success: false, data: error.message };
    }
  }
}

export default WhatsappSimulateTypingTool;
