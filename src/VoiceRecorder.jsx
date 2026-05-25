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
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendVoiceMessage(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start(100);
            setIsRecording(true);
            setRecordingTime(0);
            
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            
        } catch (err) {
            console.error('Erro ao acessar microfone:', err);
            alert('❌ Permissão do microfone negada. Verifique as configurações do seu navegador.');
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
                const base64Audio = reader.result; // Mantém o prefixo data:audio/webm;base64,
                
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
                        arquivo_base64: base64Audio,
                        tipo: 'AUDIO',
                        nome_arquivo: `voz_${Date.now()}.webm`,
                        mime_type: 'audio/webm'
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('✅ Mensagem de voz enviada com segurança!');
                    onVoiceSent?.();
                } else {
                    alert(`❌ Erro: ${data.erro || 'Falha ao enviar'}`);
                }
                
                setUploading(false);
            };
        } catch (err) {
            console.error('Erro ao enviar áudio:', err);
            alert('❌ Erro ao enviar mensagem de voz');
            setUploading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ position: 'relative' }}>
            {isRecording ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#fee2e2',
                    borderRadius: '32px',
                    padding: '4px 12px',
                    animation: 'pulse 1s infinite'
                }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        background: '#ef4444',
                        borderRadius: '50%',
                        animation: 'pulse 1s infinite'
                    }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#dc2626' }}>
                        {formatTime(recordingTime)}
                    </span>
                    <button
                        onClick={stopRecording}
                        style={{
                            background: '#10b981',
                            border: 'none',
                            borderRadius: '20px',
                            padding: '6px 12px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600'
                        }}
                    >
                        ✓ Enviar
                    </button>
                    <button
                        onClick={cancelRecording}
                        style={{
                            background: '#64748b',
                            border: 'none',
                            borderRadius: '20px',
                            padding: '6px 12px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600'
                        }}
                    >
                        ✕ Cancelar
                    </button>
                </div>
            ) : (
                <button
                    onClick={startRecording}
                    disabled={uploading}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#ef444420',
                        color: '#ef4444',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        fontSize: '18px',
                        opacity: uploading ? 0.5 : 1,
                        transition: 'all 0.2s'
                    }}
                    title="Gravar mensagem de voz"
                >
                    {uploading ? '⏳' : '🎤'}
                </button>
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