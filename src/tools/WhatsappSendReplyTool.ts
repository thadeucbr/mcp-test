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
// Description: Esta ferramenta permite enviar replies contextuais a mensagens específicas no WhatsApp.
class WhatsappSendReplyTool extends MCPTool<WhatsappSendReplyInput> {
  name = "whatsapp_send_reply";
  description = `Send contextual replies to specific WhatsApp messages with optional read status marking.
  
  This tool creates threaded responses that maintain conversation context by replying directly
  to specific messages. Essential for maintaining coherent conversations and providing
  relevant responses in ongoing chats.
  
  Use this tool when you need to:
  - Reply to specific messages in conversations
  - Maintain conversation context and threading
  - Provide targeted responses to user questions
  - Mark messages as read for better UX
  - Create conversational flows with proper message linking
  
  The tool ensures replies are properly linked to the original message for better user experience.`;

  schema = {
    to: {
      type: z.string(),
      description: `WhatsApp recipient identifier (user or group) where the reply will be sent.
      
      - Individual user: "5511971704940@c.us"
      - Group: "120363123456789012@g.us"
      
      Must be the same recipient as the original message being replied to.`,
    },
    content: {
      type: z.string(),
      description: `The reply text content to send.
      
      - Will appear as a reply to the specified message
      - Supports all text formatting and emojis
      - Should be contextually relevant to the quoted message
      - Maximum length: 4096 characters (WhatsApp limit)`,
    },
    quotedMsgId: {
      type: z.string(),
      description: `Unique identifier of the message being replied to.
      
      - Required for creating the reply thread
      - Must be a valid message ID from the conversation
      - The reply will be visually linked to this message in WhatsApp
      - Essential for maintaining conversation context`,
    },
    sendSeen: {
      type: z.boolean().optional(),
      description: `Whether to mark the original message as read ('seen').
      
      - true: Mark the quoted message as read
      - false: Leave the message unread (default)
      - Useful for managing conversation flow and user notifications
      - Helps indicate that the message has been processed`,
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