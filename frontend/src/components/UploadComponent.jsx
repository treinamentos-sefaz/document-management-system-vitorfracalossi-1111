import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documents';

export default function UploadComponent({ onUploaded }) {
  const [owner, setOwner] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || !owner.trim()) {
      setError('Selecione um arquivo e informe o proprietário.');
      return;
    }
    setUploading(true);
    setError('');
    setMessage('');
    try {
      await uploadDocument(file, owner);
      setFile(null);
      setOwner('');
      fileInput.current.value = '';
      setMessage('Documento enviado com sucesso.');
      onUploaded();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label htmlFor="owner">Proprietário</label>
      <input id="owner" type="text" placeholder="Nome do proprietário" value={owner} onChange={(event) => setOwner(event.target.value)} required disabled={uploading} />
      <label htmlFor="file">Arquivo</label>
      <div className="file-field">
        <input ref={fileInput} id="file" type="file" onChange={(event) => setFile(event.target.files[0] || null)} required disabled={uploading} />
      </div>
      <button className="primary-button" type="submit" disabled={uploading}>{uploading ? 'Enviando...' : 'Enviar documento'} <span aria-hidden="true">↗</span></button>
      {message && <p className="form-message success" role="status">{message}</p>}
      {error && <p className="form-message error-text" role="alert">{error}</p>}
    </form>
  );
}