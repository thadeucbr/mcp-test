import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import axios from 'axios';
import { logError } from '../utils/logger';

const SendImageInputSchema = z.object({
  recipient: z.string().describe('ID do destinatário (usuário ou grupo).'),
  base64Image: z.string().describe('A imagem em formato base64.'),
  prompt: z.string().describe('A legenda da imagem.'),
});

type SendImageInput = z.infer<typeof SendImageInputSchema>;

class SendImageTool extends MCPTool<typeof SendImageInputSchema> {
  name = 'send_whatsapp_image';
  description = 'Envia uma imagem via WhatsApp para um destinatário específico.';
  schema = SendImageInputSchema;

  async execute(input: SendImageInput) {
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
      logError(error, `SendImageTool - Failed to send image to ${recipient}`);
      console.error("Error sending image:", error.response ? error.response.data : error.message);
      return { success: false, message: `Failed to send image: ${error.message}` };
    }
  }
}

export default new SendImageTool();
