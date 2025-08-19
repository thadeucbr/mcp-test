import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import axios from 'axios';
import { logError } from '../utils/logger';

const SendReplyInputSchema = z.object({
  to: z.string().describe('ID do destinatário (usuário ou grupo).'),
  content: z.string().describe('O conteúdo da mensagem de resposta.'),
  quotedMsgId: z.string().describe('ID da mensagem original a ser respondida.'),
  sendSeen: z.boolean().optional().default(true).describe('Se deve marcar a mensagem como vista (padrão: true).'),
});

type SendReplyInput = z.infer<typeof SendReplyInputSchema>;

class SendReplyTool extends MCPTool<typeof SendReplyInputSchema> {
  name = 'send_whatsapp_reply';
  description = 'Envia uma mensagem de resposta via WhatsApp para um destinatário específico.';
  schema = SendReplyInputSchema;

  async execute(input: SendReplyInput) {
    const { to, content, quotedMsgId, sendSeen } = input;
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
        sendSeen
      }
    };

    try {
      const response = await axios.post(url, data, options);
      console.log('Reply sent successfully:', response.data);
      return response.data;
    } catch (error: any) {
      logError(error, `SendReplyTool - Failed to send reply to ${to}`);
      console.error('Error sending reply:', error);
      throw error;
    }
  }
}

export default new SendReplyTool();
