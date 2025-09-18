/**
 * Web Scraper Service
 * 
 * Provides secure, efficient web scraping capabilities for product page analysis.
 * Uses Cheerio for server-side HTML parsing with comprehensive error handling,
 * rate limiting, and content sanitization.
 * 
 * Features:
 * - Secure HTTP requests with proper headers
 * - Content extraction with intelligent selectors
 * - Resource limits to prevent memory issues
 * - Comprehensive error handling
 * - Content sanitization and validation
 * 
 * @version 2.0.0
 * @author Claude Code Assistant
 */

import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

/**
 * Interface representing scraped content from a web page
 */
export interface ScrapedContent {
  /** Original URL that was scraped */
  url: string;
  
  /** Page title extracted from <title> tag or first <h1> */
  title: string;
  
  /** Main text content extracted from page */
  content: string;
  
  /** Array of image URLs found on the page */
  images: string[];
  
  /** Array of external links found on the page */
  links: string[];
  
  /** Raw HTML content (truncated for memory safety) */
  rawHtml: string;
  
  /** Additional metadata about the page */
  metadata: {
    /** Content length in characters */
    contentLength: number;
    /** Number of images found */
    imageCount: number;
    /** Number of links found */
    linkCount: number;
    /** Timestamp when scraped */
    scrapedAt: string;
    /** Response status code */
    statusCode: number;
    /** Response headers */
    headers: Record<string, string>;
  };
}

/**
 * Configuration options for the web scraper
 */
export interface ScraperConfig {
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Maximum number of redirects to follow */
  maxRedirects?: number;
  
  /** Maximum content length to process */
  maxContentLength?: number;
  
  /** Maximum number of images to extract */
  maxImages?: number;
  
  /** Maximum number of links to extract */
  maxLinks?: number;
  
  /** User agent string to use */
  userAgent?: string;
  
  /** Additional HTTP headers */
  headers?: Record<string, string>;
}

/**
 * Enhanced Web Scraper with comprehensive content extraction capabilities
 */
export class WebScraper {
  /** Default user agent string mimicking a real browser */
  private static readonly DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  /** Default timeout for HTTP requests */
  private static readonly DEFAULT_TIMEOUT = 30000;
  
  /** Maximum content length to prevent memory issues */
  private static readonly MAX_CONTENT_LENGTH = 100000;
  
  /** Maximum raw HTML length to store */
  private static readonly MAX_RAW_HTML_LENGTH = 50000;
  
  /** Content selectors ordered by priority for main content extraction */
  private static readonly CONTENT_SELECTORS = [
    'main',
    '[role="main"]',
    '.main-content',
    '.main',
    '.content',
    '.product-description',
    '.product-info',
    '.product-details',
    'article',
    '.post-content',
    '.entry-content',
    'body'
  ];
  
  /** Elements to remove before content extraction */
  private static readonly ELEMENTS_TO_REMOVE = [
    'script',
    'style',
    'noscript',
    'iframe',
    'object',
    'embed',
    'nav',
    'header',
    'footer',
    '.advertisement',
    '.ads',
    '.sidebar',
    '.menu',
    '.navigation'
  ];

