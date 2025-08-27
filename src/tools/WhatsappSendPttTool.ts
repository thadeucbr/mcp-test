import { MCPTool } from "mcp-framework";
import { z } from "zod";
import OpenAI from "openai";

interface WhatsappSendPttInput {
  to: string;
  textToSpeak: string;
  quotedMsgId?: string;
}

class WhatsappSendPttTool extends MCPTool<WhatsappSendPttInput> {
  name = "whatsapp_send_ptt";
  description = `Convert text to speech and send as voice message (PTT) via WhatsApp to users or groups.
  
  This tool uses OpenAI's Text-to-Speech API to generate natural-sounding voice audio from text,
  then delivers it as a WhatsApp voice message. Supports multiple voices and reply functionality.
  
  Use this tool when you need to:
  - Send voice messages through WhatsApp
  - Convert text content to audio format
  - Provide audio responses or announcements
  - Send voice replies in conversations
  - Deliver content in audio format for accessibility
  - Create voice notifications or alerts
  
  The tool automatically handles text-to-speech conversion and WhatsApp delivery with proper audio formatting.`;

  schema = {
    to: {
      type: z.string(),
      description: `WhatsApp recipient identifier where the voice message will be sent.
      
      - Individual user: "5511971704940@c.us"
      - Group: "120363123456789012@g.us"
      
      The voice message will be delivered as a PTT (Push-to-Talk) message.`,
    },
    textToSpeak: {
      type: z.string(),
      description: `The text content to convert to speech and send as voice message.
      
      - Supports multiple languages (depending on OpenAI TTS model)
      - Maximum length depends on OpenAI TTS limits
      - Will be converted to natural-sounding speech
      - Supports various tones and speaking styles
      
      Examples:
      - "Hello! This is an automated voice message."
      - "Your appointment is confirmed for tomorrow at 2 PM."
      - "Important: Please review the attached document."`,
    },
    quotedMsgId: {
      type: z.string().optional(),
      description: `Message ID to reply to with the voice message.
      
      - When provided, the voice message will be sent as a reply
      - Useful for maintaining conversation context
      - Leave empty for new voice messages
      - Only works in group chats when specified`,
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
