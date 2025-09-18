import React, { useState } from 'react';
import UrlInput from './components/UrlInput';
import AnalysisDisplay from './components/AnalysisDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { ApiService } from './services/api';
import type { AnalysisResult, StreamChunk } from './types/scraper';
import './App.css';

function App() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamingMessages, setStreamingMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeUrl = async (url: string) => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setStreamingMessages([]);

    try {
      const result = await ApiService.analyzeUrlStream(url, (chunk: StreamChunk) => {
        // Handle real-time streaming updates
        if (chunk.type === 'status' && chunk.message) {
          setStreamingMessages(prev => [...prev, `📡 ${chunk.message}`]);
        } else if (chunk.type === 'scraped' && chunk.content) {
          setStreamingMessages(prev => [...prev, `📄 Content scraped (${chunk.content.length} characters)`]);
        } else if (chunk.type === 'partial' && chunk.content) {
          setStreamingMessages(prev => [...prev, `🤖 AI generating analysis...`]);
        } else if (chunk.type === 'metadata' && chunk.metadata) {
          setStreamingMessages(prev => [...prev, `📊 Analysis complete`]);
        }
      });
      
      setAnalysisResult(result);
      setStreamingMessages(prev => [...prev, `✅ Analysis completed successfully!`]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze URL');
      setStreamingMessages(prev => [...prev, `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔍 Product Page Reviewer</h1>
        <p>Analyze any webpage with AI-powered insights in real-time</p>
      </header>

      <main className="App-main">
        <UrlInput onSubmit={handleAnalyzeUrl} loading={loading} />
        
        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {loading && (
          <div className="streaming-container">
            <LoadingSpinner message="Analyzing webpage..." />
            <div className="streaming-messages">
              {streamingMessages.map((message, index) => (
                <div key={index} className="streaming-message">
                  {message}
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisResult && <AnalysisDisplay result={analysisResult} />}
      </main>
    </div>
  );
}

export default App;