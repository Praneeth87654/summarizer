import { useState } from 'react';
import './index.css';

// The backend URL is read from an environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  // State variables to manage the UI and data
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [summary, setSummary] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Function to handle the "Generate Summary" button click
  const handleSummarize = async () => {
    if (!file) {
      setStatusMessage({ type: 'error', text: 'Please upload a transcript file first.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: '', text: '' });

    // FormData is used to send files to the backend
    const formData = new FormData();
    formData.append('transcript', file);
    formData.append('prompt', prompt || 'Summarize the text in clear, concise bullet points.');

    try {
      const response = await fetch(`${API_URL}/api/summarize`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data.summary);
      setStatusMessage({ type: 'success', text: 'Summary generated successfully!' });

    } catch (error) {
      console.error("Error summarizing:", error);
      setStatusMessage({ type: 'error', text: 'Failed to generate summary. Please check the console.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle the "Share via Email" button click
  const handleShare = async () => {
    if (!email || !summary) {
      setStatusMessage({ type: 'error', text: 'Please provide a recipient email and generate a summary first.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_URL}/api/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, summary }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatusMessage({ type: 'success', text: data.message });

    } catch (error) {
      console.error("Error sharing:", error);
      setStatusMessage({ type: 'error', text: 'Failed to send email. Please check your backend.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI Meeting Summarizer</h1>

      {/* Section 1: Upload and Generate */}
      <div className="section">
        <h2>1. Generate Summary</h2>
        <label htmlFor="file-upload">Upload Transcript (.txt file)</label>
        <input 
          id="file-upload" 
          type="file" 
          accept=".txt" 
          onChange={(e) => setFile(e.target.files[0])} 
        />

        <label htmlFor="custom-prompt">Custom Instruction / Prompt (Optional)</label>
        <textarea
          id="custom-prompt"
          placeholder="e.g., Highlight only the action items for the marketing team."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button onClick={handleSummarize} disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Summary'}
        </button>
      </div>

      {/* Section 2: Edit and Share */}
      {summary && (
        <div className="section">
          <h2>2. Edit & Share Summary</h2>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            aria-label="Editable summary"
          />

          <label htmlFor="recipient-email">Recipient's Email Address</label>
          <input
            id="recipient-email"
            type="email"
            placeholder="recipient@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button onClick={handleShare} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Share via Email'}
          </button>
        </div>
      )}

      {/* Status Message Display */}
      {statusMessage.text && (
        <div className={`status-message ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}
    </div>
  );
}

export default App;