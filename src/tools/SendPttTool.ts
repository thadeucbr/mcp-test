import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import { logError } from '../utils/logger';

const SendPttInputSchema = z.object({
  recipientId: z.string().describe('ID do destinatário (usuário ou grupo).'),
  audioBuffer: z.instanceof(Buffer).describe('O buffer de áudio a ser enviado.'),
  quotedMsgId: z.string().optional().describe('ID da mensagem a ser respondida (opcional).'),
});

type SendPttInput = z.infer<typeof SendPttInputSchema>;

class SendPttTool extends MCPTool<typeof SendPttInputSchema> {
  name = 'send_whatsapp_ptt';
  description = 'Envia uma mensagem de áudio (PTT) via WhatsApp para um destinatário específico.';
  schema = SendPttInputSchema;

  async execute(input: SendPttInput) {
    const { recipientId, audioBuffer, quotedMsgId } = input;
    try {
      console.log('sendPtt: Iniciando envio de PTT para:', recipientId);
      console.log('sendPtt: Tamanho do buffer de áudio:', audioBuffer.length, 'bytes');
      
      const audioDataUri = `data:audio/ogg;base64,${audioBuffer.toString('base64')}`;

      const payload = {
        args: {
          to: recipientId,
          file: audioDataUri,
          filename: "audio.ogg",
          quotedMsgId: quotedMsgId || undefined,
          waitForId: false,
          ptt: true
        },
      };

      const SEND_PTT_ENDPOINT = `${process.env.WHATSAPP_URL}/sendFile`;
      console.log('sendPtt: Payload preparado, enviando para:', SEND_PTT_ENDPOINT);

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
        throw new Error(`Erro HTTP ao enviar áudio: ${fetchResponse.status} - ${errorData}`);
      }

      const responseData = await fetchResponse.json();
      if (responseData.success === false) {
        throw new Error(`A API OpenWA retornou um erro: ${responseData.error?.message || JSON.stringify(responseData.error)}`);
      }

      console.log('Mensagem de voz enviada com sucesso!');
      return { success: true, message: 'Áudio enviado com sucesso.' };
    } catch (error: any) {
      logError(error, `SendPttTool - Failed to send PTT to ${recipientId}`);
      console.error('Ocorreu um erro no processo de envio de áudio:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new SendPttTool();
