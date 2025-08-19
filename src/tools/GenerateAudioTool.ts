import { MCPTool } from "mcp-framework";
import { z } from "zod";

import OpenAI from "openai";

const GenerateAudioInputSchema = z.object({
  textToSpeak: z.string().describe("The text to be converted to audio."),
});

interface GenerateAudioInput {
  textToSpeak: string;
}

class GenerateAudioTool extends MCPTool<GenerateAudioInput> {
  name = "generate_audio";
  description = "Generates audio from text using the OpenAI TTS API and returns a buffer.";
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
