import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios from 'axios';

interface WhatsappSendImageInput {
  to: string;
  prompt: string;
  negative_prompt?: string;
  seed?: number;
  subseed?: number;
  subseed_strength?: number;
  steps?: number;
  width?: number;
  height?: number;
  pag_scale?: number;
}

class WhatsappSendImageTool extends MCPTool<WhatsappSendImageInput> {
  name = "whatsapp_send_image";
  description = `Generate AI images from text prompts and send them via WhatsApp to users or groups.
  
  This tool combines AI image generation with WhatsApp messaging to create and deliver custom images on demand.
  Supports multiple image generation providers (OpenAI and local Stable Diffusion) with advanced customization options.
  
  Use this tool when you need to:
  - Create custom images based on text descriptions
  - Send visual content through WhatsApp
  - Generate illustrations, artwork, or visual aids
  - Provide visual responses to user requests
  - Create memes, diagrams, or custom graphics
  
  The tool automatically handles image generation, formatting, and WhatsApp delivery with caption support.`;

  schema = {
    to: {
      type: z.string(),
      description: `WhatsApp recipient identifier where the image will be sent.
      
      - Individual user: "5511971704940@c.us"
      - Group: "120363123456789012@g.us"
      
      The generated image will be sent directly to this recipient with the prompt as caption.`,
    },
    prompt: {
      type: z.string(),
      description: `**MANDATORY PROMPT ENRICHMENT PROCESS:**
      1.  **Analyze the user's original request.** Extract the core idea.
      2.  **Enrich the idea.** Add vivid details to create a spectacular description. Think like an art director. Add elements about:
          - **Subject and Action:** Details about appearance, clothing, expression, and what they are doing.
          - **Setting and Environment:** Where does the scene take place? Time of day, weather, location details.
          - **Art Style:** (Ex: Photorealistic, Digital Painting, 3D Render, Anime, Watercolor, Oil Painting, Cyberpunk).
          - **Lighting:** (Ex: Cinematic lighting, Volumetric light, Neon glow, Golden hour, Dramatic rim lighting).
          - **Composition and Angle:** (Ex: Extreme close-up, Wide shot, Low angle, Portrait, Bokeh).
          - **Quality:** Use terms like "Insanely detailed, Intricate, 8K, Hyperrealistic".
      3.  **Format the Final Prompt:** Combine all details into a single, cohesive paragraph, **IN ENGLISH**, with elements separated by commas.
      4.  **Fill this 'prompt' field with the final enriched result.**
      
      **Example Flow:**
      - User's request: "draw a wizard cat"
      - Your mental enrichment process: Subject (gray cat with a wizard hat and staff), Setting (ancient library), Lighting (candlelight), Style (detailed digital painting).
      - **Final value for this field:** "A wise gray cat wearing a pointed wizard hat and holding a glowing staff, sitting on a pile of ancient books in a mystical library, illuminated by candlelight, digital painting, intricate details, fantasy art."
      `,
    },
    negative_prompt: {
      type: z.string().optional(),
      description: `Elements to exclude from the generated image.
      
      Examples:
      - "blurry, low quality, deformed, ugly"
      - "text, watermark, signature, logo"
      - "people, faces, human figures"
      
      Leave empty to use default negative prompt.`,
    },
    seed: {
      type: z.number().optional(),
      description: `Random seed for reproducible image generation. Use the same seed to generate similar images.
      
      - Range: -1 (random) or positive integers
      - Default: -1 (random)
      - Same seed + same prompt = similar results`
    },
    subseed: {
      type: z.number().optional(),
      description: `Secondary seed for additional variation control. Works with subseed_strength.
      
      - Range: -1 (disabled) or positive integers
      - Used for subtle variations while maintaining main composition`
    },
    subseed_strength: {
      type: z.number().optional(),
      description: `Influence strength of the subseed on the final image.
      
      - Range: 0.0 to 1.0
      - 0.0 = subseed has no effect
      - 1.0 = subseed has maximum influence
      - Default: 0 (disabled)`
    },
    steps: {
      type: z.number().optional(),
      description: `Number of generation steps. Higher values = better quality but slower generation.
      
      - Range: 15-30 (recommended)
      - Default: 20
      - Quality vs Speed tradeoff`
    },
    width: {
      type: z.number().optional(),
      description: `Image width in pixels.
      
      - Range: 256-1024 (depending on provider limits)
      - Default: 512
      - Must be divisible by 64 for optimal results`
    },
    height: {
      type: z.number().optional(),
      description: `Image height in pixels.
      
      - Range: 256-1024 (depending on provider limits)
      - Default: 512
      - Must be divisible by 64 for optimal results`
    },
    pag_scale: {
      type: z.number().optional(),
      description: `Prompt guidance scale (classifier-free guidance). Controls how closely the image follows the prompt.
      
      - Range: 1.0-20.0
      - Lower values = more creative/freer interpretation
      - Higher values = stricter adherence to prompt
      - Default: 7.5`
    },
  };

  async saveImage(base64Data: string, filename: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const imagesDir = path.join(process.cwd(), 'public', 'images');

      await fs.mkdir(imagesDir, { recursive: true });

      const base64 = base64Data.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      const filePath = path.join(imagesDir, filename);
      await fs.writeFile(filePath, Buffer.from(base64, 'base64'));
      return filePath;
    } catch (err: any) {
      return err.message;
    }
  }

  async openAI(input: any): Promise<{ success: boolean; image?: string; message?: string }> {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let prompt = input.prompt;
    if (input.negative_prompt) {
      prompt += `\nNegative prompt: ${input.negative_prompt}`;
    }

    const response = await openai.responses.create({
      model: process.env.GPT_IMAGE_GENERATION_MODEL || 'gpt-5-nano-2025-08-07',
      input: prompt,
      tools: [{ type: 'image_generation' }],
    });

    const imageData = response.output
      .filter((output: any) => output.type === 'image_generation_call')
      .map((output: any) => output.result);

    if (imageData.length > 0) {
      this.saveImage(imageData[0], `${Date.now()}.png`);
      return { success: true, image: imageData[0] };
    }
    return { success: false, message: 'No image generated by OpenAI' };
  }

  async local(input: any): Promise<{ success: boolean; image?: string; message?: string }> {
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
      return { success: false, message: `Local API error: ${response.statusText}` };
    }

    const responseData = await response.json();
    if (responseData.images && responseData.images[0]) {
      this.saveImage(responseData.images[0], `${Date.now()}.png`);
      return { success: true, image: responseData.images[0] };
    }
    return { success: false, message: 'No image generated by local API' };
  }

  async generateImage(input: any): Promise<{ success: boolean; image?: string; message?: string }> {
    try {
      if (process.env.IMAGE_PROVIDER === 'openai') {
        return await this.openAI(input);
      } else if (process.env.IMAGE_PROVIDER === 'local') {
        return await this.local(input);
      } else {
        return { success: false, message: 'Invalid IMAGE_PROVIDER setting' };
      }
    } catch (err) {
      if (err instanceof Error) {
        return { success: false, message: err.message };
      }
      return { success: false, message: String(err) };
    }
  }

  async execute(input: WhatsappSendImageInput) {
    console.log('[DEBUG] WhatsappSendImageTool.execute chamado com input:', input);
    const { to, prompt, negative_prompt, seed, subseed, subseed_strength, steps, width, height, pag_scale } = input;
    try {
      const imageResult = await this.generateImage({
        prompt,
        negative_prompt: negative_prompt || '',
        seed: seed ?? -1,
        subseed: subseed ?? -1,
        subseed_strength: subseed_strength ?? 0,
        steps: steps ?? 30,
        width: width ?? 512,
        height: height ?? 512,
        pag_scale: pag_scale ?? 7.5,
      });

      if (!imageResult.success || !imageResult.image) {
        return { success: false, message: imageResult.message || 'Falha ao gerar imagem.' };
      }

      const imageBase64 = imageResult.image;
      const base64Prefix = imageBase64.startsWith('data:image') ? '' : 'data:image/png;base64,';
      const formattedBase64 = base64Prefix ? base64Prefix + imageBase64 : imageBase64;

      const payload = {
        args: {
          to: to,
          file: formattedBase64,
          filename: 'image.png',
          caption: prompt,
          quotedMsgId: null,
          waitForId: false,
          ptt: false,
          withoutPreview: false,
          hideTags: false,
          viewOnce: false,
          requestConfig: null,
        },
      };

      const response = await axios.post(`${process.env.WHATSAPP_URL}/sendImage`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'api_key': process.env.WHATSAPP_SECRET || '',
        },
      });
      if (response.data?.success === false) {
        return { success: false, message: response.data?.error?.message || JSON.stringify(response.data?.error) };
      }
      return { success: true, message: 'Imagem gerada e enviada com sucesso.' };
    } catch (error: any) {
      console.error('Error sending image:', error.response ? error.response.data : error.message);
      return { success: false, message: `Failed to generate or send image: ${error.message}` };
    }
  }
}

export default WhatsappSendImageTool;
