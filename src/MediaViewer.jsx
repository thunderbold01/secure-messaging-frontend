import React, { useState, useEffect, useRef } from 'react';

function MediaViewer({ mensagem, onClose }) {
    const [error, setError] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);
    const videoRef = useRef(null);

    const mediaUrl = mensagem.conteudo;

    useEffect(() => {
        if (mensagem.tipo === 'AUDIO' && audioRef.current) {
            audioRef.current.load();
        }
        if (mensagem.tipo === 'VIDEO' && videoRef.current) {
            videoRef.current.load();
        }
    }, [mediaUrl, mensagem.tipo]);

    const handleAudioTimeUpdate = () => {
        if (audioRef.current && audioRef.current.duration) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
    };

    const handleAudioLoadedMetadata = () => {
        if (audioRef.current && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
        }
    };

    const toggleAudioPlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const renderMedia = () => {
        if (error) {
            return (
                <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                    <p>❌ {error}</p>
                    <button onClick={() => window.location.reload()} style={{ marginTop: '16px', padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Recarregar</button>
                </div>
            );
        }
    
        if (!mediaUrl) {
            return (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <p>📭 Mídia não disponível</p>
                </div>
            );
        }
    
        switch (mensagem.tipo) {
            case 'IMAGEM':
                return <img src={mediaUrl} alt="Imagem" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px', display: 'block', margin: '0 auto' }} onError={() => setError('Erro ao carregar imagem')} />;
            case 'AUDIO':
                return (
                    <div style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                            borderRadius: '48px',
                            padding: '20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎙️</div>
                            <h4 style={{ color: '#fff', marginBottom: '20px' }}>Mensagem de Voz</h4>
                            <audio controls style={{ width: '100%' }} autoPlay>
                                <source src={mediaUrl} type="audio/webm" />
                                <source src={mediaUrl} type="audio/mpeg" />
                                Seu navegador não suporta áudio.
                            </audio>
                            <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '16px' }}>
                            🔐 Mensagem criptografada ponta a ponta
                            </p>
                        </div>
                    </div>
                );
            case 'VIDEO':
                return <video src={mediaUrl} controls style={{ maxWidth: '100%', maxHeight: '70vh' }} autoPlay onError={() => setError('Erro ao carregar vídeo')} />;
            default:
                return <a href={mediaUrl} download style={{ color: '#06b6d4', textDecoration: 'none', fontSize: '16px' }}>📥 Baixar arquivo</a>;
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.95)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }} onClick={onClose}>
            <div style={{ maxWidth: '90vw', maxHeight: '90vh', background: '#1e293b', borderRadius: '16px', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#0f172a', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '20px' }}>{mensagem.tipo === 'IMAGEM' ? '🖼️' : mensagem.tipo === 'AUDIO' ? '🎵' : mensagem.tipo === 'VIDEO' ? '🎬' : '📎'}</span><span style={{ fontWeight: '500', color: '#e2e8f0' }}>{mensagem.tipo}</span></div>
                    <span style={{ fontSize: '12px', color: '#10b981', background: '#10b98120', padding: '4px 8px', borderRadius: '20px' }}>🔐 Criptografado</span>
                </div>
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: '300px', minHeight: '200px' }}>{renderMedia()}</div>
            </div>
        </div>
    );
}

export default MediaViewer;