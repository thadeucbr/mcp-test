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
      description: "Recipient ID (user or group).",
    },
    content: {
      type: z.string(),
      description: "Content of the message.",
    },
    quotedMsgId: {
      type: z.string(),
      description: "ID of the message to reply to.",
    },
    sendSeen: {
      type: z.boolean().optional(),
      description: "Whether to send a 'seen' receipt.",
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