import React from 'react';
import { AnalysisResult } from '../types/scraper';
import './AnalysisDisplay.css';

interface AnalysisDisplayProps {
  analysis: AnalysisResult;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#28a745';
      case 'negative': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="analysis-display">
      <h2>AI Analysis Results</h2>
      
      <div className="analysis-section">
        <h3>Summary</h3>
        <p className="summary">{analysis.summary}</p>
      </div>

      <div className="analysis-section">
        <h3>Key Points</h3>
        <ul className="key-points">
          {analysis.keyPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>

      <div className="analysis-section">
        <h3>Sentiment Analysis</h3>
        <span 
          className="sentiment-badge"
          style={{ backgroundColor: getSentimentColor(analysis.sentiment) }}
        >
          {analysis.sentiment.toUpperCase()}
        </span>
      </div>

      <div className="analysis-section">
        <h3>Categories</h3>
        <div className="categories">
          {analysis.categories.map((category, index) => (
            <span key={index} className="category-tag">
              {category}
            </span>
          ))}
        </div>
      </div>

      <div className="analysis-section">
        <h3>Metadata</h3>
        <div className="metadata">
          <div className="metadata-item">
            <strong>Word Count:</strong> {analysis.metadata.wordCount}
          </div>
          <div className="metadata-item">
            <strong>Reading Time:</strong> {analysis.metadata.readingTime} minutes
          </div>
          <div className="metadata-item">
            <strong>Language:</strong> {analysis.metadata.language}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDisplay;