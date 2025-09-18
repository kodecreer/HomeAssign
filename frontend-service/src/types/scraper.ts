export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  images: string[];
  links: string[];
  rawHtml: string;
}

export interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  categories: string[];
  metadata: {
    wordCount: number;
    readingTime: number;
    language: string;
  };
}