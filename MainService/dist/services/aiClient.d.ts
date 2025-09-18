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
export declare class AIClient {
    private baseUrl;
    private apiKey;
    constructor();
    analyzeContent(content: string, url: string): Promise<AnalysisResult>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=aiClient.d.ts.map