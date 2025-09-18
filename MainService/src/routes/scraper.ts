import express from 'express';
import { WebScraper } from '../services/scraper';

const router = express.Router();

router.post('/scrape', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const scrapedContent = await WebScraper.scrapeUrl(url);
    res.json(scrapedContent);
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to scrape URL' 
    });
  }
});

export default router;