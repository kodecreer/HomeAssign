import type { StreamChunk, AnalysisResult } from '../types/scraper';

const API_BASE_URL = 'http://localhost:3000/api';

export class ApiService {
  static async analyzeUrlStream(
    url: string,
    onChunk: (chunk: StreamChunk) => void,
    includeScreenshot?: boolean
  ): Promise<AnalysisResult> {
    // First, scrape content using server-side scraper
    onChunk({ type: 'status', message: 'Scraping webpage content...' });
    
    let content: string;
    try {
      const scrapeResponse = await fetch(`http://localhost:3000/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!scrapeResponse.ok) {
        throw new Error(`Failed to scrape URL: ${scrapeResponse.status}`);
      }
      
      const scrapedData = await scrapeResponse.json();
      content = scrapedData.content;
      
      if (!content || content.length < 10) {
        throw new Error('Unable to extract meaningful content from webpage');
      }
      
      onChunk({ 
        type: 'scraped', 
        content: `Content scraped (${content.length} characters)` 
      });
      
    } catch (error) {
      throw new Error(`Content scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Send to backend for analysis
    const response = await fetch(`${API_BASE_URL}/analyze/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        url, 
        content,
        includeScreenshot: includeScreenshot || false
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: AnalysisResult | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const chunk: StreamChunk = JSON.parse(line.slice(6));
              onChunk(chunk);

              // Handle complete chunk with final result
              if (chunk.type === 'complete' && chunk.data) {
                try {
                  // Extract the complete data from the backend response
                  const data = (chunk as any).data;
                  
                  finalResult = {
                    analysis: data.analysis || '',
                    url: data.url || url,
                    strengths: data.strengths || [],
                    weaknesses: data.weaknesses || [],
                    recommendations: data.recommendations || [],
                    screenshot: data.screenshot || null,
                    metadata: data.metadata || {}
                  };
                } catch (parseError) {
                  console.warn('Failed to parse analysis content:', parseError);
                  // Still remove thinking tags even if parsing fails
                  let cleanContent = chunk.content;
                  if (cleanContent.includes('<think>') && cleanContent.includes('</think>')) {
                    cleanContent = cleanContent.split('</think>').pop()?.trim() || cleanContent;
                  }
                  finalResult = {
                    analysis: cleanContent,
                    url,
                    strengths: [],
                    weaknesses: [],
                    recommendations: []
                  };
                }
              }
            } catch (error) {
              console.warn('Failed to parse chunk:', error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!finalResult) {
      throw new Error('No analysis result received');
    }

    return finalResult;
  }

  static async analyzeUrl(url: string): Promise<AnalysisResult> {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}