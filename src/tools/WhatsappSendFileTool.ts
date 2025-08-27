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
// Description: Esta ferramenta permite enviar arquivos de qualquer tipo via WhatsApp para usuários ou grupos.
class WhatsappSendFileTool extends MCPTool<WhatsappSendFileInput> {
  name = 'whatsapp_send_file';
  description = `Send files of any type through WhatsApp to individual users or groups with optional captions and customization.
  
  This tool supports a wide range of file types including documents, images, audio, video, and archives.
  Automatically detects MIME types, handles file validation, and provides flexible delivery options.
  
  Use this tool when you need to:
  - Share documents (PDF, Word, Excel, PowerPoint)
  - Send images, photos, or graphics
  - Deliver audio files, music, or recordings
  - Share videos or multimedia content
  - Send compressed files or archives
  - Deliver any digital content through WhatsApp
  
  The tool automatically handles file validation, size limits, and MIME type detection.`;

  schema = {
    userId: {
      type: z.string(),
      description: `WhatsApp recipient identifier where the file will be sent.
      
      - Individual user: "5511971704940@c.us"
      - Group: "120363123456789012@g.us"
      
      The file will be delivered directly to this recipient.`,
    },
    filePath: {
      type: z.string(),
      description: `Absolute or relative path to the file to be sent.
      
      - Must be accessible from the server
      - File must exist and be readable
      - Maximum size: 64MB (WhatsApp limit)
      - Supports all file types with automatic MIME detection
      
      Examples:
      - "/path/to/document.pdf"
      - "./files/image.jpg"
      - "data/reports/quarterly.xlsx"`,
    },
    fileName: {
      type: z.string().nullable().optional(),
      description: `Custom filename to display to the recipient.
      
      - If not provided, uses the original filename from filePath
      - Should include file extension for proper handling
      - Helps recipients identify the file content
      
      Examples: "monthly_report.pdf", "vacation_photo.jpg"`,
    },
    caption: {
      type: z.string().nullable().optional(),
      description: `Text message to accompany the file.
      
      - Displayed alongside the file in WhatsApp
      - Useful for context or instructions
      - Supports emojis and formatting
      - Leave empty for no caption
      
      Example: "Please review this document 📄"`,
    },
    withoutPreview: {
      type: z.boolean().optional(),
      description: `Control whether to show file preview/thumbnail.
      
      - true: Send without preview (better for privacy, non-visual files)
      - false: Include preview if available (default)
      - Useful for sensitive documents or when preview isn't needed`,
    },
    mimeType: {
      type: z.string().nullable().optional(),
      description: `Explicit MIME type for the file.
      
      - If not provided, automatically detected from file extension
      - Ensures proper handling by WhatsApp and recipient devices
      - Should match the actual file content
      
      Examples: "application/pdf", "image/jpeg", "video/mp4"`,
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
