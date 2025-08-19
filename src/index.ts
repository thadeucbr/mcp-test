import { MCPServer } from "mcp-framework";

const server = new MCPServer({
  transport: {
    type: "stdio",
    // options: {
    //   port: 1337,
    //   cors: {
    //     allowOrigin: "*"
    //   }
    // }
  }});

server.start();