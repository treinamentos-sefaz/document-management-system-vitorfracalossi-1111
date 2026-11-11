import { useEffect, useRef, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documents';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  async function loadDocuments() {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const result = await listDocuments();
      if (currentRequest === requestId.current) setDocuments(result);
    } catch (requestError) {
      if (currentRequest === requestId.current) setError(requestError.message);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
    return () => { requestId.current += 1; };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/" aria-label="DMS - início">
            <span className="brand-mark" aria-hidden="true">D</span>
            <span>documentos<span className="brand-dot">.</span></span>
          </a>
          <span className="topbar-label">GESTÃO DE DOCUMENTOS</span>
        </div>
      </header>
      <main className="workspace">
        <div className="page-heading">
          <div>
            <span className="eyebrow">ESPAÇO DE TRABALHO / DOCUMENTOS</span>
            <h1>Seus documentos</h1>
            <p>Arquivos organizados em um só lugar.</p>
          </div>
          <div className="document-count"><strong>{documents.length}</strong><span>documentos</span></div>
        </div>
        <div className="workspace-grid">
          <section className="list-section" aria-labelledby="documents-title">
            <div className="section-heading">
              <div><span className="section-kicker">ACERVO</span><h2 id="documents-title">Todos os documentos</h2></div>
              <button className="text-button" type="button" onClick={loadDocuments} disabled={loading}>Atualizar</button>
            </div>
            {error && <div className="notice error" role="alert">{error} <button type="button" className="text-button" onClick={loadDocuments}>Tentar novamente</button></div>}
            {(!error || documents.length > 0) && <DocumentList documents={documents} loading={loading} />}
          </section>
          <aside className="upload-section" aria-labelledby="upload-title">
            <span className="section-kicker">ADICIONAR AO ACERVO</span>
            <h2 id="upload-title">Enviar documento</h2>
            <UploadComponent onUploaded={loadDocuments} />
          </aside>
        </div>
      </main>
      <footer className="footer"><span>DOCUMENTOS / DMS</span><span>Gestão simples, trabalho organizado.</span></footer>
    </div>
  );
}
