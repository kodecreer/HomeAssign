import React from 'react';
import type { AnalysisResult } from '../types/scraper';
import './AnalysisDisplay.css';

interface AnalysisDisplayProps {
  result: AnalysisResult;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '#28a745';
      case 'negative': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="analysis-display">
      <h2>🎯 AI Analysis Results</h2>
      <p className="analysis-url">Analyzed: <a href={result.url} target="_blank" rel="noopener noreferrer">{result.url}</a></p>
      
      <div className="analysis-section">
        <h3>💪 Strengths</h3>
        {result.strengths.length > 0 ? (
          <ul className="strengths-list">
            {result.strengths.map((strength, index) => (
              <li key={index} className="strength-item">✅ {strength}</li>
            ))}
          </ul>
        ) : (
          <p className="empty-list">No strengths identified</p>
        )}
      </div>

      <div className="analysis-section">
        <h3>⚠️ Weaknesses</h3>
        {result.weaknesses.length > 0 ? (
          <ul className="weaknesses-list">
            {result.weaknesses.map((weakness, index) => (
              <li key={index} className="weakness-item">❌ {weakness}</li>
            ))}
          </ul>
        ) : (
          <p className="empty-list">No weaknesses identified</p>
        )}
      </div>

      <div className="analysis-section">
        <h3>💡 Recommendations</h3>
        {result.recommendations.length > 0 ? (
          <ul className="recommendations-list">
            {result.recommendations.map((recommendation, index) => (
              <li key={index} className="recommendation-item">🚀 {recommendation}</li>
            ))}
          </ul>
        ) : (
          <p className="empty-list">No recommendations provided</p>
        )}
      </div>

      {result.sentiment && (
        <div className="analysis-section">
          <h3>😊 Sentiment Analysis</h3>
          <span 
            className="sentiment-badge"
            style={{ backgroundColor: getSentimentColor(result.sentiment) }}
          >
            {result.sentiment.toUpperCase()}
          </span>
        </div>
      )}

      {result.categories && result.categories.length > 0 && (
        <div className="analysis-section">
          <h3>🏷️ Categories</h3>
          <div className="categories">
            {result.categories.map((category, index) => (
              <span key={index} className="category-tag">
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.metadata && (
        <div className="analysis-section">
          <h3>📊 Metadata</h3>
          <div className="metadata">
            {result.metadata.contentLength && (
              <div className="metadata-item">
                <strong>Content Length:</strong> {result.metadata.contentLength} characters
              </div>
            )}
            {result.metadata.imageCount !== undefined && (
              <div className="metadata-item">
                <strong>Images:</strong> {result.metadata.imageCount}
              </div>
            )}
            {result.metadata.linkCount !== undefined && (
              <div className="metadata-item">
                <strong>Links:</strong> {result.metadata.linkCount}
              </div>
            )}
            {result.metadata.scrapedAt && (
              <div className="metadata-item">
                <strong>Analyzed:</strong> {new Date(result.metadata.scrapedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="analysis-section">
        <h3>📝 Full Analysis</h3>
        <div className="full-analysis">
          <pre>{result.analysis}</pre>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDisplay;