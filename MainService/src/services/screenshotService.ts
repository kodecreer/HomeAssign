import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  fullPage?: boolean;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
  timeout?: number;
}

export interface ScreenshotResult {
  buffer: Buffer;
  base64: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    capturedAt: string;
    url: string;
  };
}

export class ScreenshotService {
  private static browser: Browser | null = null;

  private static async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  static async captureScreenshot(
    url: string,
    options: ScreenshotOptions = {}
  ): Promise<ScreenshotResult> {
    const {
      width = 1920,
      height = 1080,
      fullPage = true,
      quality = 80,
      format = 'jpeg',
      timeout = 60000
    } = options;

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Set viewport
      await page.setViewport({ width, height });

      // Set user agent to appear as regular browser
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      console.log(`📸 Attempting to navigate to ${url}...`);

      // Try multiple loading strategies
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout 
        });
      } catch (navigationError) {
        console.log(`📸 DOMContentLoaded failed, trying load event...`);
        await page.goto(url, { 
          waitUntil: 'load',
          timeout: timeout / 2 
        });
      }

      console.log(`📸 Page loaded, waiting for content to stabilize...`);

      // Wait a bit for any dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Take screenshot
      const screenshotOptions: any = {
        type: format,
        fullPage,
      };

      if (format === 'jpeg') {
        screenshotOptions.quality = quality;
      }

      const screenshotBuffer = await page.screenshot(screenshotOptions);
      const buffer = Buffer.isBuffer(screenshotBuffer) ? screenshotBuffer : Buffer.from(screenshotBuffer as string);
      const base64 = buffer.toString('base64');

      const result: ScreenshotResult = {
        buffer,
        base64,
        metadata: {
          width,
          height,
          format,
          size: buffer.length,
          capturedAt: new Date().toISOString(),
          url
        }
      };

      return result;

    } finally {
      await page.close();
    }
  }

  static async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      await page.close();
      return true;
    } catch (error) {
      console.error('Screenshot service health check failed:', error);
      return false;
    }
  }
}

// Cleanup on process exit
process.on('exit', () => {
  ScreenshotService.cleanup();
});

process.on('SIGINT', async () => {
  await ScreenshotService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await ScreenshotService.cleanup();
  process.exit(0);
});