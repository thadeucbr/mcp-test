import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import fs from 'fs';

interface WhatsappSendFileInput {
  userId: string;
  filePath: string;
  fileName?: string | null;
  caption?: string | null;
  withoutPreview?: boolean;
  mimeType?: string | null;
}

// Tool: WhatsappSendFileTool
// Description: Esta ferramenta envia arquivos (de qualquer tipo) para um usuário ou grupo no WhatsApp, podendo incluir legenda, nome do arquivo, tipo MIME e opção de enviar sem preview. Útil para agentes LLM que precisam compartilhar documentos, imagens, PDFs, etc., diretamente via WhatsApp.
class WhatsappSendFileTool extends MCPTool<WhatsappSendFileInput> {
  name = 'whatsapp-send-file';
  description = 'Envia arquivos para usuários ou grupos no WhatsApp, com suporte a legenda, nome e preview.';

  schema = {
    userId: {
      type: z.string(),
      description: 'ID do usuário ou grupo destinatário do arquivo no WhatsApp.',
    },
    filePath: {
      type: z.string(),
      description: 'Caminho absoluto ou relativo do arquivo a ser enviado.',
    },
    fileName: {
      type: z.string().optional(),
      description: 'Nome do arquivo como será exibido para o destinatário (opcional).',
    },
    caption: {
      type: z.string().optional(),
      description: 'Legenda ou mensagem que acompanha o arquivo (opcional).',
    },
    withoutPreview: {
      type: z.boolean().optional().default(false),
      description: 'Se verdadeiro, envia o arquivo sem preview/miniatura (útil para privacidade ou arquivos não visuais).',
    },
    mimeType: {
      type: z.string().optional(),
      description: 'MIME type of the file.',
    },
  };

  async execute(input: WhatsappSendFileInput) {
    const { userId, filePath, fileName, caption, withoutPreview, mimeType } = input;
    try {
      // Verificar se o arquivo existe
      if (!fs.existsSync(filePath)) {
        return { success: false, message: `Arquivo não encontrado: ${filePath}` };
      }

      // Obter informações do arquivo
      const fileStats = fs.statSync(filePath);
      const actualFileName = fileName || filePath.split('/').pop() || 'file';

      // Detectar MIME type baseado na extensão se não fornecido
      let detectedMimeType = mimeType;
      if (!detectedMimeType) {
        const extension = actualFileName.split('.').pop()?.toLowerCase();
        const mimeTypes: { [key: string]: string } = {
          // Documentos
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          xls: 'application/vnd.ms-excel',
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ppt: 'application/vnd.ms-powerpoint',
          pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          txt: 'text/plain',
          rtf: 'application/rtf',
          odt: 'application/vnd.oasis.opendocument.text',

          // Imagens
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          bmp: 'image/bmp',
          webp: 'image/webp',
          svg: 'image/svg+xml',

          // Áudio
          mp3: 'audio/mpeg',
          wav: 'audio/wav',
          ogg: 'audio/ogg',
          aac: 'audio/aac',
          m4a: 'audio/mp4',

          // Vídeo
          mp4: 'video/mp4',
          avi: 'video/x-msvideo',
          mov: 'video/quicktime',
          wmv: 'video/x-ms-wmv',
          flv: 'video/x-flv',
          webm: 'video/webm',

          // Calendário
          ics: 'text/calendar',
          ical: 'text/calendar',

          // Compactados
          zip: 'application/zip',
          rar: 'application/x-rar-compressed',
          '7z': 'application/x-7z-compressed',
          tar: 'application/x-tar',
          gz: 'application/gzip',

          // Outros
          json: 'application/json',
          xml: 'application/xml',
          csv: 'text/csv',
        };

        detectedMimeType = extension
          ? mimeTypes[extension] || 'application/octet-stream'
          : 'application/octet-stream';
      }

      // Verificar tamanho do arquivo (limite do WhatsApp é ~64MB)
      const maxSize = 64 * 1024 * 1024; // 64MB
      if (fileStats.size > maxSize) {
        return {
          success: false,
          message: `Arquivo muito grande: ${fileStats.size} bytes`,
        };
      }

      // Ler arquivo e converter para base64
      const fileContent = fs.readFileSync(filePath);
      const base64Content = fileContent.toString('base64');
      const dataUrl = `data:${detectedMimeType};base64,${base64Content}`;

      // Preparar corpo da requisição
      const requestBody: any = {
        args: {
          to: userId,
          file: dataUrl,
          filename: actualFileName,
          withoutPreview: withoutPreview,
        },
      };

      // Adicionar legenda se fornecida
      if (caption) {
        requestBody.args.caption = caption;
      }

      // Enviar via WhatsApp API
      const sendFileUrl = `${process.env.WHATSAPP_URL}/sendFile`;

      const response = await fetch(sendFileUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          api_key: process.env.WHATSAPP_SECRET || '',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();

        return { success: true, message: 'Arquivo enviado com sucesso.', result };
      } else {
        const errorText = await response.text();

        return {
          success: false,
          message: `Erro ao enviar arquivo: ${response.status} - ${errorText}`,
        };
      }
    } catch (error: any) {
      return { success: false, message: `Erro ao enviar arquivo: ${error.message}` };
    }
  }
}

export default WhatsappSendFileTool;
