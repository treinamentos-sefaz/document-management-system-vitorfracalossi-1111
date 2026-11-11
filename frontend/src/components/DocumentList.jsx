import DownloadButton from './DownloadButton';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });
const sizeFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

export default function DocumentList({ documents, loading }) {
  if (loading && documents.length === 0) return <p className="empty-state" role="status">Carregando documentos...</p>;
  if (documents.length === 0) return <div className="empty-state"><span className="empty-symbol" aria-hidden="true">＋</span><strong>Nenhum documento por aqui</strong><p>Os documentos enviados aparecerão nesta lista.</p></div>;

  return (
    <div className="document-list" aria-busy={loading}>
      <div className="list-labels" aria-hidden="true"><span>DOCUMENTO</span><span>PROPRIETÁRIO</span><span>DATA</span><span></span></div>
      {documents.map((document) => (
        <article className="document-row" key={document.id}>
          <div className="document-name"><span className="file-icon" aria-hidden="true">▤</span><div><strong title={document.originalName}>{document.originalName}</strong><span>{formatSize(document.size)}</span></div></div>
          <div className="document-meta"><span className="mobile-label">PROPRIETÁRIO</span>{document.owner}</div>
          <div className="document-meta"><span className="mobile-label">DATA</span>{dateFormatter.format(new Date(document.uploadedAt))}</div>
          <DownloadButton document={document} />
        </article>
      ))}
    </div>
  );
}