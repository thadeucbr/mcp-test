import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface WhatsappSendPttInput {
  recipientId: string;
  audioBuffer: Buffer;
  quotedMsgId?: string;
}

// Tool: WhatsappSendPttTool
// Description: Esta ferramenta envia áudios PTT (push-to-talk, tipo áudio do WhatsApp) para usuários ou grupos, a partir de um buffer de áudio. Útil para agentes LLM que geram ou manipulam áudios e precisam enviá-los como mensagem de voz.
class WhatsappSendPttTool extends MCPTool<WhatsappSendPttInput> {
  name = "whatsapp-send-ptt";
  description = "Envia áudios PTT (push-to-talk) para usuários ou grupos no WhatsApp.";

  schema = {
    recipientId: {
      type: z.string(),
      description: "ID do usuário ou grupo destinatário do áudio PTT no WhatsApp.",
    },
    audioBuffer: {
      type: z.instanceof(Buffer),
      description: "Buffer de áudio (formato ogg/opus) a ser enviado como mensagem de voz.",
    },
    quotedMsgId: {
      type: z.string().optional(),
      description: "ID da mensagem original a ser respondida (reply), se aplicável.",
    },
  };

  async execute(input: WhatsappSendPttInput) {
    const { recipientId, audioBuffer, quotedMsgId } = input;
    try {
      console.log('sendPtt: Iniciando envio de PTT para:', recipientId);
      console.log('sendPtt: Tamanho do buffer de áudio:', audioBuffer.length, 'bytes');
      
      const audioDataUri = `data:audio/ogg;base64,${audioBuffer.toString('base64')}`;

      const payload = {
        args: {
          to: recipientId,
          file: audioDataUri,
          filename: "audio.ogg",
          quotedMsgId: quotedMsgId || undefined,
          waitForId: false,
          ptt: true
        },
      };

      const SEND_PTT_ENDPOINT = `${process.env.WHATSAPP_URL}/sendFile`;

      const fetchResponse = await fetch(SEND_PTT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
          'api_key': process.env.WHATSAPP_SECRET || '',
        },
        body: JSON.stringify(payload),
      });

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.text();
        return { success: false, data: errorData };
      }
      const responseData = await fetchResponse.json();
      if (responseData.success === false) {
        return { success: false, data: responseData.error?.message || JSON.stringify(responseData.error) };
      }

      return { success: true, message: 'Áudio enviado com sucesso.' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export default WhatsappSendPttTool;