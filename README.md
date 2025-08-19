# mcp-test

A Model Context Protocol (MCP) server designed to provide various functionalities, including audio generation, image generation, deep research capabilities, and comprehensive WhatsApp integration.

## Quick Start

To get started with the `mcp-test` server, follow these steps:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Project Structure

```
mcp-test/
├── src/
│   ├── tools/        # All MCP Tools (General, WhatsApp, etc.)
│   │   ├── DeepResearchTool.ts
│   │   ├── GenerateAudioTool.ts
│   │   ├── GenerateImageTool.ts
│   │   ├── SendFileTool.ts
│   │   ├── SendImageTool.ts
│   │   ├── SendMessageTool.ts
│   │   ├── SendPttTool.ts
│   │   ├── SendReplyTool.ts
│   │   └── SimulateTypingTool.ts
│   ├── utils/        # Utility functions (e.g., logger)
│   │   └── logger.ts
│   └── index.ts      # Server entry point and tool registration
├── .env.example      # Example environment variables
├── package.json      # Project metadata and dependencies
├── tsconfig.json     # TypeScript configuration
└── ...               # Other project files (node_modules, dist, etc.)
```

## Available Tools

This MCP server exposes a variety of tools for different purposes.

### General Tools

*   **`generate_audio`**
    *   **Description**: Generates audio from text using the OpenAI TTS API and returns a buffer.
    *   **Parameters**:
        *   `textToSpeak` (string): The text to be converted to audio.
*   **`generate-image`**
    *   **Description**: Generates images based on text prompts using AI models (OpenAI or local).
    *   **Parameters**:
        *   `prompt` (string): Prompt for image generation.
        *   `negative_prompt` (string, optional): Negative prompt for image generation.
        *   `seed` (number, optional): Seed for random number generation.
        *   `subseed` (number, optional): Subseed for additional randomness.
        *   `subseed_strength` (number, optional): Strength of the subseed.
        *   `steps` (number, optional): Number of steps for image generation.
        *   `width` (number, optional): Width of the generated image.
        *   `height` (number, optional): Height of the generated image.
        *   `pag_scale` (number, optional): Paginating scale.
*   **`deep_research`**
    *   **Description**: Performs deep research using OpenAI models (`o3-deep-research` or `o4-mini-deep-research`).
    *   **Parameters**:
        *   `query` (string): The research query.
        *   `model` (enum: `o3-deep-research`, `o4-mini-deep-research`, default: `o3-deep-research`): The deep research model to use.
        *   `background` (boolean, default: `true`): Whether to run the research in the background.
        *   `vector_store_ids` (array of string, optional): An array of vector store IDs to use for file search.
        *   `use_web_search` (boolean, default: `true`): Whether to use web search.
        *   `use_code_interpreter` (boolean, default: `false`): Whether to use the code interpreter.

### WhatsApp Tools

These tools provide integration with the WhatsApp API for sending various types of messages.

*   **`send_whatsapp_file`**
    *   **Description**: Envia um arquivo via WhatsApp para um usuário específico.
    *   **Parameters**:
        *   `userId` (string): ID do usuário para quem enviar o arquivo.
        *   `filePath` (string): Caminho absoluto do arquivo a ser enviado.
        *   `fileName` (string, optional): Nome do arquivo (opcional).
        *   `caption` (string, optional): Legenda do arquivo (opcional).
        *   `withoutPreview` (boolean, default: `false`): Se deve enviar sem preview (padrão: false).
        *   `mimeType` (string, optional): Tipo MIME do arquivo (será detectado automaticamente se não fornecido).
*   **`send_whatsapp_image`**
    *   **Description**: Envia uma imagem via WhatsApp para um destinatário específico.
    *   **Parameters**:
        *   `recipient` (string): ID do destinatário (usuário ou grupo).
        *   `base64Image` (string): A imagem em formato base64.
        *   `prompt` (string): A legenda da imagem.
