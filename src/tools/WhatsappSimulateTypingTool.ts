import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import axios from 'axios';

interface WhatsappSimulateTypingInput {
  to: string;
  on: boolean;
}

// Tool: WhatsappSimulateTypingTool
// Description: Esta ferramenta permite simular o status de "digitando" no WhatsApp para criar interações mais naturais.
class WhatsappSimulateTypingTool extends MCPTool<WhatsappSimulateTypingInput> {
  name = 'whatsapp_simulate_typing';
  description = `Simulate typing indicators in WhatsApp conversations to create more natural interactions.
  
  This tool controls the "typing..." status that appears in WhatsApp chats, making interactions
  feel more human-like and providing visual feedback during message composition.
  
  Use this tool when you need to:
  - Create natural conversation flow with typing indicators
  - Show that the AI is actively processing a response
  - Improve user experience with visual feedback
  - Simulate human-like conversation patterns
  - Indicate that a response is being prepared
  
  The tool can be used to start or stop the typing indicator as needed.`;

  schema = {
    to: {
      type: z.string(),
      description: `WhatsApp recipient identifier where the typing indicator will be shown.
      
      - Individual user: "5511971704940@c.us"
      - Group: "120363123456789012@g.us"
      
      The typing indicator will appear in this conversation.`,
    },
    on: {
      type: z.boolean(),
      description: `Control the typing indicator state.
      
      - true: Start showing "typing..." indicator
      - false: Stop showing typing indicator
      
      Use 'true' before preparing a response, then 'false' before sending the actual message.`,
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
