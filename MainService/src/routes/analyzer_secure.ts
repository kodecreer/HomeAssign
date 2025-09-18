/**
 * Secure Product Page Analyzer Routes
 * 
 * This module provides secure API endpoints for product page analysis.
 * Security improvements:
 * - Removed server-side web scraping (major security vulnerability)
 * - Content extraction moved to client-side
 * - Input validation and sanitization
 * - Rate limiting ready
 * - Comprehensive error handling
 * 
 * @version 2.0.0
 * @author Kode Creer <kode.creer@gmail.com>
 */

import express from 'express';
import { AIClient } from '../services/aiClient';
import { ScreenshotService } from '../services/screenshotService';
import rateLimit from 'express-rate-limit';
import validator from 'validator';

const router = express.Router();

/**
 * Interface for secure analysis request
 */
interface SecureAnalyzeRequest {
  url: string;
  content: string;
  includeScreenshot?: boolean;
  metadata?: {
    title?: string;
    description?: string;
    imageCount?: number;
    linkCount?: number;
  };
}

/**
 * Rate limiting configuration
 * Prevents abuse and DoS attacks
 */
const analyzeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many analysis requests',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Input validation middleware
 */
const validateAnalysisInput = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { url, content }: SecureAnalyzeRequest = req.body;

  // Validate required fields
  if (!url || !content) {
    return res.status(400).json({
      error: 'Missing required fields',
      details: 'Both url and content are required'
    });
  }

  // Validate URL format
  if (!validator.isURL(url, { 
    protocols: ['http', 'https'],
    require_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false
  })) {
    return res.status(400).json({
      error: 'Invalid URL format',
      details: 'URL must be a valid HTTP/HTTPS URL'
    });
  }

  // Validate content length
  if (content.length < 10) {
    return res.status(400).json({
      error: 'Content too short',
      details: 'Content must be at least 10 characters'
    });
  }

  if (content.length > 100000) { // 100KB limit
    return res.status(400).json({
      error: 'Content too large',
      details: 'Content must be less than 100KB'
    });
  }

  // Sanitize content (remove potential script tags and suspicious content)
  const sanitizedContent = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');

  // Update request with sanitized content
  req.body.content = sanitizedContent;

  next();
};

/**
 * POST /api/analyze
 * Secure content analysis endpoint
 * 
 * Security features:
 * - No server-side web scraping
 * - Input validation and sanitization
 * - Rate limiting
 * - Content size limits
 * - URL validation
 */
router.post('/analyze', 
  analyzeRateLimit,
  validateAnalysisInput,
  async (req: express.Request, res: express.Response) => {
    try {
      const { url, content, metadata }: SecureAnalyzeRequest = req.body;

      console.log(`Starting secure analysis for URL: ${url}`);
      console.log(`Content length: ${content.length} characters`);

      // Analyze with AI service
      const aiClient = new AIClient();
      const analysis = await aiClient.analyzeContent(content, url);

      // Combine results with client-provided metadata
      const result = {
        ...analysis,
        url,
        metadata: {
          contentLength: content.length,
          analyzedAt: new Date().toISOString(),
          source: 'client-extraction',
          ...metadata // Include client-provided metadata if available
        }
      };

      console.log(`Secure analysis completed for URL: ${url}`);
      res.json(result);

    } catch (error) {
      console.error('Secure analysis error:', error);
      
      // Determine error type and respond appropriately
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          res.status(408).json({
            error: 'Analysis timeout',
            message: 'The analysis took too long to complete. Please try again.',
            retryable: true
          });
        } else if (error.message.includes('rate limit')) {
          res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryable: true
          });
        } else {
          res.status(500).json({
            error: 'Analysis failed',
            message: 'Unable to complete analysis at this time.',
            retryable: true
          });
        }
      } else {
        res.status(500).json({
          error: 'Unknown error',
          message: 'An unexpected error occurred.',
          retryable: false
        });
      }
    }
  }
);

/**
 * POST /api/analyze/stream
 * Secure streaming analysis endpoint
 * 
 * Note: Streaming analysis with client-side content extraction
 */
