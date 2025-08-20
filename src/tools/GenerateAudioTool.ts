import { MCPTool } from "mcp-framework";
import { z } from "zod";

import OpenAI from "openai";

const GenerateAudioInputSchema = z.object({
  textToSpeak: z.string().describe("Texto que será convertido em áudio. Forneça a mensagem exata que deseja sintetizar em voz."),
});

interface GenerateAudioInput {
  textToSpeak: string;
}

// Tool: GenerateAudioTool
// Description: Esta ferramenta converte texto em áudio utilizando a API TTS da OpenAI. Recebe um texto e retorna o áudio correspondente em buffer, permitindo que agentes LLM gerem respostas faladas, áudios para WhatsApp, ou outros usos multimodais.
class GenerateAudioTool extends MCPTool<GenerateAudioInput> {
  name = "generate_audio";
  description = "Gera áudio a partir de texto usando a API TTS da OpenAI, retornando o áudio em buffer.";
  schema = GenerateAudioInputSchema;

  async execute(input: GenerateAudioInput) {
    try {
      const audioBuffer = await this.generateAudioWithOpenAI(input.textToSpeak);
      return audioBuffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to generate audio: ${errorMessage}`);
    }
  }

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
}

export default GenerateAudioTool;
