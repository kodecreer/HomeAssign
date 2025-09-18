import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  images: string[];
  links: string[];
  rawHtml: string;
}

export class WebScraper {
  private static readonly USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
  private static readonly TIMEOUT = 30000;

  static async scrapeUrl(url: string): Promise<ScrapedContent> {
    try {
      const response = await axios.get(url, {
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
      const images: string[] = [];
      $('img').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
          const fullUrl = src.startsWith('http') ? src : new URL(src, url).href;
          images.push(fullUrl);
        }
      });
      
      // Extract links
      const links: string[] = [];
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
        links: links.slice(0, 20),   // Limit links
        rawHtml: response.data.slice(0, 10000) // Limit raw HTML
      };
      
    } catch (error) {
      throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}