*   **`send_whatsapp_message`**
    *   **Description**: Envia uma mensagem de texto via WhatsApp para um destinatário específico.
    *   **Parameters**:
        *   `to` (string): ID do destinatário (usuário ou grupo).
        *   `content` (string): O conteúdo da mensagem a ser enviada.
        *   `quotedMsgId` (string, optional): ID da mensagem a ser respondida (opcional).
*   **`send_whatsapp_ptt`**
    *   **Description**: Envia uma mensagem de áudio (PTT) via WhatsApp para um destinatário específico.
    *   **Parameters**:
        *   `recipientId` (string): ID do destinatário (usuário ou grupo).
        *   `audioBuffer` (Buffer): O buffer de áudio a ser enviado.
        *   `quotedMsgId` (string, optional): ID da mensagem a ser respondida (opcional).
*   **`send_whatsapp_reply`**
    *   **Description**: Envia uma mensagem de resposta via WhatsApp para um destinatário específico.
    *   **Parameters**:
        *   `to` (string): ID do destinatário (usuário ou grupo).
        *   `content` (string): O conteúdo da mensagem de resposta.
        *   `quotedMsgId` (string): ID da mensagem original a ser respondida.
        *   `sendSeen` (boolean, default: `true`): Se deve marcar a mensagem como vista (padrão: true).
*   **`simulate_whatsapp_typing`**
    *   **Description**: Simula o status de digitação no WhatsApp para um destinatário específico.
    *   **Parameters**:
        *   `to` (string): ID do destinatário (usuário ou grupo).
        *   `on` (boolean): Se a simulação de digitação deve ser ativada (true) ou desativada (false).

## Environment Variables

This project uses environment variables for configuration. A `.env.example` file is provided as a template. Copy it to `.env` and fill in the values.

```
# -------------------------
# OpenAI API Configuration
# -------------------------

# Your OpenAI API key. This is required for generating audio and images.
OPENAI_API_KEY=

# The voice to use for the Text-to-Speech (TTS) service.
# See https://platform.openai.com/docs/models/tts for available voices.
# Default: onyx
OPENAI_TTS_VOICE=onyx

# The model to use for the Text-to-Speech (TTS) service.
# See https://platform.openai.com/docs/models/tts for available models.
# Default: tts-1
OPENAI_TTS_MODEL=tts-1

# -------------------------
# Image Generation Provider
# -------------------------

# The provider to use for image generation.
# Supported values: "openai", "local"
# If set to "openai", the OpenAI API will be used.
# If set to "local", a local image generation service will be used.
IMAGE_PROVIDER=openai

# -------------------------
# OpenAI Image Generation
# -------------------------

# The model to use for image generation with OpenAI.
# See https://platform.openai.com/docs/models/gpt-4 for available models.
# Default: gpt-5-nano-2025-08-07
GPT_IMAGE_GENERATION_MODEL=gpt-5-nano-2025-08-07

# -------------------------
# Local Image Generation
# -------------------------

# The URL of your local image generation service.
# This is only used if IMAGE_PROVIDER is set to "local".
LOCAL_IMAGE_GENERATION_URL=http://localhost:7860/sdapi/v1/txt2img

# -------------------------
# WhatsApp Configuration
# -------------------------

# The base URL for the WhatsApp API.
WHATSAPP_URL=

# The API key for authenticating with the WhatsApp API.
WHATSAPP_SECRET=

# A JSON array of WhatsApp group IDs that the bot should interact with.
# Example: ["1234567890@g.us", "0987654321@g.us"]
WHATSAPP_GROUPS=[]
```

## Building and Testing

1.  Make changes to your tools.
2.  Run `npm run build` to compile the TypeScript code and prepare the project.
3.  The server will automatically load your tools on startup.

## Learn More

*   [MCP Framework Github](https://github.com/QuantGeekDev/mcp-framework)
*   [MCP Framework Docs](https://mcp-framework.com)