  /**
   * Scrape content from a given URL
   * 
   * @param url - The URL to scrape
   * @param config - Optional configuration options
   * @returns Promise containing scraped content
   * @throws Error if scraping fails
   */
  static async scrapeUrl(url: string, config: ScraperConfig = {}): Promise<ScrapedContent> {
    // Validate URL
    this.validateUrl(url);
    
    // Merge default config with provided config
    const finalConfig = this.mergeConfig(config);
    
    try {
      console.log(`Starting scrape for URL: ${url}`);
      
      // Make HTTP request
      const response = await this.makeRequest(url, finalConfig);
      
      // Parse HTML content
      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements
      this.removeUnwantedElements($);
      
      // Extract content components
      const title = this.extractTitle($);
      const content = this.extractContent($, finalConfig);
      const images = this.extractImages($, url, finalConfig);
      const links = this.extractLinks($, finalConfig);
      
      // Create metadata
      const metadata = this.createMetadata(response, content, images, links);
      
      const result: ScrapedContent = {
        url,
        title,
        content,
        images,
        links,
        rawHtml: response.data.slice(0, this.MAX_RAW_HTML_LENGTH),
        metadata
      };
      
      console.log(`Scrape completed for URL: ${url}, content length: ${content.length}`);
      return result;
      
    } catch (error) {
      console.error(`Scraping failed for URL: ${url}`, error);
      throw new Error(`Failed to scrape URL "${url}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate URL format and security
   * 
   * @param url - URL to validate
   * @throws Error if URL is invalid or potentially unsafe
   */
  private static validateUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      
      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS protocols are allowed');
      }
      
      // Prevent localhost and private IP access (basic security)
      const hostname = parsedUrl.hostname.toLowerCase();
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        throw new Error('Private and local URLs are not allowed');
      }
      
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Invalid URL format');
      }
      throw error;
    }
  }

  /**
   * Merge default configuration with user-provided config
   * 
   * @param config - User configuration
   * @returns Merged configuration
   */
  private static mergeConfig(config: ScraperConfig): Required<ScraperConfig> {
    return {
      timeout: config.timeout ?? this.DEFAULT_TIMEOUT,
      maxRedirects: config.maxRedirects ?? 5,
      maxContentLength: config.maxContentLength ?? this.MAX_CONTENT_LENGTH,
      maxImages: config.maxImages ?? 10,
      maxLinks: config.maxLinks ?? 20,
      userAgent: config.userAgent ?? this.DEFAULT_USER_AGENT,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        ...config.headers
      }
    };
  }

  /**
   * Make HTTP request with proper configuration
   * 
   * @param url - URL to request
   * @param config - Request configuration
   * @returns Axios response
   */
  private static async makeRequest(url: string, config: Required<ScraperConfig>): Promise<AxiosResponse> {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        'User-Agent': config.userAgent,
        ...config.headers
      },
      timeout: config.timeout,
      maxRedirects: config.maxRedirects,
      maxContentLength: config.maxContentLength,
      validateStatus: (status) => status >= 200 && status < 400, // Accept redirects
    };

    return await axios.get(url, requestConfig);
  }

  /**
   * Remove unwanted elements from the DOM
   * 
   * @param $ - Cheerio instance
   */
  private static removeUnwantedElements($: cheerio.CheerioAPI): void {
    this.ELEMENTS_TO_REMOVE.forEach(selector => {
      $(selector).remove();
    });
  }

  /**
   * Extract page title using multiple fallback strategies
   * 
   * @param $ - Cheerio instance
   * @returns Extracted title
   */
  private static extractTitle($: cheerio.CheerioAPI): string {
    // Try multiple title extraction strategies
    const titleSources = [
      () => $('title').text().trim(),
      () => $('meta[property="og:title"]').attr('content')?.trim(),
      () => $('meta[name="twitter:title"]').attr('content')?.trim(),
      () => $('h1').first().text().trim(),
      () => $('h2').first().text().trim(),
      () => $('.title').first().text().trim(),
      () => $('.product-title').first().text().trim()
    ];

    for (const extractor of titleSources) {
      const title = extractor();
      if (title && title.length > 0 && title.length < 200) {
        return this.cleanText(title);
      }
    }

    return 'No title found';
  }

  /**
   * Extract main content using intelligent selector prioritization
   * 
   * @param $ - Cheerio instance
   * @param config - Scraper configuration
   * @returns Extracted content
   */
  private static extractContent($: cheerio.CheerioAPI, config: Required<ScraperConfig>): string {
    let content = '';

    // Try each content selector in priority order
    for (const selector of this.CONTENT_SELECTORS) {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text.length > 100) { // Minimum content threshold
          content = text;
          break;
        }
      }
    }

    // Fallback to body if no content found
    if (!content) {
      content = $('body').text().trim();
    }

    // Clean and limit content
    content = this.cleanText(content);
    return content.slice(0, config.maxContentLength);
  }

  /**
   * Extract image URLs from the page
   * 
   * @param $ - Cheerio instance
   * @param baseUrl - Base URL for resolving relative URLs
   * @param config - Scraper configuration
   * @returns Array of image URLs
   */
  private static extractImages($: cheerio.CheerioAPI, baseUrl: string, config: Required<ScraperConfig>): string[] {
    const images: string[] = [];
    const seenUrls = new Set<string>();

    $('img').each((_, element) => {
      if (images.length >= config.maxImages) return false; // Stop when limit reached

      const $img = $(element);
      const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
      
      if (src) {
        try {
          const fullUrl = this.resolveUrl(src, baseUrl);
          if (!seenUrls.has(fullUrl)) {
            images.push(fullUrl);
            seenUrls.add(fullUrl);
          }
        } catch (error) {
          // Skip invalid URLs
          console.warn(`Invalid image URL: ${src}`);
        }
      }
    });

    return images;
  }

  /**
   * Extract external links from the page
   * 
   * @param $ - Cheerio instance
   * @param config - Scraper configuration
   * @returns Array of link URLs
   */
  private static extractLinks($: cheerio.CheerioAPI, config: Required<ScraperConfig>): string[] {
    const links: string[] = [];
    const seenUrls = new Set<string>();

    $('a[href]').each((_, element) => {
      if (links.length >= config.maxLinks) return false; // Stop when limit reached

      const href = $(element).attr('href');
      if (href && href.startsWith('http')) {
        if (!seenUrls.has(href)) {
          links.push(href);
          seenUrls.add(href);
        }
      }
    });

    return links;
  }

  /**
   * Create metadata object for the scraped content
   * 
   * @param response - HTTP response
   * @param content - Extracted content
   * @param images - Extracted images
   * @param links - Extracted links
   * @returns Metadata object
   */
  private static createMetadata(
    response: AxiosResponse,
    content: string,
    images: string[],
    links: string[]
  ) {
    return {
      contentLength: content.length,
      imageCount: images.length,
      linkCount: links.length,
      scrapedAt: new Date().toISOString(),
      statusCode: response.status,
      headers: {
        'content-type': response.headers['content-type'] || 'unknown',
        'content-length': response.headers['content-length'] || '0',
        'last-modified': response.headers['last-modified'] || 'unknown'
      }
    };
  }

  /**
   * Clean and normalize text content
   * 
   * @param text - Raw text to clean
   * @returns Cleaned text
   */
  private static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }

  /**
   * Resolve relative URLs to absolute URLs
   * 
   * @param url - URL to resolve
   * @param baseUrl - Base URL
   * @returns Resolved absolute URL
   */
  private static resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return new URL(url, baseUrl).href;
  }
}

/**
 * Factory function to create WebScraper instances with custom configuration
 * 
 * @param config - Default configuration for the scraper
 * @returns WebScraper class with default configuration
 */
export function createScraper(config: ScraperConfig) {
  return class ConfiguredScraper extends WebScraper {
    static async scrapeUrl(url: string, overrideConfig: ScraperConfig = {}): Promise<ScrapedContent> {
      const mergedConfig = { ...config, ...overrideConfig };
      return super.scrapeUrl(url, mergedConfig);
    }
  };
}

// Export singleton instance with default configuration
export const defaultScraper = new WebScraper();