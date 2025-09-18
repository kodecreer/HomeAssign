import React, { useState } from 'react';
import './UrlInput.css';

interface UrlInputProps {
  onSubmit: (url: string, includeScreenshot?: boolean) => void;
  loading: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({ onSubmit, loading }) => {
  const [url, setUrl] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim(), includeScreenshot);
    }
  };

  return (
    <div className="url-input-container">
      <form onSubmit={handleSubmit} className="url-form">
        <div className="input-group">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to scrape..."
            required
            disabled={loading}
            className="url-input"
          />
          <button 
            type="submit" 
            disabled={loading || !url.trim()}
            className="scrape-button"
          >
            {loading ? 'Scraping...' : 'Scrape'}
          </button>
        </div>
        
        <div className="options-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeScreenshot}
              onChange={(e) => setIncludeScreenshot(e.target.checked)}
              disabled={loading}
              className="screenshot-checkbox"
            />
            📸 Include screenshot for visual analysis
          </label>
        </div>
      </form>
    </div>
  );
};

export default UrlInput;