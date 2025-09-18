export interface ScrapedContent {
    url: string;
    title: string;
    content: string;
    images: string[];
    links: string[];
    rawHtml: string;
}
export declare class WebScraper {
    private static readonly USER_AGENT;
    private static readonly TIMEOUT;
    static scrapeUrl(url: string): Promise<ScrapedContent>;
}
//# sourceMappingURL=scraper.d.ts.map