import React, { useState, useEffect, useRef } from 'react';
import { authService, userService, chatService, cryptoService } from './services/api';
import AdminPanel from './AdminPanel';
import FileUpload from './FileUpload';
import MediaViewer from './MediaViewer';

// ===== PALETA ÚNICA =====
const C = {
  bg: '#f5f5f5',
  surface: '#ffffff',
  surfaceAlt: '#f0f0f0',
  text: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',
  border: '#e5e5e5',
  success: '#10b981',
  danger: '#dc2626',
  warning: '#f59e0b',
  online: '#10b981',
  offline: '#cbd5e1',
};

// ===== ÍCONES SVG =====
const Icons = {
  Menu: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  PersonAdd: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  Chat: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Logout: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  CloseCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  ChevronLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Bell: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  BellOff: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Bot: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="14" rx="3"/><circle cx="12" cy="9" r="2"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/><line x1="8" y1="21" x2="16" y2="21"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Key: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
};

// ===== LINHA DIVISÓRIA =====
const Divider = React.memo(() => (
  <div style={{
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #dc2626, #06b6d4, #dc2626, transparent)',
    boxShadow: '0 1px 6px rgba(220,38,38,0.15), 0 1px 6px rgba(6,182,212,0.1)',
    borderRadius: '1px', margin: 0, opacity: 0.8
  }}/>
));

// ===== AVATAR =====
const Avatar = React.memo(({ name, online, size = 40, isAI, hasKey }) => (
  <div style={{
    width: size, height: size, borderRadius: 12,
    background: isAI ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #dc2626, #06b6d4)',
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: '800',
    fontSize: size > 40 ? 15 : 12, position: 'relative', flexShrink: 0,
    boxShadow: isAI ? '0 4px 14px rgba(16,185,129,0.3)' : '0 4px 14px rgba(220,38,38,0.25), 0 2px 8px rgba(6,182,212,0.15)'
  }}>
    {isAI ? '🤖' : (name || '??').substring(0, 2).toUpperCase()}
    {online !== undefined && !isAI && (
      <span style={{
        position: 'absolute', bottom: -2, right: -2,
        width: 13, height: 13, borderRadius: '50%',
        border: '2px solid #fff',
        background: online ? '#10b981' : '#cbd5e1',
        boxShadow: online ? '0 0 8px rgba(16,185,129,0.5)' : 'none'
      }}/>
    )}
    {hasKey && !isAI && (
      <span style={{
        position: 'absolute', top: -2, right: -2,
        width: 10, height: 10, borderRadius: '50%',
        background: '#8b5cf6',
        border: '2px solid #fff',
        boxShadow: '0 0 6px rgba(139,92,246,0.5)'
      }}/>
    )}
    {isAI && (
      <span style={{
        position: 'absolute', bottom: -2, right: -2,
        width: 13, height: 13, borderRadius: '50%',
        border: '2px solid #fff',
        background: '#10b981',
        boxShadow: '0 0 8px rgba(16,185,129,0.5)'
      }}/>
    )}
  </div>
));

// ===== COMPONENTE DE ÁUDIO PERSONALIZADO =====
const AudioPlayer = ({ audioSrc, messageId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        setProgress(percent);
        
        const minutes = Math.floor(audio.currentTime / 60);
        const seconds = Math.floor(audio.currentTime % 60);
        setCurrentTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration) {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime('0:00');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressClick = (e) => {
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = percent * audioRef.current.duration;
    }
  };

  return (
    <div style={{
      background: '#f8f9fa',
      borderRadius: '32px',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      width: '100%',
      maxWidth: '280px'
    }}>
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      <button
        onClick={togglePlay}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px'
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      
      <div style={{ flex: 1 }}>
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          style={{
            height: '4px',
            background: '#e0e0e0',
            borderRadius: '2px',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #dc2626, #06b6d4)',
            borderRadius: '2px',
            transition: 'width 0.1s linear'
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#64748b',
          marginTop: '4px'
        }}>
          <span>{currentTime}</span>
          <span>{duration}</span>
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
function App() {
  const [auth, setAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authPage, setAuthPage] = useState('login');
  const [login, setLogin] = useState({ username: '', password: '' });
  const [reg, setReg] = useState({ username: '', password: '', telefone: '' });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('chats');
  const [friends, setFriends] = useState([]);
  const [selFriend, setSelFriend] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [requests, setRequests] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [fadeIn, setFadeIn] = useState(false);
  const [temChaves, setTemChaves] = useState(false);
  const [gerandoChaves, setGerandoChaves] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const msgEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const aiMsgEnd = useRef(null);
  
  // Chat IA
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');

  // ===== DETECTAR MOBILE =====
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== SCROLL CONTROLADO =====
  const handleChatScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    }
  };

  useEffect(() => {
    if (autoScroll && msgEndRef.current) {
      msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [msgs, autoScroll]);

  // ===== ANIMAÇÃO =====
  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // ===== GERAR CHAVES RSA APÓS LOGIN =====
  const gerarChavesSeNecessario = async () => {
    if (!auth || isAdmin) return;
    
    try {
      const verificar = await cryptoService.verificarChaves();
      
      if (!verificar.data.tem_chaves) {
        setGerandoChaves(true);
        console.log('🔐 Gerando chaves RSA-1024...');
        
        const resultado = await cryptoService.gerarChavesRSA();
        
        if (resultado.status === 201) {
          console.log('✅ Chaves RSA geradas com sucesso!', resultado.data);
          setTemChaves(true);
          
          if (notificationsEnabled && Notification.permission === 'granted') {
            new Notification('🔐 Chaves criptográficas geradas!', {
              body: 'Suas mensagens agora serão enviadas com criptografia RSA + AES-256.',
              icon: '/vite.svg'
            });
          }
        }
      } else {
        setTemChaves(true);
      }
    } catch (err) {
      console.error('❌ Erro ao verificar/gerar chaves:', err);
      setTemChaves(false);
    } finally {
      setGerandoChaves(false);
    }
  };

  // ===== EFETUAR LOGIN =====
  const doLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const r = await authService.login(login);
        const userData = r.data.usuario;
        setUser(userData);
        setAuth(true);
        localStorage.setItem('token', r.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAdmin(userData.username === 'admin');
        setLogin({ username: '', password: '' });
    } catch (err) {
        alert('Login falhou. Verifique suas credenciais.');
    } finally {
        setLoading(false);
    }
  };

  // ===== REGISTRO =====
  const doRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await authService.register({
        username: reg.username,
        password: reg.password,
        numero_celular: reg.telefone,
      });
      const userData = r.data.usuario;
      setUser(userData);
      setAuth(true);
      localStorage.setItem('token', r.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsAdmin(userData.username === 'admin');
      setReg({ username: '', password: '', telefone: '' });
    } catch (err) {
      alert('Registro falhou. Tente outro username.');
    } finally {
      setLoading(false);
    }
  };

  // ===== LOGOUT =====
  const doLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setAuth(false);
    setUser(null);
    setIsAdmin(false);
    setNotificationsEnabled(false);
    setFriends([]);
    setSelFriend(null);
    setMsgs([]);
    setAiMessages([]);
    setShowAiChat(false);
    setTemChaves(false);
  };

  // ===== GERAR CHAVES APÓS LOGIN =====
  useEffect(() => {
    if (auth && user && !isAdmin) {
      gerarChavesSeNecessario();
    }
  }, [auth, user, isAdmin]);

  // ===== NOTIFICAÇÕES =====
  useEffect(() => {
    if (auth && !isAdmin && 'Notification' in window && Notification.permission === 'granted') 
      setNotificationsEnabled(true);
  }, [auth, isAdmin]);

  const enableNotifications = async () => {
    if (!('Notification' in window)) { alert('Navegador não suporta.'); return; }
    try {
      const p = await Notification.requestPermission();
      if (p === 'granted') { 
        setNotificationsEnabled(true); 
        new Notification('🔔 Haremessenger', { body: 'Notificações ativadas! Você receberá alertas de mensagens.' }); 
      }
      else alert('❌ Permissão negada.');
    } catch (e) {}
  };

  const disableNotifications = () => setNotificationsEnabled(false);

  // ===== POLLING MENSAGENS =====
  useEffect(() => {
    if (!selFriend?.conversa_id || showAiChat) return;
    let active = true;
    const poll = async () => { 
      if (!active) return; 
      try { 
        const r = await chatService.getMessages(selFriend.conversa_id); 
        if (active) setMsgs(r.data.mensagens || []); 
      } catch (e) {} 
    };
    poll(); 
    const interval = setInterval(poll, 1500);
    return () => { active = false; clearInterval(interval); };
  }, [selFriend?.conversa_id, showAiChat]);

  // ===== POLLING AMIGOS =====
  useEffect(() => {
    if (!auth || isAdmin) return;
    let active = true;
    const poll = async () => {
      if (!active) return;
      try {
        const [fr, rq] = await Promise.all([userService.getFriends(), userService.getFriendRequests()]);
        if (active) { setFriends(fr.data.amigos || []); setRequests(rq.data.recebidas || []); }
      } catch (e) {}
    };
    poll(); 
    const interval = setInterval(poll, 3000);
    return () => { active = false; clearInterval(interval); };
  }, [auth, isAdmin]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            setAuth(true);
            setIsAdmin(userData.username === 'admin');
        } catch (e) {
            console.error('Erro ao recuperar sessão:', e);
            localStorage.clear();
        }
    }
  }, []);

  useEffect(() => { aiMsgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);

  const handleSelectFriend = (f) => { 
    if (f && f.id === 'ai') {
      openAiChat();
    } else {
      setSelFriend(f); 
      setShowAiChat(false);
      setAutoScroll(true);
    }
    if (isMobile) setSidebarOpen(false); 
  };

  const openAiChat = () => {
    if (!showAiChat) {
      setAiMessages([{ role: 'assistant', content: '👋 Olá! Eu sou o Thunderbold_AI. Como posso ajudar você hoje?', id: Date.now() }]);
    }
    setShowAiChat(true);
    setSelFriend(null);
  };

  const sendMsg = async () => {
    const m = newMsg.trim(); 
    if (!m || !selFriend?.conversa_id) return;
    
    const mensagemOriginal = m;
    const msgId = Date.now();
    
    const mensagemLocal = {
        id: msgId,
        remetente: user.username,
        conteudo: mensagemOriginal,
        enviada_em: new Date().toISOString(),
        enviada_por_mim: true,
        integridade_verificada: true,
        algoritmo: 'HYBRID-RSA-AES-256-CBC',
        temp: true
    };
    
    setMsgs(prev => [...prev, mensagemLocal]);
    setNewMsg('');
    
    try { 
        const response = await chatService.sendMessage(selFriend.conversa_id, mensagemOriginal);
        
        setMsgs(prev => prev.map(msg => 
            msg.id === msgId 
                ? { 
                    ...msg, 
                    id: response.data.id,
                    conteudo: response.data.conteudo || mensagemOriginal,
                    temp: false,
                    enviada_em: response.data.enviada_em || msg.enviada_em
                  }
                : msg
        ));
        
        const r = await chatService.getMessages(selFriend.conversa_id);
        setMsgs(r.data.mensagens || []);
        
    } catch (err) { 
        console.error('Erro ao enviar:', err);
        setMsgs(prev => prev.filter(msg => msg.id !== msgId));
        setNewMsg(mensagemOriginal);
        
        let erroMsg = 'Erro ao enviar mensagem. ';
        if (err.response?.data?.erro) {
            erroMsg += err.response.data.erro;
        } else {
            erroMsg += 'Verifique sua conexão.';
        }
        alert(erroMsg);
    }
  };

  const handleFileSent = () => {
    if (selFriend?.conversa_id) {
        setTimeout(async () => {
            const r = await chatService.getMessages(selFriend.conversa_id);
            setMsgs(r.data.mensagens || []);
        }, 500);
    }
  };

  const handleMediaClick = (msg) => {
    if (msg.tipo === 'IMAGEM' || msg.tipo === 'AUDIO' || msg.tipo === 'VIDEO') {
        setSelectedMedia(msg);
    }
  };

  // ===== THUNDERBOLD_AI =====
  const sendToAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    
    const userMsg = { role: 'user', content: aiInput.trim(), id: Date.now() };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = window.location.hostname === 'localhost'
        ? 'http://127.0.0.1:8000/api'
        : 'https://secure-messaging-api.onrender.com/api';
      
      const response = await fetch(`${apiUrl}/ai/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
        body: JSON.stringify({ mensagem: userMsg.content })
      });
      
      const data = await response.json();
      
      if (data.reply) {
        setAiMessages(prev => [...prev, {
          role: 'assistant', content: data.reply, id: Date.now() + 1, cached: data.cached
        }]);
      } else {
        setAiMessages(prev => [...prev, {
          role: 'assistant', content: '❌ ' + (data.erro || 'Erro ao processar'), id: Date.now() + 1
        }]);
      }
    } catch (err) {
      setAiMessages(prev => [...prev, {
        role: 'assistant', content: '❌ Erro de conexão com o servidor', id: Date.now() + 1
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  const clearAiHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = window.location.hostname === 'localhost'
        ? 'http://127.0.0.1:8000/api'
        : 'https://secure-messaging-api.onrender.com/api';
      
      await fetch(`${apiUrl}/ai/clear/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
    } catch (e) {}
    setAiMessages([{ role: 'assistant', content: '🧹 Histórico limpo! Nova conversa iniciada.', id: Date.now() }]);
  };

  const doSearch = async () => { if (!searchPhone.trim()) return; try { const r = await userService.searchByPhone(searchPhone); setSearchResult(r.data); } catch (e) {} };
  const sendReq = async () => { try { await userService.sendFriendRequest(searchResult.usuario.telefone); alert('Solicitação enviada!'); setShowSearch(false); setSearchPhone(''); setSearchResult(null); } catch (e) { alert(e.response?.data?.erro || 'Erro'); } };
  const acceptReq = async (id) => { try { await userService.respondToRequest(id, 'ACEITAR'); const [fr, rq] = await Promise.all([userService.getFriends(), userService.getFriendRequests()]); setFriends(fr.data.amigos || []); setRequests(rq.data.recebidas || []); } catch (e) {} };
  const rejectReq = async (id) => { try { await userService.respondToRequest(id, 'RECUSAR'); const r = await userService.getFriendRequests(); setRequests(r.data.recebidas || []); } catch (e) {} };

  const ft = (iso) => iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

  // ===== ADMIN REDIRECT =====
  if (auth && isAdmin) {
    return <AdminPanel user={user} onLogout={doLogout} />;
  }

  // ===== LOGIN PAGE =====
  if (!auth) {
    return (
      <div style={{
        minHeight: '100vh', minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f5f5f5',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e0e0e0\' fill-opacity=\'0.5\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        padding: 20, position: 'fixed', inset: 0, overflow: 'hidden'
      }}>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f5f5f5;overscroll-behavior:none}
          @keyframes shimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
          @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
          @keyframes fadeInScale{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
          @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
          input{font-size:16px!important}
        `}</style>

        <div style={{
          width: '100%', maxWidth: 420, background: '#fff',
          borderRadius: 20, padding: '36px 28px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.1)',
          position: 'relative', overflow: 'hidden',
          animation: 'fadeInScale 0.5s ease forwards',
          maxHeight: '95vh', overflowY: 'auto'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, #dc2626, #06b6d4, #dc2626)',
            animation: 'shimmer 3s ease-in-out infinite', backgroundSize: '200% 100%'
          }}/>

          <div style={{ textAlign: 'center', marginBottom: 28, marginTop: 6, animation: 'fadeInUp 0.5s ease forwards' }}>
            <div style={{
              width: 56, height: 56, margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              boxShadow: '0 8px 24px rgba(220,38,38,0.3), 0 4px 12px rgba(6,182,212,0.2)'
            }}><Icons.Lock /></div>
            <h1 style={{ fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg, #dc2626, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>Haremessenger</h1>
            <p style={{ color: '#94a3b8', fontSize: 12 }}>Mensageiro Seguro com RSA-1024 + AES-256</p>
          </div>

          <div style={{
            display: 'flex', background: '#f0f0f0', borderRadius: 10,
            padding: 3, marginBottom: 24, animation: 'fadeInUp 0.6s ease forwards'
          }}>
            <button onClick={() => setAuthPage('login')} style={tabBtnStyle(authPage === 'login')}>Entrar</button>
            <button onClick={() => setAuthPage('register')} style={tabBtnStyle(authPage === 'register')}>Criar Conta</button>
          </div>

          {authPage === 'login' ? (
            <form onSubmit={doLogin}>
              <div style={{ animation: 'fadeInUp 0.7s ease forwards' }}>
                <input type="text" placeholder="Username" value={login.username}
                  onChange={e => setLogin(p => ({ ...p, username: e.target.value }))} required style={inp}/>
              </div>
              <div style={{ animation: 'fadeInUp 0.8s ease forwards' }}>
                <input type="password" placeholder="Senha" value={login.password}
                  onChange={e => setLogin(p => ({ ...p, password: e.target.value }))} required style={{ ...inp, marginBottom: 20 }}/>
              </div>
              <div style={{ animation: 'fadeInUp 0.9s ease forwards' }}>
                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading ? <><span style={spinnerStyle}/> Entrando...</> : '🔐 Entrar'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={doRegister}>
              <div style={{ animation: 'fadeInUp 0.7s ease forwards' }}>
                <input type="text" placeholder="Username" value={reg.username}
                  onChange={e => setReg(p => ({ ...p, username: e.target.value }))} required style={inp}/>
              </div>
              <div style={{ animation: 'fadeInUp 0.8s ease forwards' }}>
                <input type="tel" placeholder="Telefone" value={reg.telefone}
                  onChange={e => setReg(p => ({ ...p, telefone: e.target.value }))} required style={inp}/>
              </div>
              <div style={{ animation: 'fadeInUp 0.9s ease forwards' }}>
                <input type="password" placeholder="Senha" value={reg.password}
                  onChange={e => setReg(p => ({ ...p, password: e.target.value }))} required style={{ ...inp, marginBottom: 20 }}/>
              </div>
              <div style={{ animation: 'fadeInUp 1s ease forwards' }}>
                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading ? <><span style={spinnerStyle}/> Criando...</> : '✨ Criar Conta'}
                </button>
              </div>
            </form>
          )}
          
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>🔐 RSA-1024</span>
            <span>🔒 AES-256</span>
            <span>🛡️ SHA-256</span>
            <span>🤝 Diffie-Hellman</span>
          </div>
        </div>
      </div>
    );
  }

  // ===== DASHBOARD =====
  return (
    <div style={{
      height: '100vh', height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#f5f5f5',
      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e8e8e8\' fill-opacity=\'0.5\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      overflow: 'hidden', opacity: fadeIn ? 1 : 0, transition: 'opacity 0.4s ease'
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;overflow:hidden;background:#f5f5f5}
        @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes badgePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
        @keyframes shimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#d0d0d0;border-radius:3px}
        .badge-pulse{animation:badgePulse 2s infinite}
        input{font-size:16px!important}
        @media(min-width:768px){input{font-size:14px!important}}
        .chat-messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 768px) {
          .chat-messages-container { padding: 10px 12px; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{
        background: '#fff', padding: '10px 14px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        zIndex: 100, flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#334155' }}>
              {sidebarOpen ? <Icons.Close /> : <Icons.Menu />}
            </button>
          )}
          <h1 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, background: 'linear-gradient(135deg, #dc2626, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icons.Lock /> Haremessenger
          </h1>
          {temChaves && !isAdmin && (
            <span style={{ fontSize: 10, background: '#8b5cf615', color: '#8b5cf6', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>🔐 RSA-1024</span>
          )}
          {gerandoChaves && (
            <span style={{ fontSize: 10, background: '#f59e0b15', color: '#f59e0b', padding: '2px 8px', borderRadius: 20 }}>⏳ Gerando chaves...</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <button onClick={notificationsEnabled ? disableNotifications : enableNotifications}
            style={{ padding: '6px 10px', borderRadius: 7, background: notificationsEnabled ? '#fef2f2' : 'transparent', border: notificationsEnabled ? '1px solid #dc2626' : '1px solid #e5e5e5', cursor: 'pointer', fontSize: 14, color: notificationsEnabled ? '#dc2626' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
            {notificationsEnabled ? <Icons.Bell /> : <Icons.BellOff />}
          </button>
          {!isMobile && (
            <>
              <button onClick={() => setShowSearch(true)} style={{ padding: '6px 12px', borderRadius: 7, background: 'linear-gradient(135deg, #dc2626, #06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, position: 'relative', boxShadow: '0 3px 12px rgba(220,38,38,0.25)' }}>
                <Icons.PersonAdd /> Adicionar
                {requests.length > 0 && <span className="badge-pulse" style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff', borderRadius: 9, padding: '2px 6px', fontSize: 9, fontWeight: 700 }}>{requests.length}</span>}
              </button>
              <Avatar name={user?.username} size={32} hasKey={temChaves} />
              <span style={{ fontWeight: 600, fontSize: 12, color: '#334155' }}>{user?.username}</span>
            </>
          )}
          <button onClick={doLogout} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #e5e5e5', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icons.Logout /> {!isMobile && 'Sair'}
          </button>
        </div>
      </header>

      <Divider />

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{
          width: isMobile ? '100%' : 360, height: '100%', background: '#fff',
          borderRight: isMobile ? 'none' : '1px solid #e5e5e5',
          display: isMobile && !sidebarOpen ? 'none' : 'flex',
          flexDirection: 'column', position: isMobile ? 'absolute' : 'relative',
          zIndex: 50, flexShrink: 0, boxShadow: isMobile ? '0 20px 40px rgba(0,0,0,0.15)' : 'none',
          animation: isMobile && sidebarOpen ? 'slideIn 0.2s ease' : 'none'
        }}>
          <div style={{ display: 'flex', padding: '10px 10px 6px', gap: 5, flexShrink: 0 }}>
            <button onClick={() => { setTab('chats'); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: tab === 'chats' ? 700 : 400, background: tab === 'chats' ? 'linear-gradient(135deg, #dc2626, #06b6d4)' : 'transparent', color: tab === 'chats' ? '#fff' : '#64748b', position: 'relative', transition: 'all 0.15s', boxShadow: tab === 'chats' ? '0 3px 10px rgba(220,38,38,0.25)' : 'none' }}>
              <Icons.Chat /> Chats
            </button>
            <button onClick={() => setTab('requests')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: tab === 'requests' ? 700 : 400, background: tab === 'requests' ? 'linear-gradient(135deg, #dc2626, #06b6d4)' : 'transparent', color: tab === 'requests' ? '#fff' : '#64748b', position: 'relative', transition: 'all 0.15s', boxShadow: tab === 'requests' ? '0 3px 10px rgba(220,38,38,0.25)' : 'none' }}>
              <Icons.Users /> Pedidos
              {requests.length > 0 && <span className="badge-pulse" style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff', borderRadius: 9, padding: '2px 6px', fontSize: 9, fontWeight: 700 }}>{requests.length}</span>}
            </button>
          </div>

          <Divider />

          <div style={{ flex: 1, overflowY: 'auto', padding: '5px 8px' }}>
            {tab === 'chats' && (
              <>
                <div onClick={() => handleSelectFriend({ id: 'ai', username: 'Thunderbold_AI', online: true })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 9, borderRadius: 10, cursor: 'pointer', marginBottom: 2, background: showAiChat ? '#f0fdf4' : 'transparent', border: showAiChat ? '1px solid #10b981' : '1px solid transparent', transition: 'all 0.15s' }}>
                  <Avatar name="AI" isAI={true} size={42} online={true} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Thunderbold_AI
                      <span style={{ fontSize: 9, background: '#10b98115', color: '#10b981', padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>IA</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#10b981', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 4px rgba(16,185,129,0.5)' }}/> Online - Sempre disponível
                    </div>
                  </div>
                  <Icons.Bot />
                </div>
                
                <div style={{ height: 1, background: '#e5e5e5', margin: '4px 0' }}/>
                
                {friends.map(f => (
                  <div key={f.id} onClick={() => handleSelectFriend(f)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 9, borderRadius: 10, cursor: 'pointer', marginBottom: 2, background: selFriend?.id === f.id ? '#f0fdf4' : 'transparent', border: selFriend?.id === f.id ? '1px solid #10b981' : '1px solid transparent', transition: 'all 0.15s' }}>
                    <Avatar name={f.username} online={f.online} size={42} hasKey={true} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{f.username}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{f.telefone}</div>
                      {f.canal_seguro && <div style={{ fontSize: 9, color: '#10b981', marginTop: 2 }}>🔐 Canal Seguro</div>}
                    </div>
                    {f.canal_seguro && <Icons.Key />}
                  </div>
                ))}
              </>
            )}
            {tab === 'requests' && requests.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 9, background: '#f0f0f0', borderRadius: 10, marginBottom: 5, border: '1px solid #e5e5e5' }}>
                <Avatar name={r.remetente} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{r.remetente}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{r.telefone}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => acceptReq(r.id)} style={{ padding: 6, background: '#10b981', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}><Icons.Check /></button>
                  <button onClick={() => rejectReq(r.id)} style={{ padding: 6, background: 'transparent', border: '1px solid #dc2626', borderRadius: 6, color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Icons.CloseCircle /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}/>}

        {/* CHAT AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', minWidth: 0 }}>
          {showAiChat ? (
            <>
              <div style={{ padding: '10px 14px', background: '#fff', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                {isMobile && (
                  <button onClick={() => { setShowAiChat(false); setSidebarOpen(true); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#334155' }}>
                    <Icons.ChevronLeft />
                  </button>
                )}
                <Avatar name="AI" isAI={true} size={38} online={true} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Thunderbold_AI</div>
                  <div style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }}/> Online - Sempre disponível
                  </div>
                </div>
                <button onClick={clearAiHistory} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#334155' }} title="Limpar histórico">
                  <Icons.Trash />
                </button>
              </div>

              <Divider />

              <div className="chat-messages-container">
                {aiMessages.map(m => (
                  <div key={m.id} style={{ maxWidth: '72%', padding: '10px 13px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: m.role === 'user' ? 'linear-gradient(135deg, #dc2626, #06b6d4)' : '#fff', color: m.role === 'user' ? '#fff' : '#0f172a', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', fontSize: 13, lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 600, fontSize: 10, marginBottom: 2, opacity: 0.7 }}>
                      {m.role === 'user' ? user?.username || 'Você' : 'Thunderbold_AI'}
                      {m.cached && <span style={{ fontSize: 8, marginLeft: 4, opacity: 0.5 }}>(cache)</span>}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: '#fff', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4', animation: 'pulse 1.4s infinite' }}/>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4', animation: 'pulse 1.4s infinite 0.2s' }}/>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4', animation: 'pulse 1.4s infinite 0.4s' }}/>
                    </span>
                  </div>
                )}
                <div ref={aiMsgEnd}/>
              </div>

              <Divider />

              <div style={{ padding: '10px 14px', background: '#fff', display: 'flex', gap: 8, alignItems: 'center' }}>
                <FileUpload conversaId={selFriend?.conversa_id} onFileSent={handleFileSent} />
                <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), sendToAI())} placeholder="Pergunte qualquer coisa..." style={{ flex: 1, padding: '10px 16px', background: '#f0f0f0', border: '2px solid #e5e5e5', borderRadius: '50px', fontSize: 14, outline: 'none' }} />
                <button onClick={sendToAI} disabled={!aiInput.trim() || aiLoading} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #dc2626, #06b6d4)', border: 'none', color: '#fff', cursor: !aiInput.trim() || aiLoading ? 'not-allowed' : 'pointer', opacity: !aiInput.trim() || aiLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  📤
                </button>
              </div>
            </>
          ) : selFriend ? (
            <>
              <div style={{ padding: '10px 14px', background: '#fff', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                {isMobile && <button onClick={() => { setSelFriend(null); setSidebarOpen(true); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#334155' }}><Icons.ChevronLeft /></button>}
                <Avatar name={selFriend.username} online={selFriend.online} size={38} hasKey={true} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{selFriend.username}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: selFriend.online ? '#10b981' : '#cbd5e1', boxShadow: selFriend.online ? '0 0 6px rgba(16,185,129,0.5)' : 'none' }}/>
                    {selFriend.online ? 'Online' : 'Offline'}
                  </div>
                </div>
                <div style={{ fontSize: 11, background: '#10b98115', color: '#10b981', padding: '4px 10px', borderRadius: 20 }}>🔐 Criptografia RSA+AES</div>
              </div>

              <Divider />

              <div 
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                className="chat-messages-container"
              >
                {msgs.map(msg => {
                  const isOwn = msg.remetente === user.username;
                  const isMedia = ['IMAGEM', 'AUDIO', 'VIDEO', 'ARQUIVO'].includes(msg.tipo);
                  
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
                      <div style={{
                        maxWidth: '72%',
                        padding: isMedia && msg.tipo === 'IMAGEM' ? '4px' : '10px 14px',
                        borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: isOwn ? 'linear-gradient(135deg, #dc2626, #06b6d4)' : '#fff',
                        color: isOwn ? '#fff' : '#0f172a',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        overflow: 'hidden'
                      }}>
                        {!isOwn && <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px', color: '#dc2626' }}>{msg.remetente}</div>}
                        
                        {isMedia ? (
                          <>
                            {msg.tipo === 'IMAGEM' && (
                              <img 
                                src={msg.conteudo} 
                                alt="Imagem" 
                                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={() => handleMediaClick(msg)}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            {msg.tipo === 'AUDIO' && (
                              <AudioPlayer audioSrc={msg.conteudo} messageId={msg.id} />
                            )}
                            {msg.tipo === 'VIDEO' && (
                              <video src={msg.conteudo} controls style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} preload="metadata" />
                            )}
                            {msg.tipo === 'ARQUIVO' && (
                              <div onClick={() => handleMediaClick(msg)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
                                <span style={{ fontSize: '24px' }}>📎</span>
                                <span style={{ fontSize: '13px' }}>{msg.nome_arquivo || 'Arquivo'}</span>
                                <span style={{ fontSize: '10px', background: '#10b981', padding: '2px 6px', borderRadius: '12px', color: '#fff' }}>🔐</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13px', lineHeight: '1.5' }}>
                            {typeof msg.conteudo === 'string' ? msg.conteudo : '[Mensagem criptografada]'}
                          </div>
                        )}
                        
                        <div style={{ fontSize: '9px', marginTop: '4px', textAlign: 'right', opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          {!isMedia && msg.integridade_verificada && <span style={{ color: '#10b981' }}>✓</span>}
                          {ft(msg.enviada_em)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>

              <Divider />

              <div style={{ padding: '10px 14px', background: '#fff', display: 'flex', gap: 8, alignItems: 'center' }}>
                <FileUpload conversaId={selFriend?.conversa_id} onFileSent={handleFileSent} />
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), sendMsg())} placeholder="Digite sua mensagem ou use os botões para enviar mídia..." style={{ flex: 1, padding: '10px 16px', background: '#f0f0f0', border: '2px solid #e5e5e5', borderRadius: '50px', fontSize: 14, outline: 'none' }} />
                <button onClick={sendMsg} disabled={!newMsg.trim()} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #dc2626, #06b6d4)', border: 'none', color: '#fff', cursor: !newMsg.trim() ? 'not-allowed' : 'pointer', opacity: !newMsg.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  📤
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <div style={{ textAlign: 'center', maxWidth: 320 }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.06 }}>💬</div>
                <h2 style={{ fontSize: 17, fontWeight: 700, background: 'linear-gradient(135deg, #dc2626, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>
                  {isMobile ? 'Suas conversas' : 'Seus chats'}
                </h2>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{isMobile ? 'Toque no menu ☰' : 'Escolha um amigo para conversar'}</p>
                <p style={{ fontSize: 11, color: '#10b981', marginBottom: 16 }}>🔐 Mensagens protegidas com RSA-1024 + AES-256</p>
                <button onClick={openAiChat} style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, boxShadow: '0 4px 14px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
                  <Icons.Bot /> Falar com Thunderbold_AI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE NAV */}
      {isMobile && !selFriend && !showAiChat && (
        <>
          <Divider />
          <div style={{ background: '#fff', padding: '5px 4px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexShrink: 0, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', gap: 1, zIndex: 60 }}>
            <button onClick={() => { setTab('chats'); setSidebarOpen(true); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px 6px', fontSize: 16, minWidth: 50 }}>
              <Icons.Chat /><span style={{ fontSize: 9 }}>Chats</span>
            </button>
            <button onClick={() => { setTab('requests'); setSidebarOpen(true); }} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px 6px', fontSize: 16, minWidth: 50 }}>
              <Icons.Users /><span style={{ fontSize: 9 }}>Pedidos</span>
              {requests.length > 0 && <span className="badge-pulse" style={{ position: 'absolute', top: -4, right: 'calc(50% - 20px)', background: '#ef4444', color: '#fff', borderRadius: 10, padding: '3px 7px', fontSize: 9, fontWeight: 800, minWidth: 18, textAlign: 'center', boxShadow: '0 2px 8px rgba(239,68,68,0.4)' }}>{requests.length}</span>}
            </button>
            <button onClick={openAiChat} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px 6px', fontSize: 16, minWidth: 50 }}>
              <Icons.Bot /><span style={{ fontSize: 9 }}>IA</span>
            </button>
            <button onClick={() => setShowSearch(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px 6px', fontSize: 16, minWidth: 50 }}>
              <Icons.PersonAdd /><span style={{ fontSize: 9 }}>Adicionar</span>
            </button>
          </div>
        </>
      )}

      {/* SEARCH MODAL */}
      {showSearch && (
        <div onClick={() => setShowSearch(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.2)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #dc2626, #06b6d4, #dc2626)', backgroundSize: '200% 100%', animation: 'shimmer 3s ease-in-out infinite' }}/>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #dc2626, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              <Icons.PersonAdd /> Buscar Amigo
            </h2>
            <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>Digite o número de telefone para encontrar alguém.</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <input type="tel" placeholder="Ex: 11110000" value={searchPhone} onChange={e => setSearchPhone(e.target.value)} style={{ flex: 1, padding: '11px 14px', background: '#f0f0f0', border: '2px solid #e5e5e5', borderRadius: 8, fontSize: 16, outline: 'none', color: '#0f172a' }}/>
              <button onClick={doSearch} style={{ padding: '11px 18px', background: 'linear-gradient(135deg, #dc2626, #06b6d4)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.25)', whiteSpace: 'nowrap' }}>Buscar</button>
            </div>
            {searchResult?.encontrado && (
              <div style={{ padding: 12, background: '#f0f0f0', borderRadius: 10, marginBottom: 12, border: '1px solid #e5e5e5' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>{searchResult.usuario.username}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 5 }}>{searchResult.usuario.telefone}</div>
                {!searchResult.usuario.tem_chave_publica && <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 8 }}>⚠️ Usuário ainda não configurou chave criptográfica</div>}
                {searchResult.is_amigo ? <span style={{ padding: '6px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b98115', color: '#10b981', border: '1px solid #10b981' }}>✅ Já são amigos</span>
                  : searchResult.solicitacao_enviada ? <span style={{ padding: '6px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b' }}>⏳ Solicitação enviada</span>
                  : <button onClick={sendReq} style={{ width: '100%', padding: 10, background: 'linear-gradient(135deg, #dc2626, #06b6d4)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.25)' }}>🤝 Adicionar Amigo</button>}
              </div>
            )}
            <button onClick={() => setShowSearch(false)} style={{ width: '100%', padding: 11, background: '#f0f0f0', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Fechar</button>
          </div>
        </div>
      )}

      {/* MEDIA VIEWER MODAL */}
      {selectedMedia && (
        <MediaViewer mensagem={selectedMedia} onClose={() => setSelectedMedia(null)} />
      )}
    </div>
  );
}

// ===== ESTILOS =====
const inp = { width: '100%', padding: '12px 14px', background: '#f0f0f0', border: '2px solid #e5e5e5', borderRadius: 10, fontSize: 16, outline: 'none', color: '#0f172a', marginBottom: 14, boxSizing: 'border-box' };
const btnStyle = (l) => ({ width: '100%', padding: 13, background: 'linear-gradient(135deg, #dc2626, #06b6d4)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: l ? 'not-allowed' : 'pointer', opacity: l ? 0.8 : 1, boxShadow: '0 5px 20px rgba(220,38,38,0.25), 0 2px 10px rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const spinnerStyle = { display: 'inline-block', width: 18, height: 18, border: '2px solid transparent', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', marginRight: 8 };
const tabBtnStyle = (a) => ({ flex: 1, padding: 10, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: a ? 700 : 400, background: a ? '#fff' : 'transparent', color: a ? '#dc2626' : '#94a3b8', boxShadow: a ? '0 1px 3px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s' });

export default App;