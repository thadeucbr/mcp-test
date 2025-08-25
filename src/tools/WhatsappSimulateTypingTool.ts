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
      description: 'ID do usuário ou grupo para o qual será simulado o status de digitando.',
    },
    on: {
      type: z.boolean(),
      description: 'Se verdadeiro, ativa a simulação de digitando; se falso, desativa.',
    },
  };

  async execute(input: WhatsappSimulateTypingInput) {
    let { to, on } = input;
    // Remove o sufixo @ e tudo após, se existir
    if (typeof to === 'string') {
      to = to.replace(/@.*$/, '');
    }
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
