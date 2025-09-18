import React, { useState } from 'react';
import './UrlInput.css';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({ onSubmit, loading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
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
      </form>
    </div>
  );
};

export default UrlInput;