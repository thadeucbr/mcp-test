import { MCPTool } from 'mcp-framework';
import { z } from 'zod';

interface GenerateImageInput {
  prompt: string;
  negative_prompt: string;
  seed: number;
  subseed: number;
  subseed_strength: number;
  steps: number;
  width: number;
  height: number;
  pag_scale: number;
}

class GenerateImageTool extends MCPTool<GenerateImageInput> {
  name = 'generate-image';
  description = 'GenerateImage tool description';

  schema = {
    prompt: {
      type: z.string(),
      description: 'Prompt for image generation',
    },
    negative_prompt: {
      type: z.string().optional(),
      description: 'Negative prompt for image generation',
    },
    seed: {
      type: z.number().min(0).optional(),
      description: 'Seed for random number generation',
    },
    subseed: {
      type: z.number().min(0).optional(),
      description: 'Subseed for additional randomness',
    },
    subseed_strength: {
      type: z.number().min(0).optional(),
      description: 'Strength of the subseed',
    },
    steps: {
      type: z.number().min(1).optional(),
      description: 'Number of steps for image generation',
    },
    width: {
      type: z.number().min(1).optional(),
      description: 'Width of the generated image',
    },
    height: {
      type: z.number().min(1).optional(),
      description: 'Height of the generated image',
    },
    pag_scale: {
      type: z.number().min(0).optional(),
    },
  };
  async openAI(input: GenerateImageInput) {}
  async local(input: GenerateImageInput) {
    const method = 'POST';
    const headers = new Headers();
    const body = JSON.stringify({
      prompt: input.prompt,
      negative_prompt:
        input.negative_prompt ||
        'low quality, blurry, deformed, bad anatomy, text, watermark',
      seed: input.seed || -1,
      subseed: input.subseed || -1,
      subseed_strength: input.subseed_strength || 0,
      batch_size: 1,
      steps: input.steps || 30,
      width: input.width || 512,
      height: input.height || 512,
      pag_scale: input.pag_scale || 7.5,
    });

    headers.set('Content-Type', 'application/json');
    

    const response = await fetch(`${process.env.LOCAL_IMAGE_GENERATION_URL}`, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`Local API error: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData.images[0];
  }
  async execute(input: GenerateImageInput) {
    return `Processed: ${input.prompt}`;
  }
}

export default GenerateImageTool;
