import React, { useState, useEffect, useRef } from 'react';
import { authService, userService, chatService } from './services/api';
import Admin from './Admin';

// ===== ÍCONES SVG =====
const Icons = {
  Menu: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Close: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  PersonAdd: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  Chat: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Logout: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  CloseCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  ChevronLeft: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  Lock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Bell: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  BellOff: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Bot: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="14" rx="3"/><circle cx="12" cy="10" r="2"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/><line x1="8" y1="21" x2="16" y2="21"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Shield: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

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
  
  // Chat IA
  const [aiChat, setAiChat] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Mídia
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingType, setRecordingType] = useState(null);
  
  // 2FA
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [codigo2FA, setCodigo2FA] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [setupStep, setSetupStep] = useState(0);
  
  const msgEnd = useRef(null);
  const pollingRef = useRef(null);

  // API URL
  const apiUrl = window.location.hostname === 'localhost' ? 'http://127.0.0.1:8000/api' : 'https://secure-messaging-api.onrender.com/api';

  useEffect(() => {
    const h = () => { setIsMobile(window.innerWidth < 768); if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener('resize', h); return () => window.removeEventListener('resize', h);
  }, []);

  const selectFriend = (f) => {
    if (f.id === 'ai') { setAiChat(true); setSelFriend(null); }
    else { setSelFriend(f); setAiChat(false); }
    if (isMobile) setSidebarOpen(false);
  };

  useEffect(() => {
    const t = localStorage.getItem('token'), u = localStorage.getItem('user');
    if (t && u) { try { const d = JSON.parse(u); setUser(d); setAuth(true); setIsAdmin(d.username === 'admin'); } catch (e) { localStorage.clear(); } }
  }, []);

  // Notificações
  useEffect(() => {
    if (auth && !isAdmin && 'Notification' in window && Notification.permission === 'granted') setNotificationsEnabled(true);
  }, [auth, isAdmin]);

  const enableNotifications = async () => {
    if (!('Notification' in window)) return;
    const p = await Notification.requestPermission();
    if (p === 'granted') { setNotificationsEnabled(true); new Notification('Haremessenger', { body: 'Notificações ativadas!' }); }
  };
  const disableNotifications = () => setNotificationsEnabled(false);

  // Polling mensagens
  useEffect(() => {
    if (!selFriend?.conversa_id || aiChat) return;
    let a = true;
    const p = async () => { if (!a) return; try { const r = await chatService.getMessages(selFriend.conversa_id); if (a) setMsgs(r.data.mensagens || []); } catch (e) {} };
    p(); pollingRef.current = setInterval(p, 1000);
    return () => { a = false; clearInterval(pollingRef.current); };
  }, [selFriend?.conversa_id, aiChat]);

  // Polling amigos
  useEffect(() => {
    if (!auth || isAdmin) return;
    let a = true;
    const p = async () => {
      if (!a) return;
      try { const [fr, rq] = await Promise.all([userService.getFriends(), userService.getFriendRequests()]); if (a) { setFriends(fr.data.amigos || []); setRequests(rq.data.recebidas || []); } } catch (e) {}
    };
    p(); const i = setInterval(p, 2000);
    return () => { a = false; clearInterval(i); };
  }, [auth, isAdmin]);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, aiMessages]);

  const loadMsgs = async () => {
    if (!selFriend?.conversa_id) return;
    try { const r = await chatService.getMessages(selFriend.conversa_id); setMsgs(r.data.mensagens || []); } catch (e) {}
  };

  // ===== AUTH =====
  const doLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const r = await authService.login(login); const d = r.data.usuario;
      setUser(d); setAuth(true); localStorage.setItem('token', r.data.token); localStorage.setItem('user', JSON.stringify(d));
      setIsAdmin(d.username === 'admin'); setLogin({ username: '', password: '' });
    } catch (err) { alert('Login falhou.'); } finally { setLoading(false); }
  };

  const doRegister = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const r = await authService.register({ username: reg.username, password: reg.password, numero_celular: reg.telefone });
      const d = r.data.usuario; setUser(d); setAuth(true);
      localStorage.setItem('token', r.data.token); localStorage.setItem('user', JSON.stringify(d));
      setIsAdmin(d.username === 'admin'); setReg({ username: '', password: '', telefone: '' });
    } catch (err) { alert('Registro falhou.'); } finally { setLoading(false); }
  };

  const doLogout = () => {
    localStorage.clear(); setAuth(false); setUser(null); setIsAdmin(false);
    setNotificationsEnabled(false); setFriends([]); setSelFriend(null); setMsgs([]);
    setAiMessages([]); setAiChat(false);
  };

  // ===== MENSAGENS =====
  const sendMsg = async () => {
    const m = newMsg.trim(); if (!m || !selFriend?.conversa_id) return;
    setNewMsg('');
    try { await chatService.sendMessage(selFriend.conversa_id, m); loadMsgs(); }
    catch (err) { setNewMsg(m); }
  };

  // ===== MÍDIA =====
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selFriend?.conversa_id) return;
    const tempMsg = { id: Date.now(), remetente: user.username, conteudo: `📎 Enviando ${file.name}...`, enviada_em: new Date().toISOString(), temp: true };
    setMsgs(prev => [...prev, tempMsg]);
    const formData = new FormData();
    formData.append('arquivo', file);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/conversas/${selFriend.conversa_id}/upload/`, { method: 'POST', headers: { 'Authorization': `Token ${token}` }, body: formData });
      setMsgs(prev => prev.filter(m => m.id !== tempMsg.id));
      loadMsgs();
    } catch (err) { setMsgs(prev => prev.filter(m => m.id !== tempMsg.id)); alert('Erro ao enviar arquivo'); }
    e.target.value = '';
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        await uploadRecording(blob, 'audio');
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder); setIsRecording(true); setRecordingType('audio');
    } catch (err) { alert('Microfone não disponível'); }
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        await uploadRecording(blob, 'video');
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder); setIsRecording(true); setRecordingType('video');
    } catch (err) { alert('Câmera não disponível'); }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) { mediaRecorder.stop(); setIsRecording(false); setMediaRecorder(null); setRecordingType(null); }
  };

  const uploadRecording = async (blob, tipo) => {
    if (!selFriend?.conversa_id) return;
    const formData = new FormData();
    formData.append(tipo === 'audio' ? 'audio' : 'video', blob, `gravacao.${tipo === 'audio' ? 'wav' : 'webm'}`);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/conversas/${selFriend.conversa_id}/gravar/`, { method: 'POST', headers: { 'Authorization': `Token ${token}` }, body: formData });
      loadMsgs();
    } catch (err) { alert('Erro ao enviar gravação'); }
  };

  const downloadMidia = (arquivoId) => { window.open(`${apiUrl}/download/${arquivoId}/`, '_blank'); };

  // ===== THUNDERBOLD_AI =====
  const sendToAI = async () => {
    if (!newMsg.trim() || aiLoading) return;
    const msg = { role: 'user', content: newMsg.trim(), id: Date.now() };
    setAiMessages(p => [...p, msg]); setNewMsg(''); setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${apiUrl}/ai/chat/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` }, body: JSON.stringify({ mensagem: msg.content }) });
      const d = await r.json();
      setAiMessages(p => [...p, { role: 'assistant', content: d.reply || d.erro || 'Erro', id: Date.now() + 1 }]);
    } catch (err) { setAiMessages(p => [...p, { role: 'assistant', content: 'Erro de conexão', id: Date.now() + 1 }]); }
    finally { setAiLoading(false); }
  };

  const clearAiHistory = async () => {
    try { const token = localStorage.getItem('token'); await fetch(`${apiUrl}/ai/clear/`, { method: 'POST', headers: { 'Authorization': `Token ${token}` } }); } catch (e) {}
    setAiMessages([{ role: 'assistant', content: 'Histórico limpo!', id: Date.now() }]);
  };

  // ===== 2FA =====
  const start2FASetup = async () => {
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${apiUrl}/2fa/setup/`, { method: 'POST', headers: { 'Authorization': `Token ${token}` } });
      const d = await r.json();
      if (d.qr_code) { setQrCode(d.qr_code); setSetupStep(1); }
    } catch (err) { alert('Erro ao iniciar 2FA'); }
  };

  const verifyAndEnable2FA = async () => {
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${apiUrl}/2fa/verify/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` }, body: JSON.stringify({ codigo: codigo2FA }) });
      const d = await r.json();
      if (d.backup_codes) { setBackupCodes(d.backup_codes); setSetupStep(2); }
      else if (d.erro) alert(d.erro);
    } catch (err) { alert('Erro ao verificar código'); }
  };

  const disable2FA = async () => {
    const codigo = prompt('Digite o código do Google Authenticator para desativar:');
    if (!codigo) return;
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${apiUrl}/2fa/disable/`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` }, body: JSON.stringify({ codigo }) });
      const d = await r.json();
      if (d.mensagem) { alert(d.mensagem); setShow2FAModal(false); setSetupStep(0); }
      else alert(d.erro);
    } catch (err) { alert('Erro ao desativar 2FA'); }
  };

  // ===== AMIGOS =====
  const doSearch = async () => { if (!searchPhone.trim()) return; try { const r = await userService.searchByPhone(searchPhone); setSearchResult(r.data); } catch (e) {} };
  const sendReq = async () => { try { await userService.sendFriendRequest(searchResult.usuario.telefone); alert('Solicitação enviada!'); setShowSearch(false); setSearchPhone(''); setSearchResult(null); } catch (e) { alert(e.response?.data?.erro || 'Erro'); } };
  const acceptReq = async (id) => { try { await userService.respondToRequest(id, 'ACEITAR'); const [fr, rq] = await Promise.all([userService.getFriends(), userService.getFriendRequests()]); setFriends(fr.data.amigos || []); setRequests(rq.data.recebidas || []); } catch (e) {} };
  const rejectReq = async (id) => { try { await userService.respondToRequest(id, 'RECUSAR'); const r = await userService.getFriendRequests(); setRequests(r.data.recebidas || []); } catch (e) {} };

  const ini = (n) => (n ? n.substring(0, 2).toUpperCase() : '?');
  const ft = (iso) => iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

  if (auth && isAdmin) return <Admin />;

  // ===== CSS GLOBAL =====
  const css = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f0f2f5;overflow:hidden}
    @keyframes fadeMsg{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    @keyframes recordingPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}
    @keyframes shimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ccc;border-radius:4px}
  `;

  // ===== LOGIN =====
  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: 16 }}>
        <style>{css}</style>
        <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, padding: '32px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, margin: '0 auto 12px', background: 'linear-gradient(135deg, #dc2626, #06b6d4)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icons.Lock /></div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Haremessenger</h1>
            <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>Mensageiro Seguro</p>
          </div>
          <div style={{ display: 'flex', background: '#f0f2f5', borderRadius: 8, padding: 3, marginBottom: 20 }}>
            <button onClick={() => setAuthPage('login')} style={authPage === 'login' ? tabOn : tabOff}>Entrar</button>
            <button onClick={() => setAuthPage('register')} style={authPage === 'register' ? tabOn : tabOff}>Criar Conta</button>
          </div>
          {authPage === 'login' ? (
            <form onSubmit={doLogin}>
              <input type="text" placeholder="Username" value={login.username} onChange={e => setLogin({ ...login, username: e.target.value })} required style={inp} />
              <input type="password" placeholder="Senha" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} required style={{ ...inp, marginBottom: 20 }} />
              <button type="submit" disabled={loading} style={btnCss(loading)}>{loading ? 'Entrando...' : 'Entrar'}</button>
            </form>
          ) : (
            <form onSubmit={doRegister}>
              <input type="text" placeholder="Username" value={reg.username} onChange={e => setReg({ ...reg, username: e.target.value })} required style={inp} />
              <input type="tel" placeholder="Telefone" value={reg.telefone} onChange={e => setReg({ ...reg, telefone: e.target.value })} required style={inp} />
              <input type="password" placeholder="Senha" value={reg.password} onChange={e => setReg({ ...reg, password: e.target.value })} required style={{ ...inp, marginBottom: 20 }} />
              <button type="submit" disabled={loading} style={btnCss(loading)}>{loading ? 'Criando...' : 'Criar Conta'}</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ===== DASHBOARD =====
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f2f5', overflow: 'hidden' }}>
      <style>{css}</style>

      {/* HEADER */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMobile && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={iconBtn}>{sidebarOpen ? <Icons.Close /> : <Icons.Menu />}</button>}
          <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: '#dc2626' }}><Icons.Lock /> Haremessenger</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* 2FA Button */}
          <button onClick={() => { setShow2FAModal(true); setSetupStep(0); }} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid #f59e0b', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icons.Shield /> 2FA
          </button>
          <button onClick={notificationsEnabled ? disableNotifications : enableNotifications} style={smBtn(notificationsEnabled)}>{notificationsEnabled ? <Icons.Bell /> : <Icons.BellOff />}</button>
          {!isMobile && (
            <>
              <button onClick={() => setShowSearch(true)} style={{ ...smBtn(false), background: '#dc2626', color: '#fff', border: 'none', display: 'flex', gap: 4, fontSize: 12 }}>
                <Icons.PersonAdd /> Adicionar
                {requests.length > 0 && <span style={{ background: '#fff', color: '#dc2626', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{requests.length}</span>}
              </button>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #dc2626, #06b6d4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{ini(user?.username)}</div>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>{user?.username}</span>
            </>
          )}
          <button onClick={doLogout} style={{ ...smBtn(false), color: '#dc2626', display: 'flex', gap: 4, fontSize: 12, fontWeight: 600 }}><Icons.Logout /> {!isMobile && 'Sair'}</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={sidebarStyle(isMobile, sidebarOpen)}>
          <div style={{ display: 'flex', padding: '10px', gap: 4, flexShrink: 0 }}>
            <button onClick={() => setTab('chats')} style={tab === 'chats' ? sideTabOn : sideTabOff}><Icons.Chat /> Chats</button>
            <button onClick={() => setTab('requests')} style={tab === 'requests' ? sideTabOn : sideTabOff}><Icons.Users /> Pedidos{requests.length > 0 && <span style={{ marginLeft: 4, background: '#ef4444', color: '#fff', borderRadius: 8, padding: '1px 5px', fontSize: 9 }}>{requests.length}</span>}</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
            {tab === 'chats' && (
              <>
                <div onClick={() => selectFriend({ id: 'ai' })} style={{ ...friendItem, background: aiChat ? '#f0fdf4' : 'transparent', border: aiChat ? '1px solid #10b981' : '1px solid transparent' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🤖</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 6 }}>Thunderbold_AI <span style={{ fontSize: 9, background: '#10b98120', color: '#10b981', padding: '1px 6px', borderRadius: 6, fontWeight: 600 }}>IA</span></div>
                    <div style={{ fontSize: 11, color: '#10b981' }}>Online</div>
                  </div>
                  <Icons.Bot />
                </div>
                <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
                {friends.map(f => (
                  <div key={f.id} onClick={() => selectFriend(f)} style={{ ...friendItem, background: selFriend?.id === f.id ? '#fef2f2' : 'transparent', border: selFriend?.id === f.id ? '1px solid #dc2626' : '1px solid transparent' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, #dc2626, #06b6d4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, position: 'relative' }}>
                      {ini(f.username)}<span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff', background: f.online ? '#10b981' : '#ccc' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>{f.username}</div><div style={{ fontSize: 11, color: '#999' }}>{f.telefone}</div></div>
                  </div>
                ))}
              </>
            )}
            {tab === 'requests' && requests.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: '#f8f8f8', borderRadius: 10, marginBottom: 4 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #dc2626, #06b6d4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{ini(r.remetente)}</div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>{r.remetente}</div><div style={{ fontSize: 11, color: '#999' }}>{r.telefone}</div></div>
                <button onClick={() => acceptReq(r.id)} style={{ padding: 6, background: '#10b981', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' }}><Icons.Check /></button>
                <button onClick={() => rejectReq(r.id)} style={{ padding: 6, background: 'transparent', border: '1px solid #ef4444', borderRadius: 6, color: '#ef4444', cursor: 'pointer' }}><Icons.CloseCircle /></button>
              </div>
            ))}
          </div>
        </div>
        {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />}

        {/* CHAT AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f0f2f5', minWidth: 0 }}>
          {aiChat ? (
            <>
              <div style={chatHeader}>
                {isMobile && <button onClick={() => { setAiChat(false); setSidebarOpen(true); }} style={iconBtn}><Icons.ChevronLeft /></button>}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🤖</div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>Thunderbold_AI</div><div style={{ fontSize: 11, color: '#10b981' }}>Online</div></div>
                <button onClick={clearAiHistory} style={iconBtn}><Icons.Trash /></button>
              </div>
              <div style={msgArea}>
                {aiMessages.map(m => (
                  <div key={m.id} style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: m.role === 'user' ? '#dc2626' : '#fff', color: m.role === 'user' ? '#fff' : '#1a1a2e', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: 13, animation: 'fadeMsg 0.2s ease', whiteSpace: 'pre-wrap' }}>
                    <div style={{ fontWeight: 600, fontSize: 10, marginBottom: 2, opacity: 0.6 }}>{m.role === 'user' ? user?.username : 'Thunderbold_AI'}</div>{m.content}
                  </div>
                ))}
                {aiLoading && <div style={{ alignSelf: 'flex-start', padding: 10, background: '#fff', borderRadius: 12, fontSize: 13, color: '#999' }}>Digitando...</div>}
                <div ref={msgEnd} />
              </div>
              <div style={chatInputSimple}>
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendToAI()} placeholder="Pergunte ao Thunderbold_AI..." style={msgInput} />
                <button onClick={sendToAI} disabled={!newMsg.trim() || aiLoading} style={{ ...sendBtn, background: '#10b981' }}><Icons.Send /></button>
              </div>
            </>
          ) : selFriend ? (
            <>
              <div style={chatHeader}>
                {isMobile && <button onClick={() => { setSelFriend(null); setSidebarOpen(true); }} style={iconBtn}><Icons.ChevronLeft /></button>}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #dc2626, #06b6d4)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, position: 'relative' }}>{ini(selFriend.username)}<span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff', background: selFriend.online ? '#10b981' : '#ccc' }} /></div>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{selFriend.username}</div><div style={{ fontSize: 11, color: '#999' }}>{selFriend.online ? 'Online' : 'Offline'}</div></div>
              </div>
              <div style={msgArea}>
                {msgs.map(m => {
                  let isMidia = false, midiaData = null;
                  try { if (typeof m.conteudo === 'string' && m.conteudo.startsWith('{')) { const d = JSON.parse(m.conteudo); if (d && d.tipo === 'midia') { isMidia = true; midiaData = d; } } } catch (e) {}
                  if (isMidia && midiaData) {
                    const emoji = { 'IMAGEM': '🖼️', 'VIDEO': '🎬', 'AUDIO': '🎵' };
                    return (
                      <div key={m.id} style={{ maxWidth: '70%', padding: '10px 13px', borderRadius: m.remetente === user.username ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: m.remetente === user.username ? '#dc2626' : '#fff', color: m.remetente === user.username ? '#fff' : '#1a1a2e', alignSelf: m.remetente === user.username ? 'flex-end' : 'flex-start', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: 13, animation: 'fadeMsg 0.2s ease' }}>
                        <div style={{ fontSize: 28, marginBottom: 4, textAlign: 'center' }}>{emoji[midiaData.tipo_midia] || '📎'}</div>
                        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{midiaData.nome_original || `${midiaData.tipo_midia} enviado`}</div>
                        <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 6 }}>{(midiaData.tamanho / 1024).toFixed(1)} KB</div>
                        <button onClick={() => downloadMidia(midiaData.arquivo_id)} style={{ padding: '6px 12px', background: m.remetente === user.username ? 'rgba(255,255,255,0.2)' : '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, width: '100%' }}>⬇️ Baixar</button>
                        <div style={{ fontSize: 9, marginTop: 4, textAlign: 'right', opacity: 0.6 }}>{ft(m.enviada_em)}</div>
                      </div>
                    );
                  }
                  return (
                    <div key={m.id} style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: m.remetente === user.username ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: m.remetente === user.username ? '#dc2626' : '#fff', color: m.remetente === user.username ? '#fff' : '#1a1a2e', alignSelf: m.remetente === user.username ? 'flex-end' : 'flex-start', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: 13, animation: 'fadeMsg 0.2s ease' }}>
                      {typeof m.conteudo === 'string' ? m.conteudo : '[Mensagem]'}<div style={{ fontSize: 9, marginTop: 3, textAlign: 'right', opacity: 0.5 }}>{ft(m.enviada_em)}</div>
                    </div>
                  );
                })}
                <div ref={msgEnd} />
              </div>
              <div style={chatInputBar}>
                {isRecording ? (
                  <button onClick={stopRecording} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 700, fontSize: 12, animation: 'recordingPulse 1.5s infinite' }}>⏹️ Parar {recordingType === 'audio' ? 'Áudio' : 'Vídeo'}</button>
                ) : (
                  <>
                    <button onClick={() => fileInputRef.current?.click()} style={iconBtn} title="Galeria">🖼️</button>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,video/*" />
                    <button onClick={() => cameraInputRef.current?.click()} style={iconBtn} title="Câmera">📸</button>
                    <input type="file" ref={cameraInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*" capture="environment" />
                    <button onClick={startAudioRecording} style={iconBtn} title="Gravar Áudio">🎤</button>
                    <button onClick={startVideoRecording} style={iconBtn} title="Gravar Vídeo">🎥</button>
                  </>
                )}
                <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} placeholder={isRecording ? 'Gravando...' : 'Mensagem...'} style={msgInput} disabled={isRecording} />
                <button onClick={sendMsg} disabled={!newMsg.trim() || isRecording} style={sendBtn}><Icons.Send /></button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, opacity: 0.08 }}>💬</div>
                <h2 style={{ fontSize: 17, color: '#1a1a2e', marginTop: 8 }}>{isMobile ? 'Conversas' : 'Seus chats'}</h2>
                <p style={{ fontSize: 13, color: '#999', margin: '4px 0 16px' }}>{isMobile ? 'Toque no menu' : 'Escolha um amigo'}</p>
                <button onClick={() => selectFriend({ id: 'ai' })} style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}><Icons.Bot /> Falar com Thunderbold_AI</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE NAV */}
      {isMobile && !selFriend && !aiChat && (
        <div style={mobileNav}>
          <button onClick={() => { setTab('chats'); setSidebarOpen(true); }} style={mobBtn}><Icons.Chat /><span style={{ fontSize: 10 }}>Chats</span></button>
          <button onClick={() => { setTab('requests'); setSidebarOpen(true); }} style={mobBtn}><Icons.Users /><span style={{ fontSize: 10 }}>Pedidos</span>{requests.length > 0 && <span style={{ position: 'absolute', top: 0, right: 4, background: '#ef4444', color: '#fff', borderRadius: 8, padding: '1px 4px', fontSize: 8 }}>{requests.length}</span>}</button>
          <button onClick={() => selectFriend({ id: 'ai' })} style={mobBtn}><Icons.Bot /><span style={{ fontSize: 10 }}>IA</span></button>
          <button onClick={() => setShowSearch(true)} style={mobBtn}><Icons.PersonAdd /><span style={{ fontSize: 10 }}>Add</span></button>
        </div>
      )}

      {/* SEARCH MODAL */}
      {showSearch && (
        <div onClick={() => setShowSearch(false)} style={modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={modalContent}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><Icons.PersonAdd /> Buscar Amigo</h2>
            <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>Digite o número de telefone.</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <input type="tel" placeholder="+55 (00) 00000-0000" value={searchPhone} onChange={e => setSearchPhone(e.target.value)} style={{ flex: 1, padding: '10px', background: '#f0f2f5', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
              <button onClick={doSearch} style={{ padding: '10px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Buscar</button>
            </div>
            {searchResult?.encontrado && (
              <div style={{ padding: 12, background: '#f8f8f8', borderRadius: 10, marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{searchResult.usuario.username}</div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{searchResult.usuario.telefone}</div>
                {searchResult.is_amigo ? <span style={{ color: '#10b981', fontWeight: 600, fontSize: 12 }}>✅ Já são amigos</span> : searchResult.solicitacao_enviada ? <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 12 }}>⏳ Aguardando</span> : <button onClick={sendReq} style={{ width: '100%', padding: 8, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Adicionar</button>}
              </div>
            )}
            <button onClick={() => setShowSearch(false)} style={{ width: '100%', padding: 10, background: '#f0f2f5', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#666', fontWeight: 600 }}>Fechar</button>
          </div>
        </div>
      )}

      {/* ===== MODAL 2FA ===== */}
      {show2FAModal && (
        <div style={modalOverlay} onClick={() => setShow2FAModal(false)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #dc2626, #f59e0b, #dc2626)', backgroundSize: '200% 100%', animation: 'shimmer 3s ease-in-out infinite' }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, marginTop: 6 }}>🔐 Autenticação de Dois Fatores</h2>
            
            {setupStep === 0 && (
              <>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Proteja sua conta com uma camada extra de segurança. Use o Google Authenticator para gerar códigos.</p>
                <button onClick={start2FASetup} style={{ ...btnCss(false), background: 'linear-gradient(135deg, #f59e0b, #dc2626)', marginBottom: 8 }}>⚡ Configurar 2FA</button>
                <button onClick={disable2FA} style={{ ...btnCss(false), background: 'transparent', border: '1px solid #dc2626', color: '#dc2626' }}>🗑️ Desativar 2FA</button>
              </>
            )}
            
            {setupStep === 1 && (
              <>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>1. Abra o Google Authenticator<br/>2. Escaneie o QR Code</p>
                {qrCode && <img src={qrCode} alt="QR Code" style={{ width: 180, height: 180, margin: '0 auto', display: 'block', borderRadius: 12, border: '2px solid #e5e5e5' }} />}
                <input value={codigo2FA} onChange={e => setCodigo2FA(e.target.value)} placeholder="Digite o código de 6 dígitos" maxLength={6} style={{ ...inp, marginTop: 12, textAlign: 'center', fontSize: 18, letterSpacing: 4 }} />
                <button onClick={verifyAndEnable2FA} style={btnCss(false)}>✅ Verificar e Ativar</button>
              </>
            )}
            
            {setupStep === 2 && (
              <>
                <p style={{ fontSize: 14, color: '#10b981', fontWeight: 700, marginBottom: 12 }}>✅ 2FA Ativado com Sucesso!</p>
                <p style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>⚠️ GUARDE ESTES CÓDIGOS DE BACKUP:</p>
                <div style={{ background: '#0f172a', color: '#10b981', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 11, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 12 }}>
                  {backupCodes.map((code, i) => <div key={i} style={{ padding: '2px 4px', border: '1px solid #1e293b', borderRadius: 4 }}>{code}</div>)}
                </div>
                <button onClick={() => { setShow2FAModal(false); setSetupStep(0); }} style={btnCss(false)}>👍 Entendi, Fechar</button>
              </>
            )}
            
            <button onClick={() => setShow2FAModal(false)} style={{ width: '100%', padding: 10, background: '#f0f0f0', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', marginTop: 8 }}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== ESTILOS =====
const inp = { width: '100%', padding: '12px', background: '#f0f2f5', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box', color: '#1a1a2e' };
const btnCss = (l) => ({ width: '100%', padding: 12, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: l ? 'not-allowed' : 'pointer', opacity: l ? 0.7 : 1 });
const tabOn = { flex: 1, padding: 10, border: 'none', borderRadius: 6, background: '#fff', color: '#dc2626', fontWeight: 600, cursor: 'pointer', fontSize: 13, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' };
const tabOff = { flex: 1, padding: 10, border: 'none', borderRadius: 6, background: 'transparent', color: '#999', fontWeight: 500, cursor: 'pointer', fontSize: 13 };
const iconBtn = { background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#333', display: 'flex', alignItems: 'center', fontSize: 18 };
const smBtn = (active) => ({ padding: '6px 10px', borderRadius: 6, background: active ? '#fef2f2' : 'transparent', border: active ? '1px solid #dc2626' : '1px solid #e0e0e0', cursor: 'pointer', color: active ? '#dc2626' : '#666', display: 'flex', alignItems: 'center' });
const sideTabOn = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px', border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', position: 'relative' };
const sideTabOff = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px', border: 'none', borderRadius: 8, background: 'transparent', color: '#666', fontWeight: 500, fontSize: 12, cursor: 'pointer', position: 'relative' };
const friendItem = { display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, cursor: 'pointer', marginBottom: 2, transition: 'all 0.1s' };
const mobBtn = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: '4px 8px', fontSize: 16, position: 'relative' };

const headerStyle = { background: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8e8e8', flexShrink: 0, zIndex: 100, gap: 8 };
const chatHeader = { padding: '10px 14px', background: '#fff', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #e8e8e8', flexShrink: 0 };
const msgArea = { flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 6 };
const msgInput = { flex: 1, padding: '10px 14px', background: '#f0f2f5', border: '1px solid #e0e0e0', borderRadius: 20, fontSize: 14, outline: 'none', minWidth: 0 };
const chatInputBar = { padding: '10px 14px', background: '#fff', display: 'flex', gap: 6, alignItems: 'center', borderTop: '1px solid #e8e8e8', flexShrink: 0 };
const chatInputSimple = { padding: '10px 14px', background: '#fff', display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #e8e8e8', flexShrink: 0 };
const sendBtn = { width: 38, height: 38, borderRadius: '50%', background: '#dc2626', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 1 };
const mobileNav = { background: '#fff', padding: '6px 8px', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #e8e8e8', flexShrink: 0 };
const sidebarStyle = (mob, open) => ({ width: mob ? '100%' : 350, height: '100%', background: '#fff', borderRight: mob ? 'none' : '1px solid #e8e8e8', display: mob && !open ? 'none' : 'flex', flexDirection: 'column', position: mob ? 'absolute' : 'relative', zIndex: 50, boxShadow: mob ? '0 0 30px rgba(0,0,0,0.2)' : 'none', animation: mob && open ? 'slideIn 0.2s ease' : 'none' });
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 };
const modalContent = { background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.2)', position: 'relative' };

export default App;
