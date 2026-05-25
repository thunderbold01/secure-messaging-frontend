import React, { useState, useRef, useEffect } from 'react';

function VoiceRecorder({ conversaId, onVoiceSent }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      alert('❌ Permissão do microfone negada.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      audioChunksRef.current = [];
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result;
        const token = localStorage.getItem('token');
        const apiUrl = window.location.hostname === 'localhost' ? 'http://127.0.0.1:8000/api' : 'https://secure-messaging-api.onrender.com/api';
        const response = await fetch(`${apiUrl}/conversas/${conversaId}/enviar-arquivo/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
          body: JSON.stringify({ arquivo_base64: base64Audio, tipo: 'AUDIO', nome_arquivo: `voz_${Date.now()}.webm`, mime_type: 'audio/webm' })
        });
        const data = await response.json();
        if (response.ok) { alert('✅ Mensagem de voz enviada com segurança!'); onVoiceSent?.(); }
        else alert(`❌ Erro: ${data.erro || 'Falha ao enviar'}`);
        setUploading(false);
      };
    } catch (err) { alert('❌ Erro ao enviar mensagem de voz'); setUploading(false); }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ position: 'relative' }}>
      {isRecording ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fee2e2', borderRadius: 32, padding: '4px 12px', animation: 'pulse 1s infinite' }}>
          <div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>{formatTime(recordingTime)}</span>
          <button onClick={stopRecording} style={{ background: '#10b981', border: 'none', borderRadius: 20, padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>✓ Enviar</button>
          <button onClick={cancelRecording} style={{ background: '#64748b', border: 'none', borderRadius: 20, padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>✕ Cancelar</button>
        </div>
      ) : (
        <button onClick={startRecording} disabled={uploading} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#ef444420', color: '#ef4444',
          cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 18, opacity: uploading ? 0.5 : 1,
          transition: 'all 0.2s'
        }} title="Gravar mensagem de voz">{uploading ? '⏳' : '🎤'}</button>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

export default VoiceRecorder;