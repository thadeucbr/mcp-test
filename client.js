

class HttpStreamClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.sessionId = null;
  }

  async sendRequest(payload, onComplete, onError) {
    const url = `${this.baseUrl}/mcp`;
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    };
    if (this.sessionId) {
      headers["mcp-session-id"] = this.sessionId;
      console.log("➡️ Enviando header mcp-session-id:", this.sessionId);
    }
    try {
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
      const sid = res.headers.get("mcp-session-id");
      if (sid && !this.sessionId) {
        this.sessionId = sid;
        console.log("📌 Sessão inicializada via header (mcp-session-id):", this.sessionId);
      } else if (!sid) {
        console.warn("⚠️ Nenhum header mcp-session-id retornado pelo servidor.");
      }
      const text = await res.text();
      if (!text || text.trim() === "") {
        onComplete && onComplete({ ok: true, sessionId: this.sessionId });
        return;
      }
      // Trata resposta SSE (event: message\ndata: ...)
      const dataLines = text.split('\n').filter(line => line.startsWith('data:'));
      if (dataLines.length > 0) {
        for (const line of dataLines) {
          const jsonStr = line.replace(/^data:\s*/, '');
          try {
            const json = JSON.parse(jsonStr);
            onComplete && onComplete(json);
          } catch (err) {
            console.error("❌ Erro ao parsear JSON da linha SSE:", jsonStr);
            onError && onError(err);
          }
        }
      } else {
        // Tenta parsear como JSON puro
        try {
          const json = JSON.parse(text);
          onComplete && onComplete(json);
        } catch (err) {
          console.error("❌ Erro ao parsear JSON:", text);
          onError && onError(err);
        }
      }
    } catch (err) {
      console.error("❌ Erro na requisição fetch:", err);
      onError && onError(err);
    }
  }
}

// ========================
// Exemplo de uso
(async () => {
  const client = new HttpStreamClient("http://localhost:1337");

  // 1. Envia initialize com todos os campos obrigatórios
  const initPayload = {
    jsonrpc: "2.0",
    id: "1",
    method: "initialize",
    params: {
      protocolVersion: "2024-08-05",
      clientInfo: { name: "mcp-js-client", version: "0.1.0" },
      capabilities: {}
    }
  };

  await client.sendRequest(
    initPayload,
    async (resp) => {
      console.log("INIT RESPONSE:", resp);
      // 2. Envia notification initialized
      const initializedNotif = {
        jsonrpc: "2.0",
        method: "initialized",
        params: {}
      };
      await client.sendRequest(initializedNotif, (r) => console.log("INITIALIZED NOTIF RESPONSE:", r));
      // 3. Agora pode chamar tools normalmente
      const toolRequest = {
        jsonrpc: "2.0",
        id: "2",
        method: "tools/list",
        params: {}
      };
        await client.sendRequest(toolRequest, (final) => {
          console.log("TOOL RESULT:", JSON.stringify(final));
          // Imprime a lista de métodos disponíveis
          if (final && final.result && Array.isArray(final.result.tools)) {
            console.log("\nMétodos disponíveis:");
            final.result.tools.forEach((tool, idx) => {
              console.log(`- ${tool.name}`);
            });
            // Busca o nome exato da tool send_whatsapp_message
            const sendMsgTool = final.result.tools.find(t => t.name.includes("send_whatsapp_message"));
            if (sendMsgTool) {
              const sendMessagePayload = {
                jsonrpc: "2.0",
                id: "3",
                method: sendMsgTool.name,
                params: {
                  to: "5511999999999", // Substitua por um ID real de teste
                  content: "Olá, esta é uma mensagem de teste enviada via MCP!"
                  // quotedMsgId: "opcional_id" // descomente se quiser responder a uma mensagem específica
                }
              };
              client.sendRequest(sendMessagePayload, (resp) => {
                console.log("SEND WHATSAPP MESSAGE RESULT:", JSON.stringify(resp));
              });
            } else {
              console.warn("Tool send_whatsapp_message não encontrada na lista de métodos disponíveis.");
            }

            // Teste: chama a tool example_tool
            const exampleTool = final.result.tools.find(t => t.name === "example_tool");
            if (exampleTool) {
              const examplePayload = {
                jsonrpc: "2.0",
                id: "4",
                method: exampleTool.name,
                params: {
                  message: "Mensagem de teste para example_tool"
                }
              };
              client.sendRequest(examplePayload, (resp) => {
                console.log("EXAMPLE TOOL RESULT:", JSON.stringify(resp));
              });
            } else {
              console.warn("Tool example_tool não encontrada na lista de métodos disponíveis.");
            }
          }
        });
    },
    (err) => console.error("INIT ERROR:", err)
  );
})();
