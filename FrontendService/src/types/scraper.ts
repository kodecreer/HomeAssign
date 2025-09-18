export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  images: string[];
  links: string[];
  rawHtml: string;
}

export interface AnalysisResult {
  analysis: string;
  url: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keyPoints?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  categories?: string[];
  screenshot?: {
    format: string;
    size: number;
    dimensions: {
      width: number;
      height: number;
    };
    capturedAt: string;
    base64: string;
    dataUrl: string;
  };
  metadata?: {
    title?: string;
    imageCount?: number;
    linkCount?: number;
    contentLength?: number;
    scrapedAt?: string;
    includeScreenshot?: boolean;
  };
}

export interface StreamChunk {
  type: 'status' | 'partial' | 'complete' | 'error' | 'scraped' | 'metadata' | 'done';
  content?: string;
  message?: string;
  metadata?: any;
  data?: any; // For complete chunks with full analysis result
}