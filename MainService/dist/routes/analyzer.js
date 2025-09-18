"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scraper_1 = require("../services/scraper");
const aiClient_1 = require("../services/aiClient");
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
router.post('/analyze/stream', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        // Validate URL format
        try {
            new URL(url);
        }
        catch {
            return res.status(400).json({ error: 'Invalid URL format' });
        }
        console.log(`Starting streaming analysis for URL: ${url}`);
        // Set up SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });
        // Send initial status
        res.write(`data: ${JSON.stringify({ type: 'status', message: 'Starting web scraping...' })}\n\n`);
        try {
            // Scrape the webpage
            const scrapedContent = await scraper_1.WebScraper.scrapeUrl(url);
            console.log(`Scraped content length: ${scrapedContent.content.length} characters`);
            res.write(`data: ${JSON.stringify({ type: 'status', message: 'Content scraped, starting AI analysis...' })}\n\n`);
            res.write(`data: ${JSON.stringify({ type: 'scraped', content: scrapedContent.content })}\n\n`);
            // Stream AI analysis
            const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
            const apiKey = process.env.AI_SERVICE_API_KEY || '';
            const response = await axios_1.default.post(`${aiServiceUrl}/analyze/stream`, {
                content: scrapedContent.content,
                url: url
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream',
                timeout: 600000 // 10 minutes for streaming
            });
            let fullAnalysis = '';
            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.type === 'partial') {
                                fullAnalysis += parsed.content;
                            }
                            res.write(`data: ${line}\n\n`);
                        }
                        catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            });
            response.data.on('end', () => {
                // Send final metadata
                const metadata = {
                    title: scrapedContent.title,
                    imageCount: scrapedContent.images.length,
                    linkCount: scrapedContent.links.length,
                    contentLength: scrapedContent.content.length,
                    scrapedAt: new Date().toISOString()
                };
                res.write(`data: ${JSON.stringify({
                    type: 'metadata',
                    metadata: metadata
                })}\n\n`);
                res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
                res.end();
            });
            response.data.on('error', (error) => {
                console.error('Stream error:', error);
                res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
                res.end();
            });
        }
        catch (error) {
            console.error('Analysis error:', error);
            res.write(`data: ${JSON.stringify({
                type: 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
            })}\n\n`);
            res.end();
        }
    }
    catch (error) {
        console.error('Streaming analysis error:', error);
        res.status(500).json({
            error: 'Streaming analysis failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/analyze', async (req, res) => {
    try {
        const scrapedContent = req.body;
        if (!scrapedContent || !scrapedContent.content) {
            return res.status(400).json({ error: 'Scraped content is required' });
        }
        console.log(`Starting analysis for content length: ${scrapedContent.content.length} characters`);
        // Analyze with AI
        const aiClient = new aiClient_1.AIClient();
        const analysis = await aiClient.analyzeContent(scrapedContent.content, scrapedContent.url);
        // Transform analysis to match frontend interface
        const result = {
            summary: analysis.analysis || 'No analysis available',
            keyPoints: analysis.keyPoints || [],
            sentiment: analysis.sentiment || 'neutral',
            categories: analysis.categories || [],
            metadata: {
                wordCount: scrapedContent.content.split(' ').length,
                readingTime: Math.ceil(scrapedContent.content.split(' ').length / 200),
                language: 'en'
            }
        };
        console.log(`Analysis completed for content`);
        res.json(result);
    }
    catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const aiClient = new aiClient_1.AIClient();
        const aiHealthy = await aiClient.healthCheck();
        res.json({
            status: 'healthy',
            aiService: aiHealthy ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=analyzer.js.map