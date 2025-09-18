"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebScraper = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
class WebScraper {
    static async scrapeUrl(url) {
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': this.USER_AGENT,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                },
                timeout: this.TIMEOUT,
                maxRedirects: 5,
            });
            const $ = cheerio.load(response.data);
            // Remove script and style elements
            $('script, style, noscript').remove();
            // Extract title
            const title = $('title').text().trim() || $('h1').first().text().trim() || 'No title found';
            // Extract main content
            const contentSelectors = [
                'main',
                '[role="main"]',
                '.main-content',
                '.content',
                '.product-description',
                '.product-info',
                'article',
                'body'
            ];
            let content = '';
            for (const selector of contentSelectors) {
                const element = $(selector);
                if (element.length && element.text().trim().length > 100) {
                    content = element.text().trim();
                    break;
                }
            }
            if (!content) {
                content = $('body').text().trim();
            }
            // Clean up content
            content = content.replace(/\s+/g, ' ').slice(0, 5000);
            // Extract images
            const images = [];
            $('img').each((_, element) => {
                const src = $(element).attr('src');
                if (src) {
                    const fullUrl = src.startsWith('http') ? src : new URL(src, url).href;
                    images.push(fullUrl);
                }
            });
            // Extract links
            const links = [];
            $('a[href]').each((_, element) => {
                const href = $(element).attr('href');
                if (href && href.startsWith('http')) {
                    links.push(href);
                }
            });
            return {
                url,
                title,
                content,
                images: images.slice(0, 10), // Limit images
                links: links.slice(0, 20), // Limit links
                rawHtml: response.data.slice(0, 10000) // Limit raw HTML
            };
        }
        catch (error) {
            throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.WebScraper = WebScraper;
WebScraper.USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
WebScraper.TIMEOUT = 30000;
//# sourceMappingURL=scraper.js.map