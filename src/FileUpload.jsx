import React, { useRef, useState } from 'react';

function FileUpload({ conversaId, onFileSent }) {
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileInputRef = useRef(null);

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Arquivo muito grande! Maximo 10MB'); return; }

    setUploading(true);
    setUploadMsg('Criptografando...');
    try {
      const base64 = await fileToBase64(file);
      let tipo = 'ARQUIVO';
      if (file.type.startsWith('image/')) tipo = 'IMAGEM';
      else if (file.type.startsWith('audio/')) tipo = 'AUDIO';
      else if (file.type.startsWith('video/')) tipo = 'VIDEO';

      const token = localStorage.getItem('token');
      const { API_BASE } = require('./config');
      const response = await fetch(`${API_BASE}/conversas/${conversaId}/enviar-arquivo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ arquivo_base64: base64, tipo, nome_arquivo: file.name, mime_type: file.type })
      });
      const data = await response.json();
      if (response.ok) { onFileSent?.(); fileInputRef.current.value = ''; }
      else { alert(`Erro: ${data.erro || 'Falha ao enviar'}`); }
    } catch (err) { alert('Erro ao enviar arquivo'); }
    finally { setUploading(false); setUploadMsg(''); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt" style={{ display: 'none' }} />
      {uploading ? (
        <span style={{ fontSize: 12, color: '#0084ff', fontWeight: 500 }}>{uploadMsg}</span>
      ) : (
        <button onClick={() => fileInputRef.current?.click()} title="Enviar arquivo" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a8d91', padding: 4, display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        </button>
      )}
    </div>
  );
}

export default FileUpload;