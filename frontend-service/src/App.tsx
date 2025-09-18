import React, { useState } from 'react';
import UrlInput from './components/UrlInput';
import ScrapedContentDisplay from './components/ScrapedContentDisplay';
import AnalysisDisplay from './components/AnalysisDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { ApiService } from './services/api';
import { ScrapedContent, AnalysisResult } from './types/scraper';
import './App.css';

function App() {
  const [scrapedContent, setScrapedContent] = useState<ScrapedContent | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScrapeUrl = async (url: string) => {
    setLoading(true);
    setError(null);
    setScrapedContent(null);
    setAnalysisResult(null);

    try {
      const content = await ApiService.scrapeUrl(url);
      setScrapedContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape URL');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeContent = async () => {
    if (!scrapedContent) return;

    setAnalyzing(true);
    setError(null);

    try {
      const result = await ApiService.analyzeContent(scrapedContent);
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔍 Product Page Reviewer</h1>
        <p>Analyze any webpage with AI-powered insights</p>
      </header>

      <main className="App-main">
        <UrlInput onSubmit={handleScrapeUrl} loading={loading} />
        
        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {loading && <LoadingSpinner message="Scraping webpage..." />}

        {scrapedContent && (
          <ScrapedContentDisplay 
            content={scrapedContent} 
            onAnalyze={handleAnalyzeContent}
            analyzing={analyzing}
          />
        )}

        {analyzing && <LoadingSpinner message="Analyzing content with AI..." />}

        {analysisResult && <AnalysisDisplay result={analysisResult} />}
      </main>
    </div>
  );
}

export default App;