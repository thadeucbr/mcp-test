import { MCPTool } from "mcp-framework";
import { z } from "zod";
import axios from 'axios';
import GenerateImageTool from './GenerateImageTool';


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

// Tool: WhatsappSendImageTool
// Description: Esta ferramenta envia imagens (em base64) para um usuário ou grupo no WhatsApp, podendo associar um prompt descritivo. Ideal para agentes LLM que geram ou manipulam imagens e precisam compartilhá-las diretamente via WhatsApp.
class WhatsappSendImageTool extends MCPTool<WhatsappSendImageInput> {
  name = "whatsapp-send-image";
  description = "Gera automaticamente uma imagem a partir de um prompt textual usando IA generativa e envia para usuários ou grupos no WhatsApp. Permite customizar parâmetros como prompt negativo, seed, tamanho, passos, etc. Ideal para agentes LLM que precisam criar e entregar imagens sob demanda, sem etapas manuais. O envio é feito diretamente ao destinatário, com suporte a legendas e personalização avançada.";

  schema = {
    to: {
      type: z.string(),
      description: "ID do usuário ou grupo destinatário da imagem no WhatsApp.",
    },
    prompt: {
      type: z.string(),
      description: "Prompt descritivo associado à imagem, para contexto ou explicação ao destinatário.",
    },
    negative_prompt: {
      type: z.string().optional(),
      description: "Prompt negativo: elementos que NÃO devem aparecer na imagem.",
    },
    seed: { type: z.number().optional(), description: "Seed para controle de aleatoriedade." },
    subseed: { type: z.number().optional(), description: "Subseed para variação extra." },
    subseed_strength: { type: z.number().optional(), description: "Intensidade do subseed." },
    steps: { type: z.number().optional(), description: "Passos de geração." },
    width: { type: z.number().optional(), description: "Largura da imagem." },
    height: { type: z.number().optional(), description: "Altura da imagem." },
    pag_scale: { type: z.number().optional(), description: "Escala de guidance." },
  };

  async execute(input: WhatsappSendImageInput) {
    const { to, prompt, negative_prompt, seed, subseed, subseed_strength, steps, width, height, pag_scale } = input;
    try {
      // Gerar a imagem usando GenerateImageTool
      const generateImageTool = new GenerateImageTool();
      const imageResult = await generateImageTool.execute({
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