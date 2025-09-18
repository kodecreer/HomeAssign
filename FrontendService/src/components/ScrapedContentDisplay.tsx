import React from 'react';
import { ScrapedContent } from '../types/scraper';
import './ScrapedContentDisplay.css';

interface ScrapedContentDisplayProps {
  content: ScrapedContent;
  onAnalyze: () => void;
  analyzing: boolean;
}

const ScrapedContentDisplay: React.FC<ScrapedContentDisplayProps> = ({ 
  content, 
  onAnalyze, 
  analyzing 
}) => {
  return (
    <div className="scraped-content">
      <div className="content-header">
        <h2>Scraped Content</h2>
        <button 
          onClick={onAnalyze} 
          disabled={analyzing}
          className="analyze-button"
        >
          {analyzing ? 'Analyzing...' : 'Analyze with AI'}
        </button>
      </div>

      <div className="content-section">
        <h3>URL</h3>
        <a href={content.url} target="_blank" rel="noopener noreferrer" className="url-link">
          {content.url}
        </a>
      </div>

      <div className="content-section">
        <h3>Title</h3>
        <p className="title">{content.title}</p>
      </div>

      <div className="content-section">
        <h3>Content Preview</h3>
        <div className="content-preview">
          {content.content.substring(0, 500)}
          {content.content.length > 500 && '...'}
        </div>
      </div>

      {content.images.length > 0 && (
        <div className="content-section">
          <h3>Images ({content.images.length})</h3>
          <div className="images-grid">
            {content.images.slice(0, 6).map((image, index) => (
              <img 
                key={index} 
                src={image} 
                alt={`Scraped ${index + 1}`}
                className="scraped-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ))}
          </div>
        </div>
      )}

      {content.links.length > 0 && (
        <div className="content-section">
          <h3>External Links ({content.links.length})</h3>
          <div className="links-list">
            {content.links.slice(0, 10).map((link, index) => (
              <a 
                key={index} 
                href={link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="external-link"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrapedContentDisplay;