import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios from 'axios';

interface WhatsappSendReplyInput {
  to: string;
  content: string;
  quotedMsgId: string;
  sendSeen?: boolean;
}

// Tool: WhatsappSendReplyTool
// Description: Esta ferramenta envia uma resposta (reply) a uma mensagem específica no WhatsApp, podendo marcar como lida (sendSeen). Permite que agentes LLM respondam de forma contextualizada a mensagens recebidas.
class WhatsappSendReplyTool extends MCPTool<WhatsappSendReplyInput> {
  name = "whatsapp-send-reply";
  description = "Envia resposta a uma mensagem específica no WhatsApp, com opção de marcar como lida.";
  
  schema = {
    to: {
      type: z.string(),
      description: "ID do usuário ou grupo destinatário da resposta no WhatsApp.",
    },
    content: {
      type: z.string(),
      description: "Texto da resposta a ser enviada.",
    },
    quotedMsgId: {
      type: z.string(),
      description: "ID da mensagem original que está sendo respondida (reply).",
    },
    sendSeen: {
      type: z.boolean().optional(),
      description: "Se verdadeiro, marca a mensagem original como lida ('seen').",
    },
  };

  async execute(input: WhatsappSendReplyInput) {
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
      return { success: true, data: response.data};
    } catch (error: any) {
      return { success: false, data: error.message }
    }
  }
}

export default WhatsappSendReplyTool;