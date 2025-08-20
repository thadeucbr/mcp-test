// Client MCP para stdio (processo filho)
import { spawn } from 'child_process';

function sendJsonRpc(proc, payload) {
  proc.stdin.write(JSON.stringify(payload) + '\n');
}

function main() {
  // Ajuste o caminho para o binário do seu MCP server
  const mcpProc = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  mcpProc.stdout.on('data', (data) => {
    // Pode vir mais de uma linha
    data.toString().split('\n').forEach(line => {
      if (line.trim()) {
        try {
          const msg = JSON.parse(line);
          console.log('STDIO MCP RESPONSE:', msg);
        } catch (e) {
          // Ignora linhas não-JSON
        }
      }
    });
  });

  // 1. initialize
  const initPayload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-08-05',
      clientInfo: { name: 'mcp-stdio-client', version: '0.1.0' },
      capabilities: {}
    }
  };
  sendJsonRpc(mcpProc, initPayload);

  // 2. initialized notification
  setTimeout(() => {
    const notif = { jsonrpc: '2.0', method: 'initialized', params: {} };
    sendJsonRpc(mcpProc, notif);
  }, 200);

  // 3. tools/list
  setTimeout(() => {
    const listTools = { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} };
    sendJsonRpc(mcpProc, listTools);
  }, 400);

  // 4. example_tool
  setTimeout(() => {
    const example = { jsonrpc: '2.0', id: 3, method: 'example_tool', params: { message: 'Teste via stdio' } };
    sendJsonRpc(mcpProc, example);
  }, 600);
}

main();
