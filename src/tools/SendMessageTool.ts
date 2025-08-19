import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import axios from 'axios';


const SendMessageInputSchema = z.object({
  to: z.string().describe('ID do destinatário (usuário ou grupo).'),
  content: z.string().describe('O conteúdo da mensagem a ser enviada.'),
  quotedMsgId: z.string().nullable().optional().describe('ID da mensagem a ser respondida (opcional).'),
});

interface SendMessageInput {
  to: string;
  content: string;
  quotedMsgId?: string | null;
}

class SendMessageTool extends MCPTool<SendMessageInput> {
  name = 'send_whatsapp_message';
  description = 'Envia uma mensagem de texto via WhatsApp para um destinatário específico.';
  schema = SendMessageInputSchema;

  async execute(input: SendMessageInput) {
    const { to, content, quotedMsgId } = input;
    const groups: string[] = JSON.parse(process.env.WHATSAPP_GROUPS || '[]');
    
    // Verificar se é um grupo (identificado pelo sufixo @g.us)
    const isGroup = to.includes('@g.us') || groups.includes(to);
    
    // Se for um grupo e temos um quotedMsgId, usar reply ao invés de sendText
    if (isGroup && quotedMsgId) {
      try {
        const url = `${process.env.WHATSAPP_URL}/reply`;
        const options = {
          headers: {
            'accept': '*/*',
            'api_key': process.env.WHATSAPP_SECRET || '',
            'Content-Type': 'application/json'
          }
        };
        const data = {
          args: {
            to,
            content,
            quotedMsgId,
            sendSeen: true
          }
        };
        const response = await axios.post(url, data, options);
        console.log('Reply sent successfully:', response.data);
        return response.data;
      } catch (error: any) {
        console.warn('Reply failed, falling back to normal sendMessage:', error.message);
      }
    }

    // Usar o método normal de sendText
    const url = `${process.env.WHATSAPP_URL}/sendText`;

    const options = {
      headers: {
        'accept': '*/*',
        'api_key': process.env.WHATSAPP_SECRET || '',
        'Content-Type': 'application/json'
      }
    };

    const data = {
      args: {
        to,
        content
      }
    };

    try {
      const response = await axios.post(url, data, options);
      return response.data;
    } catch (error: any) {

      console.error('Error:', error);
      throw error;
    }
  }
}

export default SendMessageTool;
