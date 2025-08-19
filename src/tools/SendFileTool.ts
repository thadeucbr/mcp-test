import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import fs from 'fs';
import { logger } from '../utils/logger';

const SendFileInputSchema = z.object({
  userId: z.string().describe('ID do usuário para quem enviar o arquivo.'),
  filePath: z.string().describe('Caminho absoluto do arquivo a ser enviado.'),
  fileName: z.string().nullable().optional().describe('Nome do arquivo (opcional).'),
  caption: z.string().nullable().optional().describe('Legenda do arquivo (opcional).'),
  withoutPreview: z.boolean().optional().default(false).describe('Se deve enviar sem preview (padrão: false).'),
  mimeType: z.string().nullable().optional().describe('Tipo MIME do arquivo (será detectado automaticamente se não fornecido).'),
});

type SendFileInput = z.infer<typeof SendFileInputSchema>;

class SendFileTool extends MCPTool<typeof SendFileInputSchema> {
  name = 'send_whatsapp_file';
  description = 'Envia um arquivo via WhatsApp para um usuário específico.';
  schema = SendFileInputSchema;

  async execute(input: SendFileInput) {
    const { userId, filePath, fileName, caption, withoutPreview, mimeType } = input;
    try {
      // Verificar se o arquivo existe
      if (!fs.existsSync(filePath)) {
        logger.error('SendFileTool', `Arquivo não encontrado: ${filePath}`);
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
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'ppt': 'application/vnd.ms-powerpoint',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'txt': 'text/plain',
          'rtf': 'application/rtf',
          'odt': 'application/vnd.oasis.opendocument.text',
          
          // Imagens
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'bmp': 'image/bmp',
          'webp': 'image/webp',
          'svg': 'image/svg+xml',
          
          // Áudio
          'mp3': 'audio/mpeg',
          'wav': 'audio/wav',
          'ogg': 'audio/ogg',
          'aac': 'audio/aac',
          'm4a': 'audio/mp4',
          
          // Vídeo
          'mp4': 'video/mp4',
          'avi': 'video/x-msvideo',
          'mov': 'video/quicktime',
          'wmv': 'video/x-ms-wmv',
          'flv': 'video/x-flv',
          'webm': 'video/webm',
          
          // Calendário
          'ics': 'text/calendar',
          'ical': 'text/calendar',
          
          // Compactados
          'zip': 'application/zip',
          'rar': 'application/x-rar-compressed',
          '7z': 'application/x-7z-compressed',
          'tar': 'application/x-tar',
          'gz': 'application/gzip',
          
          // Outros
          'json': 'application/json',
          'xml': 'application/xml',
          'csv': 'text/csv'
        };
        
        detectedMimeType = extension ? mimeTypes[extension] || 'application/octet-stream' : 'application/octet-stream';
      }

      // Verificar tamanho do arquivo (limite do WhatsApp é ~64MB)
      const maxSize = 64 * 1024 * 1024; // 64MB
      if (fileStats.size > maxSize) {
        logger.error('SendFileTool', `Arquivo muito grande: ${fileStats.size} bytes (máximo: ${maxSize} bytes)`);
        return { success: false, message: `Arquivo muito grande: ${fileStats.size} bytes` };
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
          withoutPreview: withoutPreview
        }
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
          'api_key': process.env.WHATSAPP_SECRET || ''
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        logger.info('SendFileTool', `Arquivo enviado com sucesso para ${userId}: ${actualFileName} (${fileStats.size} bytes)`);
        return { success: true, message: 'Arquivo enviado com sucesso.', result };
      } else {
        const errorText = await response.text();
        logger.error('SendFileTool', `Erro ao enviar arquivo: ${response.status} - ${errorText}`);
        return { success: false, message: `Erro ao enviar arquivo: ${response.status} - ${errorText}` };
      }
    } catch (error: any) {
      logger.error('SendFileTool', 'Erro ao enviar arquivo', error);
      return { success: false, message: `Erro ao enviar arquivo: ${error.message}` };
    }
  }
}

export default new SendFileTool();
