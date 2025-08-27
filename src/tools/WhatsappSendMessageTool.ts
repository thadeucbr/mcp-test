import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import axios from 'axios';

interface WhatsappSendMessageInput {
  to: string;
  content: string;
  quotedMsgId?: string | null;
}

// Tool: WhatsappSendMessageTool
// Description: Esta ferramenta permite enviar mensagens de texto via WhatsApp para usuários individuais ou grupos, com suporte a replies.
class WhatsappSendMessageTool extends MCPTool<WhatsappSendMessageInput> {
  name = 'whatsapp_send_message';
  description = `Send text messages through WhatsApp to individual users or groups with optional reply functionality.
  
  Use this tool when you need to:
  - Send notifications, alerts, or updates to WhatsApp users
  - Respond to user messages in a conversation
  - Send automated messages as part of a workflow
  - Communicate with WhatsApp groups
  - Reply to specific messages in a conversation thread
  
  The tool automatically handles both regular messages and replies, falling back to regular sending if reply fails.
  Supports both individual contacts (@s.whatsapp.net) and groups (@g.us).`;

  schema = {
    to: {
      type: z.string(),
      description: `WhatsApp recipient identifier. Can be:
      
      - Individual user: "5511971704940@c.us"
      - Group: "120363123456789012@g.us"
      
      The tool automatically detects if it's a group or individual recipient.`,
    },
    content: {
      type: z.string(),
      description: `The text message content to send. Supports:
      
      - Plain text messages
      - Emojis and special characters
      - Multi-line messages
      - URLs and links
      
      Maximum recommended length: 4096 characters (WhatsApp limit).`,
    },
    quotedMsgId: {
      type: z.string().nullable().optional(),
      description: `Message ID to reply to. When provided, the message will be sent as a reply to the specified message.
      
      - Use this to maintain conversation context
      - Leave empty/null for new messages
      - Only works in group chats when specified
      - Falls back to regular message if reply fails`,
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