router.post('/analyze/stream',
  analyzeRateLimit,
  validateAnalysisInput,
  async (req: express.Request, res: express.Response) => {
    try {
      const { url, content, includeScreenshot, metadata }: SecureAnalyzeRequest = req.body;

      console.log(`Starting secure streaming analysis for URL: ${url}`);
      console.log(`Request body:`, JSON.stringify(req.body, null, 2));
      console.log(`Screenshot requested: ${includeScreenshot ? 'Yes' : 'No'}`);

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial status
      res.write(`data: ${JSON.stringify({
        type: 'status', 
        message: 'AI model is loading...'
      })}\n\n`);

      let screenshotData = null;

      // Optionally capture screenshot
      if (includeScreenshot) {
        try {
          res.write(`data: ${JSON.stringify({
            type: 'status', 
            message: 'Capturing webpage screenshot...'
          })}\n\n`);

          screenshotData = await ScreenshotService.captureScreenshot(url, {
            width: 1920,
            height: 1080,
            fullPage: true,
            format: 'jpeg',
            quality: 80
          });

          // Log screenshot info with base64 preview
          console.log(`📸 Screenshot captured for ${url}:`);
          console.log(`   Size: ${screenshotData.metadata.size} bytes`);
          console.log(`   Dimensions: ${screenshotData.metadata.width}x${screenshotData.metadata.height}`);
          console.log(`   Format: ${screenshotData.metadata.format}`);
          console.log(`   Base64 preview: data:image/${screenshotData.metadata.format};base64,${screenshotData.base64.substring(0, 100)}...`);

          res.write(`data: ${JSON.stringify({
            type: 'status', 
            message: 'Screenshot captured, analyzing content...'
          })}\n\n`);

        } catch (screenshotError) {
          console.warn('Screenshot capture failed:', screenshotError);
          res.write(`data: ${JSON.stringify({
            type: 'status', 
            message: 'Screenshot capture failed, continuing with text analysis...'
          })}\n\n`);
        }
      }

      // Analyze with AI service (streaming)
      const aiClient = new AIClient();
      
      try {
        // Prepare content for analysis
        let analysisContent = content;
        if (screenshotData) {
          analysisContent += `\n\n[VISUAL ANALYSIS] A screenshot of the webpage has been captured for visual analysis.`;
        }

        // Use streaming analysis with real-time updates
        const analysis = await aiClient.analyzeContentStream(analysisContent, url, (chunk) => {
          // Forward streaming chunks to client
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        });

        // Send final results with metadata
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          data: {
            ...analysis,
            url,
            screenshot: screenshotData ? {
              format: screenshotData.metadata.format,
              size: screenshotData.metadata.size,
              dimensions: {
                width: screenshotData.metadata.width,
                height: screenshotData.metadata.height
              },
              capturedAt: screenshotData.metadata.capturedAt,
              base64: screenshotData.base64,
              dataUrl: `data:image/${screenshotData.metadata.format};base64,${screenshotData.base64}`
            } : null,
            metadata: {
              contentLength: content.length,
              analyzedAt: new Date().toISOString(),
              source: 'client-extraction',
              includeScreenshot: includeScreenshot || false,
              ...metadata
            }
          }
        })}\n\n`);

        res.write(`data: ${JSON.stringify({type: 'done'})}\n\n`);
        res.end();

      } catch (analysisError) {
        console.error('Streaming analysis error:', analysisError);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: analysisError instanceof Error ? analysisError.message : 'Unknown error'
        })}\n\n`);
        res.end();
      }

    } catch (error) {
      console.error('Secure streaming analysis error:', error);
      res.status(500).json({
        error: 'Streaming analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (_req, res: express.Response) => {
  try {
    const aiClient = new AIClient();
    const aiHealthy = await aiClient.healthCheck();
    const screenshotHealthy = await ScreenshotService.healthCheck();

    res.json({
      status: 'healthy',
      version: '2.0.0',
      features: {
        clientSideExtraction: true,
        serverSideScraping: false,
        rateLimiting: true,
        inputValidation: true,
        optionalScreenshots: true
      },
      services: {
        aiService: aiHealthy ? 'connected' : 'disconnected',
        screenshotService: screenshotHealthy ? 'connected' : 'disconnected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;