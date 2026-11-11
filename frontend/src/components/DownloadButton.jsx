import { useState } from 'react';
import { downloadDocument } from '../services/documents';

export default function DownloadButton({ document }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setDownloading(true);
    setError('');
    try {
      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloading(false);
    }
  }

  return <div className="download-action"><button type="button" className="download-button" onClick={handleDownload} disabled={downloading} aria-label={`Baixar ${document.originalName}`} title="Baixar documento">{downloading ? '...' : '↓'}</button>{error && <span className="download-error" role="alert">{error}</span>}</div>;
}