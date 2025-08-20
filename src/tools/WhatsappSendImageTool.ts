import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios from 'axios';

interface WhatsappSendImageInput {
  recipient: string;
  base64Image: string;
  prompt: string;
}

// Tool: WhatsappSendImageTool
// Description: Esta ferramenta envia imagens (em base64) para um usuário ou grupo no WhatsApp, podendo associar um prompt descritivo. Ideal para agentes LLM que geram ou manipulam imagens e precisam compartilhá-las diretamente via WhatsApp.
class WhatsappSendImageTool extends MCPTool<WhatsappSendImageInput> {
  name = "whatsapp-send-image";
  description = "Envia imagens em base64 para usuários ou grupos no WhatsApp, com suporte a prompt descritivo.";

  schema = {
    recipient: {
      type: z.string(),
      description: "Recipient ID (user or group).",
    },
    base64Image: {
      type: z.string(),
      description: "Base64 encoded image.",
    },
    prompt: {
      type: z.string(),
      description: "Prompt for the image.",
    },
  };

  async execute(input: WhatsappSendImageInput) {
    const { recipient, base64Image, prompt } = input;
    try {
      const base64Prefix = "data:image/jpeg;base64,";
      const formattedBase64 = base64Image.startsWith("data:image")
          ? base64Image
          : base64Prefix + base64Image;

      const payload = {
          args: {
              to: recipient,
              file: formattedBase64,
              filename: "image.jpg",
              caption: prompt,
              quotedMsgId: null,
              waitForId: false,
              ptt: false,
              withoutPreview: false,
              hideTags: false,
              viewOnce: false,
              requestConfig: null
          }
      };

      const response = await axios.post(`${process.env.WHATSAPP_URL}/sendImage`, payload, {
          headers: {
              'Content-Type': 'application/json',
              'api_key': process.env.WHATSAPP_SECRET || '',
          }
      });
      return response.data;
    } catch (error: any) {

      console.error("Error sending image:", error.response ? error.response.data : error.message);
      return { success: false, message: `Failed to send image: ${error.message}` };
    }
  }
}

export default WhatsappSendImageTool;