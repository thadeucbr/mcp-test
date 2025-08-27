import { MCPTool } from "mcp-framework";
import { z } from "zod";
import OpenAI from "openai";

interface WhatsappSendPttInput {
  to: string;
  textToSpeak: string;
  quotedMsgId?: string;
}

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

  private async generateAudioWithOpenAI(textToSpeak: string): Promise<Buffer> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set.");
    }

    const openai = new OpenAI({ apiKey });

    const voice = process.env.OPENAI_TTS_VOICE || "onyx";
    const model = process.env.OPENAI_TTS_MODEL || "tts-1";

    try {
      const response = await openai.audio.speech.create({
        model: model,
        input: textToSpeak,
        voice: voice as any,
        response_format: "opus",
      });

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      return audioBuffer;

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API failed: ${error.message}`);
      }
      throw new Error("An unknown error occurred while contacting the OpenAI API.");
    }
  }

  async execute(input: WhatsappSendPttInput) {
    const { to, textToSpeak, quotedMsgId } = input;
    try {
      const audioBuffer = await this.generateAudioWithOpenAI(textToSpeak);

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
