import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import axios from 'axios';

interface WhatsappSendMessageInput {
  to: string;
  content: string;
  quotedMsgId?: string | null;
}

class WhatsappSendMessageTool extends MCPTool<WhatsappSendMessageInput> {
  name = 'whatsapp-send-message';
  description = 'WhatsappSendMessage tool description';

  schema = {
    to: {
      type: z.string(),
      description: 'ID do destinatário (usuário ou grupo).',
    },
    content: {
      type: z.string(),
      description: 'O conteúdo da mensagem a ser enviada.',
    },
    quotedMsgId: {
      type: z.string().nullable().optional(),
      description: 'ID da mensagem a ser respondida (opcional).',
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
