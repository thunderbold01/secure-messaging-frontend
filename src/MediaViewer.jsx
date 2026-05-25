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
    if (mensagem.tipo === 'AUDIO' && audioRef.current) audioRef.current.load();
    if (mensagem.tipo === 'VIDEO' && videoRef.current) videoRef.current.load();
  }, [mediaUrl, mensagem.tipo]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleAudioTimeUpdate = () => {
    if (audioRef.current?.duration) setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current?.duration) setDuration(audioRef.current.duration);
  };

  const toggleAudioPlay = () => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const typeLabel = { IMAGEM: 'Imagem', AUDIO: 'Áudio', VIDEO: 'Vídeo', ARQUIVO: 'Arquivo' };
  const typeIcon = { IMAGEM: '🖼️', AUDIO: '🎵', VIDEO: '🎬', ARQUIVO: '📎' };

  const renderMedia = () => {
    if (error) return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <p style={{ color: '#EF4444', fontWeight: 600, marginBottom: 16 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #2563EB, #4F46E5)', border: 'none', borderRadius: 12, color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>Recarregar</button>
      </div>
    );

    if (!mediaUrl) return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <p style={{ color: '#94A3B8', fontWeight: 600 }}>Mídia não disponível</p>
      </div>
    );

    switch (mensagem.tipo) {
      case 'IMAGEM':
        return <img src={mediaUrl} alt="Imagem" style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: 14, display: 'block', margin: '0 auto', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} onError={() => setError('Erro ao carregar imagem')} />;
      case 'AUDIO':
        return (
          <div style={{ padding: '32px 24px', textAlign: 'center', minWidth: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, height: 48, marginBottom: 24 }}>
              {Array(22).fill(0).map((_, i) => (
                <div key={i} style={{ width: 3, borderRadius: 3, background: isPlaying ? 'linear-gradient(to top, #2563EB, #60A5FA)' : 'rgba(37,99,235,0.3)', height: `${16 + Math.sin(i * 0.8) * 14 + Math.random() * 8}px`, transition: 'height 0.15s ease', animation: isPlaying ? `wave${i % 4} 0.8s ease-in-out infinite` : 'none' }}/>
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8', marginBottom: 24, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Mensagem de Voz</div>
            <audio ref={audioRef} onTimeUpdate={handleAudioTimeUpdate} onLoadedMetadata={handleAudioLoadedMetadata} onEnded={() => { setIsPlaying(false); setProgress(0); }}><source src={mediaUrl} type="audio/webm" /><source src={mediaUrl} type="audio/mpeg" /></audio>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 6, marginBottom: 10, overflow: 'hidden' }}><div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #2563EB, #60A5FA)', borderRadius: 6, transition: 'width 0.1s linear' }}/></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontWeight: 600 }}><span>0:00</span><span>{formatTime(duration)}</span></div>
            <button onClick={toggleAudioPlay} style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB, #4F46E5)', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 6px 24px rgba(37,99,235,0.5)' }}>{isPlaying ? '⏸' : '▶'}</button>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>🔐 Mensagem criptografada ponta a ponta</div>
          </div>
        );
      case 'VIDEO':
        return <video src={mediaUrl} controls style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: 14 }} autoPlay onError={() => setError('Erro ao carregar vídeo')} />;
      default:
        return (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📎</div>
            <p style={{ color: '#E2E8F0', fontWeight: 600, marginBottom: 20 }}>{mensagem.nome_arquivo || 'Arquivo'}</p>
            <a href={mediaUrl} download style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'linear-gradient(135deg, #2563EB, #4F46E5)', borderRadius: 14, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>📥 Baixar arquivo</a>
          </div>
        );
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,30,0.92)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: 16, fontFamily: 'Nunito, sans-serif' }} onClick={onClose}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap'); @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} @keyframes wave0{0%,100%{transform:scaleY(0.6)}50%{transform:scaleY(1.2)}} @keyframes wave1{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.6)}} @keyframes wave2{0%,100%{transform:scaleY(0.8)}50%{transform:scaleY(1.1)}} @keyframes wave3{0%,100%{transform:scaleY(1.2)}50%{transform:scaleY(0.7)}}`}</style>
      <div style={{ maxWidth: '90vw', maxHeight: '92vh', background: mensagem.tipo === 'AUDIO' ? 'linear-gradient(135deg, #0F1B33, #1B2D4F)' : '#1E293B', borderRadius: 22, overflow: 'hidden', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', animation: 'slideUp 0.3s ease forwards', minWidth: 300 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{typeIcon[mensagem.tipo] || '📎'}</span>
            <div><span style={{ fontWeight: 700, color: '#E2E8F0', fontSize: 15 }}>{typeLabel[mensagem.tipo] || 'Arquivo'}</span>{mensagem.nome_arquivo && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{mensagem.nome_arquivo}</div>}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#10B981', background: 'rgba(16,185,129,0.15)', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>🔐 Criptografado</span>
            <button onClick={onClose} style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 16, cursor: 'pointer', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>✕</button>
          </div>
        </div>
        <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 180 }}>{renderMedia()}</div>
      </div>
    </div>
  );
}

export default MediaViewer;