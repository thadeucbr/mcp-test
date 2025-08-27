import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import axios from 'axios';
import OpenAI from 'openai';

interface WebSearchInput {
  query: string;
}

// Tool: WebSearchTool
// Description: Esta ferramenta realiza uma busca na web usando um provedor de busca configurado e retorna os resultados com citações.
class WebSearchTool extends MCPTool<WebSearchInput> {
  name = 'web_search';
  description = `Perform web searches to get current information, news, facts, or research data from the internet.
  
  Use this tool when you need:
  - Current news, events, or recent developments
  - Factual information that may have changed since your last training
  - Research data, statistics, or documentation
  - Verification of current information
  - Finding specific websites or resources
  
  The tool automatically uses the configured provider (SEARCH_PROVIDER in environment).
  Results include both content and source citations for verification.`;

  schema = {
    query: {
      type: z.string(),
      description: `The search query to execute. Be specific and use natural language.
      
      Examples:
      - "Latest news about artificial intelligence in 2024"
      - "How to configure PostgreSQL replication"
      - "Current weather in São Paulo"
      - "Best practices for React component optimization"
      
      Tips for better results:
      - Use complete sentences for complex queries
      - Include specific terms, dates, or locations when relevant
      - Avoid overly broad queries that return too many results`,
    },
  };

  async execute(input: WebSearchInput) {
    console.log('[DEBUG] WebSearchTool.execute chamado com input:', input);
    const { query } = input;

    const provider = process.env.SEARCH_PROVIDER || 'google';

    if (provider === 'google') {
      return this.searchWithGoogle(query);
    } else if (provider === 'openai') {
      return this.searchWithOpenAI(query);
    } else {
      return {
        success: false,
        data: 'Provedor de busca não suportado. Configure SEARCH_PROVIDER no .env para "google" ou "openai".'
      };
    }
  }

  /**
   * Perform web search using Google Custom Search API
   * Returns structured results with titles, links, and snippets
   */
  private async searchWithGoogle(query: string) {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CSE_ID;
    const url = 'https://www.googleapis.com/customsearch/v1';

    if (!apiKey || !cx) {
      return { success: false, data: 'GOOGLE_API_KEY e GOOGLE_CSE_ID não estão configurados no .env' };
    }

    const options = {
      params: {
        key: apiKey,
        cx: cx,
        q: query,
      },
    };

    try {
      const response = await axios.get(url, options);
      const results = response.data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));

      return {
        success: true,
        data: {
          results: results,
          provider: 'google',
          query: query,
          totalResults: response.data.searchInformation?.totalResults || results.length
        }
      };
    } catch (error: any) {
      console.error('Error during Google web search:', error);
      return { success: false, data: error.message };
    }
  }

  /**
   * Perform web search using OpenAI's built-in web search capability
   * Returns AI-generated response with citations and source links
   */
  private async searchWithOpenAI(query: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { success: false, data: 'OPENAI_API_KEY não está configurado no .env' };
    }

    const openai = new OpenAI({ apiKey });

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-search-preview',
        web_search_options: {},
        messages: [
          {
            role: 'user',
            content: query
          }
        ]
      });

      const message = completion.choices[0].message;
      const content = message.content;
      const annotations = message.annotations || [];

      // Extract citations from annotations
      const citations = annotations
        .filter((annotation: any) => annotation.type === 'url_citation')
        .map((annotation: any) => ({
          title: annotation.url_citation.title,
          url: annotation.url_citation.url,
          start_index: annotation.url_citation.start_index,
          end_index: annotation.url_citation.end_index
        }));

      return {
        success: true,
        data: {
          content: content || 'No content returned from search',
          citations: citations,
          provider: 'openai',
          query: query
        }
      };
    } catch (error: any) {
      console.error('Error during OpenAI web search:', error);
      return { success: false, data: error.message };
    }
  }
}

export default WebSearchTool;

/*
Return Format:
Google Provider:
{
  success: true,
  data: {
    results: [
      { title: string, link: string, snippet: string }
    ],
    provider: 'google',
    query: string,
    totalResults: number
  }
}

OpenAI Provider:
{
  success: true,
  data: {
    content: string,
    citations: [
      { title: string, url: string, start_index: number, end_index: number }
    ],
    provider: 'openai',
    query: string
  }
}

Error Format:
{
  success: false,
  data: string (error message)
}
*/
