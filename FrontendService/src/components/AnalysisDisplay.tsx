import React from 'react';
import type { AnalysisResult } from '../types/scraper';
import './AnalysisDisplay.css';

// Helper function to render text with markdown-style formatting
const renderFormattedText = (text: string) => {
  if (!text) return '';
  
  // Handle multiple formatting types
  const formatText = (str: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // Combined regex for **bold**, *italic*, and `code`
    const formatRegex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
    let match;
    
    while ((match = formatRegex.exec(str)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(str.slice(currentIndex, match.index));
      }
      
      // Add formatted content
      if (match[2]) {
        // **bold**
        parts.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3]) {
        // *italic*
        parts.push(<em key={match.index}>{match[3]}</em>);
      } else if (match[4]) {
        // `code`
        parts.push(<code key={match.index} className="inline-code">{match[4]}</code>);
      }
      
      currentIndex = formatRegex.lastIndex;
    }
    
    // Add remaining text
    if (currentIndex < str.length) {
      parts.push(str.slice(currentIndex));
    }
    
    return parts;
  };
  
  return formatText(text);
};

interface AnalysisDisplayProps {
  result: AnalysisResult;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result }) => {

  return (
    <div className="analysis-display">
      <h2>🎯 AI Analysis Results</h2>
      <p className="analysis-url">Analyzed: <a href={result.url} target="_blank" rel="noopener noreferrer">{result.url}</a></p>
      
      <div className="analysis-section">
        <h3>💪 Strengths</h3>
        {result.strengths.length > 0 ? (
          <ul className="strengths-list">
            {result.strengths.map((strength, index) => (
              <li key={index} className="strength-item">✅ {renderFormattedText(strength)}</li>
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
              <li key={index} className="weakness-item">❌ {renderFormattedText(weakness)}</li>
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
              <li key={index} className="recommendation-item">🚀 {renderFormattedText(recommendation)}</li>
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
            className={`sentiment-badge sentiment-${result.sentiment}`}
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

      {result.screenshot && (
        <div className="analysis-section">
          <h3>📸 Website Screenshot</h3>
          <div className="screenshot-container">
            <img 
              src={result.screenshot.dataUrl} 
              alt={`Screenshot of ${result.url}`}
              className="screenshot-image"
              loading="lazy"
            />
            <div className="screenshot-info">
              <div className="screenshot-metadata">
                <span><strong>Dimensions:</strong> {result.screenshot.dimensions.width}×{result.screenshot.dimensions.height}</span>
                <span><strong>Size:</strong> {(result.screenshot.size / 1024).toFixed(1)} KB</span>
                <span><strong>Format:</strong> {result.screenshot.format.toUpperCase()}</span>
                <span><strong>Captured:</strong> {new Date(result.screenshot.capturedAt).toLocaleString()}</span>
              </div>
            </div>
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
            {result.metadata.includeScreenshot !== undefined && (
              <div className="metadata-item">
                <strong>Screenshot:</strong> {result.metadata.includeScreenshot ? 'Yes' : 'No'}
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
          <div className="formatted-text">
            {result.analysis.split('\n').map((line, index) => (
              <p key={index}>{renderFormattedText(line)}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDisplay;