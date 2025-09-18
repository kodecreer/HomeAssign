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
    //TODO Adjust this to take in the stream
    //TODO and restream it to the frontend.
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
          timeout: 400000 // 400 seconds for deepseek model (6+ minutes)
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`AI analysis failed: ${error.response?.data?.detail || error.message}`);
      }
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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