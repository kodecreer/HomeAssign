import axios from 'axios';

export interface AnalysisResult {
  analysis: string;
  url: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keyPoints?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  categories?: string[];
}

export interface StreamChunk {
  type: 'status' | 'partial' | 'complete' | 'error';
  content?: string;
  message?: string;
}

export class AIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
    this.apiKey = process.env.AI_SERVICE_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('AI_SERVICE_API_KEY environment variable is required');
    }
  }

  async analyzeContent(content: string, url: string): Promise<AnalysisResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/analyze/stream`,
        {
          content,
          url
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 400000 // 400 seconds for deepseek model (6+ minutes)
        }
      );

      // Collect all streaming chunks
      let fullAnalysis = '';
      const chunks: StreamChunk[] = [];
      
      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const parsedChunk: StreamChunk = JSON.parse(line);
              chunks.push(parsedChunk);
              
              if (parsedChunk.type === 'partial' && parsedChunk.content) {
                fullAnalysis += parsedChunk.content;
              } else if (parsedChunk.type === 'complete') {
                // Parse the final analysis into structured format
                const result = this.parseAnalysis(fullAnalysis, url);
                resolve(result);
                return;
              } else if (parsedChunk.type === 'error') {
                reject(new Error(parsedChunk.message || 'Analysis failed'));
                return;
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              continue;
            }
          }
        });

        response.data.on('end', () => {
          if (fullAnalysis) {
            const result = this.parseAnalysis(fullAnalysis, url);
            resolve(result);
          } else {
            reject(new Error('No analysis content received'));
          }
        });

        response.data.on('error', (error: Error) => {
          reject(new Error(`Stream error: ${error.message}`));
        });
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`AI analysis failed: ${error.response?.data?.detail || error.message}`);
      }
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Stream analysis with callback for real-time updates
  async analyzeContentStream(
    content: string, 
    url: string, 
    onChunk: (chunk: StreamChunk) => void
  ): Promise<AnalysisResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/analyze/stream`,
        {
          content,
          url
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 400000
        }
      );

      let fullAnalysis = '';
      
      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const parsedChunk: StreamChunk = JSON.parse(line);
              
              // Send chunk to callback for real-time streaming
              onChunk(parsedChunk);
              
              if (parsedChunk.type === 'partial' && parsedChunk.content) {
                fullAnalysis += parsedChunk.content;
              } else if (parsedChunk.type === 'complete') {
                const result = this.parseAnalysis(fullAnalysis, url);
                resolve(result);
                return;
              } else if (parsedChunk.type === 'error') {
                reject(new Error(parsedChunk.message || 'Analysis failed'));
                return;
              }
            } catch (parseError) {
              continue;
            }
          }
        });

        response.data.on('end', () => {
          if (fullAnalysis) {
            const result = this.parseAnalysis(fullAnalysis, url);
            resolve(result);
          } else {
            reject(new Error('No analysis content received'));
          }
        });

        response.data.on('error', (error: Error) => {
          reject(new Error(`Stream error: ${error.message}`));
        });
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`AI analysis failed: ${error.response?.data?.detail || error.message}`);
      }
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseAnalysis(analysisText: string, url: string): AnalysisResult {
    // Extract content after </think> tag if present
    let cleanText = analysisText;
    if (analysisText.includes('</think>')) {
      cleanText = analysisText.split('</think>').pop()?.trim() || analysisText;
    }
    
    // Parse structured sections
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    
    const lines = cleanText.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
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
    
    return {
      analysis: cleanText,
      url,
      strengths,
      weaknesses,
      recommendations
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}