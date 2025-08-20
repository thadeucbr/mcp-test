import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import axios from 'axios';

interface WhatsappSendMessageInput {
  to: string;
  content: string;
  quotedMsgId?: string | null;
}

// Tool: WhatsappSendMessageTool
// Description: Esta ferramenta envia mensagens de texto para usuários ou grupos no WhatsApp, com suporte a resposta a mensagens específicas (quotedMsgId). Permite que agentes LLM interajam diretamente com usuários via texto no WhatsApp.
class WhatsappSendMessageTool extends MCPTool<WhatsappSendMessageInput> {
  name = 'whatsapp-send-message';
  description = 'Envia mensagens de texto para usuários ou grupos no WhatsApp, com suporte a reply.';

  schema = {
    to: {
      type: z.string(),
      description: 'ID do destinatário (usuário ou grupo) no WhatsApp.',
    },
    content: {
      type: z.string(),
      description: 'Texto da mensagem a ser enviada ao destinatário.',
    },
    quotedMsgId: {
      type: z.string().nullable().optional(),
      description: 'ID da mensagem original a ser respondida (reply), se aplicável.',
    },
  };

  async execute(input: WhatsappSendMessageInput) {
    console.log('[DEBUG] WhatsappSendMessageTool.execute chamado com input:', input);
    const { to, content, quotedMsgId } = input;
    const isGroup = to.includes('@g.us');

    if (isGroup && quotedMsgId) {
      try {
        const url = `${process.env.WHATSAPP_URL}/reply`;
        const options = {
          headers: {
            accept: '*/*',
            api_key: process.env.WHATSAPP_SECRET || '',
            'Content-Type': 'application/json',
          },
        };
        const data = {
          args: {
            to,
            content,
            quotedMsgId,
            sendSeen: true,
          },
        };
        const response = await axios.post(url, data, options);
        console.log('Reply sent successfully:', response.data);
        return response.data;
      } catch (error: any) {
        console.warn('Reply failed, falling back to normal sendMessage:', error.message);
      }
    }
    const url = `${process.env.WHATSAPP_URL}/sendText`;

    const options = {
      headers: {
        accept: '*/*',
        api_key: process.env.WHATSAPP_SECRET || '',
        'Content-Type': 'application/json',
      },
    };

    const data = {
      args: {
        to,
        content,
      },
    };

    try {
      const response = await axios.post(url, data, options);
      return { success: true, data: response.data};
    } catch (error: any) {
      console.error('Error:', error);
      return { success: false, data: error.message };
    }
  }
}

export default WhatsappSendMessageTool;
