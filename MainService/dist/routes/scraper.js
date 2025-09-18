"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scraper_1 = require("../services/scraper");
const router = express_1.default.Router();
router.post('/scrape', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        const scrapedContent = await scraper_1.WebScraper.scrapeUrl(url);
        res.json(scrapedContent);
    }
    catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to scrape URL'
        });
    }
});
exports.default = router;
//# sourceMappingURL=scraper.js.map