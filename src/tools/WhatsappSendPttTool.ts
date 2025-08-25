import { MCPTool } from "mcp-framework";
import { z } from "zod";


import GenerateAudioTool from "./GenerateAudioTool";

interface WhatsappSendPttInput {
  to: string;
  textToSpeak: string;
  quotedMsgId?: string;
}

// Tool: WhatsappSendPttTool
// Description: Esta ferramenta gera um áudio PTT (push-to-talk, tipo áudio do WhatsApp) a partir de um texto fornecido, utilizando TTS, e já envia esse áudio automaticamente para o usuário ou grupo no WhatsApp. Ideal para agentes LLM que precisam sintetizar uma mensagem de voz e entregá-la diretamente ao destinatário.
class WhatsappSendPttTool extends MCPTool<WhatsappSendPttInput> {
  name = "whatsapp-send-ptt";
  description = "Gera um áudio a partir de texto e envia como mensagem de voz (PTT) para usuários ou grupos no WhatsApp. O áudio é criado automaticamente e entregue ao destinatário.";

  schema = {
    to: {
      type: z.string(),
      description: "ID do usuário ou grupo destinatário do áudio no WhatsApp.",
    },
    textToSpeak: {
      type: z.string(),
      description: "Texto que será convertido em áudio e enviado como PTT.",
    },
    quotedMsgId: {
      type: z.string().optional(),
      description: "ID da mensagem original a ser respondida (reply), se aplicável.",
    },
  };

  async execute(input: WhatsappSendPttInput) {
    const { to, textToSpeak, quotedMsgId } = input;
    try {
      // Gerar o áudio a partir do texto usando GenerateAudioTool
      const generateAudioTool = new GenerateAudioTool();
      const audioBuffer = await generateAudioTool.execute({ textToSpeak });

      if (!audioBuffer || !(audioBuffer instanceof Buffer)) {
        throw new Error(audioBuffer?.toString() || "Failed to generate audio buffer.");
      }

      console.log('sendPtt: Iniciando envio de PTT para:', to);
      console.log('sendPtt: Tamanho do buffer de áudio:', audioBuffer.length, 'bytes');

      const audioDataUri = `data:audio/ogg;base64,${audioBuffer.toString('base64')}`;
      
      const payload = {
        args: {
          to: to,
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