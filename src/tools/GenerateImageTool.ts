import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface GenerateImageInput {
  message: string;
}

class GenerateImageTool extends MCPTool<GenerateImageInput> {
  name = "generate-image";
  description = "GenerateImage tool description";

  schema = {
    message: {
      type: z.string(),
      description: "Message to process",
    },
  };

  async execute(input: GenerateImageInput) {
    return `Processed: ${input.message}`;
  }
}

export default GenerateImageTool;