import React, { useRef, useState } from 'react';
import VoiceRecorder from './VoiceRecorder';

function FileUpload({ conversaId, onFileSent }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Arquivo muito grande! Máximo 10MB');
            return;
        }

        setUploading(true);
        
        try {
            const base64 = await fileToBase64(file);
            let tipo = 'ARQUIVO';
            
            if (file.type.startsWith('image/')) tipo = 'IMAGEM';
            else if (file.type.startsWith('audio/')) tipo = 'AUDIO';
            else if (file.type.startsWith('video/')) tipo = 'VIDEO';
            
            const token = localStorage.getItem('token');
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://127.0.0.1:8000/api'
                : 'https://secure-messaging-api.onrender.com/api';
            
            const response = await fetch(`${apiUrl}/conversas/${conversaId}/enviar-arquivo/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    arquivo_base64: base64,
                    tipo: tipo,
                    nome_arquivo: file.name,
                    mime_type: file.type
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert(`✅ ${tipo} enviado com segurança!`);
                onFileSent?.();
                fileInputRef.current.value = '';
            } else {
                alert(`❌ Erro: ${data.erro || 'Falha ao enviar'}`);
            }
        } catch (err) {
            console.error('Erro ao enviar:', err);
            alert('❌ Erro ao enviar arquivo');
        } finally {
            setUploading(false);
        }
    };

    const handleVoiceSent = () => {
        onFileSent?.();
    };

    return (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,audio/*,video/*"
                style={{ display: 'none' }}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#10b98120',
                    color: '#10b981',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: '18px',
                    opacity: uploading ? 0.5 : 1
                }}
                title="Enviar arquivo"
            >
                📎
            </button>
            
            <VoiceRecorder conversaId={conversaId} onVoiceSent={handleVoiceSent} />
            
            {uploading && (
                <span style={{ fontSize: '12px', color: '#06b6d4', marginLeft: '8px' }}>
                    ⏳ Criptografando...
                </span>
            )}
        </div>
    );
}

export default FileUpload;