import type { StreamChunk, AnalysisResult } from '../types/scraper';

const API_BASE_URL = 'http://localhost:3000/api';

export class ApiService {
  static async analyzeUrlStream(
    url: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<AnalysisResult> {
    const response = await fetch(`${API_BASE_URL}/analyze/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
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
              if (chunk.type === 'complete' && chunk.content) {
                try {
                  // Remove thinking tags from content
                  let cleanContent = chunk.content;
                  if (cleanContent.includes('<think>') && cleanContent.includes('</think>')) {
                    cleanContent = cleanContent.split('</think>').pop()?.trim() || cleanContent;
                  }
                  
                  // Parse the final analysis result
                  const analysisLines = cleanContent.split('\n');
                  const strengths: string[] = [];
                  const weaknesses: string[] = [];
                  const recommendations: string[] = [];
                  
                  let currentSection = '';
                  
                  for (const line of analysisLines) {
                    const trimmedLine = line.trim();
                    
                    if (trimmedLine.toLowerCase().includes('strength')) {
                      currentSection = 'strengths';
                      continue;
                    } else if (trimmedLine.toLowerCase().includes('weakness')) {
                      currentSection = 'weaknesses';
                      continue;
                    } else if (trimmedLine.toLowerCase().includes('recommendation')) {
                      currentSection = 'recommendations';
                      continue;
                    }
                    
                    // Parse list items
                    if (trimmedLine.startsWith('-') || trimmedLine.match(/^\d+\./)) {
                      const item = trimmedLine.replace(/^[-\d\.]\s*/, '').trim();
                      if (item) {
                        if (currentSection === 'strengths') {
                          strengths.push(item);
                        } else if (currentSection === 'weaknesses') {
                          weaknesses.push(item);
                        } else if (currentSection === 'recommendations') {
                          recommendations.push(item);
                        }
                      }
                    }
                  }

                  finalResult = {
                    analysis: cleanContent,
                    url,
                    strengths,
                    weaknesses,
                    recommendations
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