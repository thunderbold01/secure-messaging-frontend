import React, { useState, useEffect, useRef, useCallback } from 'react';
import { authService, userService, chatService } from './services/api';
import Admin from './Admin';

// ===== SISTEMA DE PUSH NOTIFICATIONS =====
class PushManager {
  constructor() {
    this.swRegistration = null;
    this.vapidPublicKey = null;
  }

  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications não suportadas');
      return false;
    }

    try {
      // Registrar Service Worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado');
      
      // Buscar VAPID key do backend
      const response = await fetch('/api/push/vapid-key');
      const data = await response.json();
      this.vapidPublicKey = data.publicKey;
      
      return true;
    } catch (error) {
      console.error('Erro ao inicializar push:', error);
      return false;
    }
  }

  async checkSubscription() {
    if (!this.swRegistration) return false;
    
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Erro ao verificar subscription:', error);
      return false;
    }
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        return { success: true, permission };
      } else {
        return { success: false, permission };
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return { success: false, permission: 'denied' };
    }
  }

  async subscribeUser() {
    if (!this.swRegistration || !this.vapidPublicKey) {
      throw new Error('Push Manager não inicializado');
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Enviar subscription para o backend
      const token = localStorage.getItem('token');
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
          }
        })
      });

      return true;
    } catch (error) {
      console.error('Erro ao inscrever para push:', error);
      throw error;
    }
  }

  async sendTestNotification() {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return true;
    } catch (error) {
      console.error('Erro ao enviar notificação teste:', error);
      return false;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

const pushManager = new PushManager();

// ===== ÍCONES SVG =====
const Icons = {
  Menu: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Close: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Chat: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  PersonAdd: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  Logout: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  CloseCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  ChevronLeft: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  BellOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
};

// ===== COMPONENTES MEMORIZADOS =====
const Avatar = React.memo(({ name, online, size = 44 }) => (
  <div style={{
    width: size, height: size, borderRadius: 14,
    background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: '800',
    fontSize: size > 40 ? 16 : 13, position: 'relative', flexShrink: 0,
    boxShadow: '0 8px 24px rgba(220, 38, 38, 0.25), 0 4px 12px rgba(6, 182, 212, 0.2)',
    border: '2px solid rgba(255,255,255,0.3)'
  }}>
    {(name || '??').substring(0, 2).toUpperCase()}
    {online !== undefined && (
      <span style={{
        position: 'absolute', bottom: -3, right: -3,
        width: 16, height: 16, borderRadius: '50%',
        border: '3px solid #0f172a',
        background: online ? '#10b981' : '#64748b',
        boxShadow: online ? '0 0 12px rgba(16, 185, 129, 0.6)' : 'none'
      }}/>
    )}
  </div>
));

const MessageBubble = React.memo(({ msg, isOwn }) => (
  <div style={{
    maxWidth: '72%', padding: '12px 16px',
    borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: isOwn ? 'linear-gradient(135deg, #dc2626, #06b6d4)' : 'rgba(30, 41, 59, 0.8)',
    color: '#fff',
    alignSelf: isOwn ? 'flex-end' : 'flex-start',
    boxShadow: isOwn 
      ? '0 8px 24px rgba(220, 38, 38, 0.3), 0 4px 12px rgba(6, 182, 212, 0.2)'
      : '0 4px 16px rgba(0, 0, 0, 0.3)',
    fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word',
    backdropFilter: 'blur(10px)',
    border: isOwn ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)'
  }}>
    {typeof msg.conteudo === 'string' ? msg.conteudo : '[Mensagem criptografada]'}
    <div style={{ fontSize: 10, marginTop: 5, textAlign: 'right', opacity: 0.6 }}>
      {msg.enviada_em ? new Date(msg.enviada_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
    </div>
  </div>
));

const Divider = React.memo(() => (
  <div style={{
    height: '2px',
    background: 'linear-gradient(90deg, #dc2626, #06b6d4, #dc2626)',
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3), 0 2px 8px rgba(6, 182, 212, 0.2)',
    borderRadius: 1
  }}/>
));

// ===== COMPONENTE PRINCIPAL =====
function App() {
  const [auth, setAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [authTab, setAuthTab] = useState('login');
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const msgEnd = useRef(null);

  // ===== DETECTAR MOBILE =====
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== INICIALIZAÇÃO =====
  useEffect(() => {
    const t = localStorage.getItem('token'), u = localStorage.getItem('user');
    if (t && u) {
      const d = JSON.parse(u);
      setUser(d);
      setAuth(true);
      setIsAdmin(d.username === 'admin');
    }
  }, []);

  // ===== PUSH NOTIFICATIONS =====
  useEffect(() => {
    if (auth && !isAdmin) {
      const initPush = async () => {
        try {
          const ok = await pushManager.init();
          if (ok) {
            const subscribed = await pushManager.checkSubscription();
            setNotificationsEnabled(subscribed);
            
            if (!subscribed && Notification.permission === 'granted') {
              await pushManager.subscribeUser();
              setNotificationsEnabled(true);
            }
          }
        } catch (e) {
          console.log('Push init error:', e);
        }
      };
      initPush();
    }
  }, [auth, isAdmin]);

  // ===== POLLING INTELIGENTE =====
  useEffect(() => {
    if (!auth || isAdmin) return;

    let active = true;
    let lastFriends = '';
    let lastRequests = '';

    const poll = async () => {
      if (!active) return;
      try {
        const [fr, rq] = await Promise.all([
          userService.getFriends(),
          userService.getFriendRequests()
        ]);
        
        if (!active) return;
        
        const friendsStr = JSON.stringify(fr.data.amigos || []);
        const requestsStr = JSON.stringify(rq.data.recebidas || []);
        
        if (friendsStr !== lastFriends) {
          lastFriends = friendsStr;
          setFriends(fr.data.amigos || []);
        }
        
        if (requestsStr !== lastRequests) {
          lastRequests = requestsStr;
          setRequests(rq.data.recebidas || []);
        }
      } catch (e) {}
    };

    poll();
    const interval = setInterval(poll, 1000);
    
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [auth, isAdmin]);

  // ===== POLLING MENSAGENS =====
  useEffect(() => {
    if (!selFriend?.conversa_id) return;

    let active = true;
    let lastMsgs = '';

    const pollMsgs = async () => {
      if (!active) return;
      try {
        const r = await chatService.getMessages(selFriend.conversa_id);
        if (!active) return;
        
        const msgsStr = JSON.stringify(r.data.mensagens || []);
        if (msgsStr !== lastMsgs) {
          lastMsgs = msgsStr;
          setMsgs(r.data.mensagens || []);
        }
      } catch (e) {}
    };

    pollMsgs();
    const interval = setInterval(pollMsgs, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selFriend?.conversa_id]);

  // ===== SCROLL =====
  useEffect(() => {
    if (msgEnd.current) {
      msgEnd.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [msgs]);

  // ===== HANDLERS =====
  const handleSelectFriend = useCallback((friend) => {
    setSelFriend(friend);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const sendMsg = useCallback(async () => {
    const msg = newMsg.trim();
    if (!msg || !selFriend?.conversa_id) return;

    setNewMsg('');
    
    try {
      await chatService.sendMessage(selFriend.conversa_id, msg);
      const r = await chatService.getMessages(selFriend.conversa_id);
      setMsgs(r.data.mensagens || []);
    } catch (err) {
      setNewMsg(msg);
      alert('Erro ao enviar mensagem');
    }
  }, [newMsg, selFriend]);

  const doLogin = useCallback(async (e) => {
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
      alert('Login falhou.');
    } finally {
      setLoading(false);
    }
  }, [login]);

  const doRegister = useCallback(async (e) => {
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
      alert('Registro falhou.');
    } finally {
      setLoading(false);
    }
  }, [reg]);

  const doLogout = useCallback(() => {
    localStorage.clear();
    setAuth(false);
    setUser(null);
    setIsAdmin(false);
    setFriends([]);
    setSelFriend(null);
    setMsgs([]);
  }, []);

  const enableNotifications = async () => {
    try {
      const result = await pushManager.requestPermission();
      if (result.success) {
        setNotificationsEnabled(true);
        await pushManager.subscribeUser();
        alert('✅ Notificações ativadas! Você receberá alertas mesmo com o navegador fechado.');
      } else {
        alert('❌ Permissão negada. Ative nas configurações do navegador.');
      }
    } catch (e) {
      console.error('Erro:', e);
    }
  };

  const disableNotifications = () => {
    setNotificationsEnabled(false);
    alert('🔕 Notificações desativadas.');
  };

  const doSearch = useCallback(async () => {
    if (!searchPhone.trim()) return;
    try {
      const r = await userService.searchByPhone(searchPhone);
      setSearchResult(r.data);
    } catch (err) {}
  }, [searchPhone]);

  const sendReq = useCallback(async () => {
    try {
      await userService.sendFriendRequest(searchResult.usuario.telefone);
      alert('Solicitação enviada!');
      setShowSearch(false);
      setSearchPhone('');
      setSearchResult(null);
    } catch (e) {
      alert(e.response?.data?.erro || 'Erro');
    }
  }, [searchResult]);

  const acceptReq = useCallback(async (id) => {
    try {
      await userService.respondToRequest(id, 'ACEITAR');
      const [fr, rq] = await Promise.all([
        userService.getFriends(),
        userService.getFriendRequests()
      ]);
      setFriends(fr.data.amigos || []);
      setRequests(rq.data.recebidas || []);
    } catch (e) {}
  }, []);

  const rejectReq = useCallback(async (id) => {
    try {
      await userService.respondToRequest(id, 'RECUSAR');
      const r = await userService.getFriendRequests();
      setRequests(r.data.recebidas || []);
    } catch (e) {}
  }, []);

  // ===== REDIRECIONAR ADMIN =====
  if (auth && isAdmin) return <Admin />;

  // ===== LOGIN PAGE =====
  if (!auth) {
    return (
      <div style={{
        minHeight: '100vh', width: '100vw', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        padding: 0, margin: 0, overflow: 'hidden'
      }}>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0f172a; margin: 0; padding: 0; overflow: hidden;
          }
          #root { width: 100vw; height: 100vh; }
        `}</style>
        
        {/* Partículas de fundo */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.1,
          background: 'radial-gradient(circle at 20% 50%, #dc2626 0%, transparent 50%), radial-gradient(circle at 80% 50%, #06b6d4 0%, transparent 50%)'
        }}/>
        
        <div style={{
          width: '100%', maxWidth: 420, background: 'rgba(30, 41, 59, 0.9)',
          borderRadius: 24, padding: '36px 28px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(220,38,38,0.3), 0 0 0 2px rgba(6,182,212,0.2)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative', zIndex: 1
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
              borderRadius: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff',
              boxShadow: '0 12px 32px rgba(220, 38, 38, 0.4), 0 4px 16px rgba(6, 182, 212, 0.3)'
            }}>
              <Icons.Lock />
            </div>
            <h1 style={{
              fontSize: 28, fontWeight: 900,
              background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: 6
            }}>
              Haremessenger
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>Mensageiro Seguro com Criptografia</p>
          </div>

          <div style={{
            display: 'flex', background: 'rgba(15, 23, 42, 0.8)', borderRadius: 10,
            padding: 3, marginBottom: 24,
            border: '1px solid rgba(220,38,38,0.2)'
          }}>
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => setAuthTab(t)}
                style={{
                  flex: 1, padding: 11, border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13, fontWeight: authTab === t ? 700 : 500,
                  background: authTab === t ? 'linear-gradient(135deg, #dc2626, #06b6d4)' : 'transparent',
                  color: authTab === t ? '#fff' : '#94a3b8',
                  boxShadow: authTab === t ? '0 4px 16px rgba(220,38,38,0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {t === 'login' ? 'Entrar' : 'Registrar'}
              </button>
            ))}
          </div>

          <Divider />
          
          <div style={{ marginTop: 24 }}>
            {authTab === 'login' ? (
              <form onSubmit={doLogin}>
                <input type="text" placeholder="Username" value={login.username}
                  onChange={e => setLogin(p => ({ ...p, username: e.target.value }))}
                  required style={inputDarkStyle} />
                <input type="password" placeholder="Senha" value={login.password}
                  onChange={e => setLogin(p => ({ ...p, password: e.target.value }))}
                  required style={{ ...inputDarkStyle, marginBottom: 20 }} />
                <button type="submit" disabled={loading} style={btnDarkStyle(loading)}>
                  {loading ? 'Entrando...' : '🔐 Entrar'}
                </button>
              </form>
            ) : (
              <form onSubmit={doRegister}>
                <input type="text" placeholder="Username" value={reg.username}
                  onChange={e => setReg(p => ({ ...p, username: e.target.value }))}
                  required style={inputDarkStyle} />
                <input type="tel" placeholder="Telefone" value={reg.telefone}
                  onChange={e => setReg(p => ({ ...p, telefone: e.target.value }))}
                  required style={inputDarkStyle} />
                <input type="password" placeholder="Senha" value={reg.password}
                  onChange={e => setReg(p => ({ ...p, password: e.target.value }))}
                  required style={{ ...inputDarkStyle, marginBottom: 20 }} />
                <button type="submit" disabled={loading} style={btnDarkStyle(loading)}>
                  {loading ? 'Registrando...' : '✨ Criar Conta'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== DASHBOARD =====
  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#0f172a', overflow: 'hidden', margin: 0, padding: 0
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #0f172a; overflow: hidden; margin: 0; padding: 0;
        }
        #root { width: 100vw; height: 100vh; overflow: hidden; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(#dc2626, #06b6d4); border-radius: 3px; }
      `}</style>

      {/* HEADER */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '12px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', zIndex: 100, flexShrink: 0,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(220,38,38,0.3)',
        borderBottom: '1px solid rgba(220,38,38,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(o => !o)} style={iconBtnDarkStyle}>
              {sidebarOpen ? <Icons.Close /> : <Icons.Menu />}
            </button>
          )}
          <h1 style={{
            fontSize: isMobile ? 17 : 20, fontWeight: 900,
            background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <Icons.Lock /> Haremessenger
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={notificationsEnabled ? disableNotifications : enableNotifications}
            style={{
              padding: '8px 12px', borderRadius: 10,
              background: notificationsEnabled ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: notificationsEnabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(148, 163, 184, 0.2)',
              cursor: 'pointer', fontSize: 16, color: notificationsEnabled ? '#10b981' : '#94a3b8',
              display: 'flex', alignItems: 'center', transition: 'all 0.2s'
            }}
            title={notificationsEnabled ? 'Desativar notificações' : 'Ativar notificações'}
          >
            {notificationsEnabled ? <Icons.Bell /> : <Icons.BellOff />}
          </button>
          {!isMobile && (
            <>
              <button onClick={() => setShowSearch(true)} style={{
                padding: '8px 16px', borderRadius: 10,
                background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center',
                gap: 6, position: 'relative',
                boxShadow: '0 4px 16px rgba(220,38,38,0.3), 0 2px 8px rgba(6,182,212,0.2)'
              }}>
                <Icons.PersonAdd /> Adicionar
                {requests.length > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: -5,
                    background: '#ef4444', color: '#fff', borderRadius: 12,
                    padding: '2px 7px', fontSize: 10, fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
                    animation: 'pulse 2s infinite'
                  }}>
                    {requests.length}
                  </span>
                )}
              </button>
              <Avatar name={user?.username} size={36} />
              <span style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>{user?.username}</span>
            </>
          )}
          <button onClick={doLogout} style={{
            padding: '8px 16px', background: 'transparent',
            border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10,
            cursor: 'pointer', fontSize: 12, fontWeight: 700,
            color: '#dc2626', display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.2s'
          }}>
            <Icons.Logout /> {!isMobile && 'Sair'}
          </button>
        </div>
      </header>

      <Divider />

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{
          width: isMobile ? '100%' : 380, height: '100%',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          display: isMobile && !sidebarOpen ? 'none' : 'flex',
          flexDirection: 'column', position: isMobile ? 'absolute' : 'relative',
          zIndex: 50, flexShrink: 0,
          borderRight: isMobile ? 'none' : '1px solid rgba(220,38,38,0.2)',
          boxShadow: isMobile ? '0 24px 48px rgba(0,0,0,0.8)' : '0 4px 24px rgba(0,0,0,0.4)',
          animation: isMobile && sidebarOpen ? 'slideIn 0.2s ease' : 'none'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', padding: '14px 14px 10px', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setTab('chats')} style={tabDarkStyle(tab === 'chats')}>
              <Icons.Chat /> Chats
            </button>
            <button onClick={() => setTab('requests')} style={tabDarkStyle(tab === 'requests')}>
              <Icons.Users /> Pedidos
              {requests.length > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#ef4444', color: '#fff', borderRadius: 10,
                  padding: '2px 6px', fontSize: 9, fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(239,68,68,0.5)'
                }}>
                  {requests.length}
                </span>
              )}
            </button>
          </div>

          <Divider />

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px' }}>
            {tab === 'chats' && friends.map(f => (
              <div
                key={f.id}
                onClick={() => handleSelectFriend(f)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 12, borderRadius: 14, cursor: 'pointer',
                  marginBottom: 4,
                  background: selFriend?.id === f.id ? 'rgba(220,38,38,0.1)' : 'transparent',
                  border: selFriend?.id === f.id
                    ? '1px solid rgba(220,38,38,0.4)'
                    : '1px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                <Avatar name={f.username} online={f.online} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{f.username}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{f.telefone}</div>
                </div>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: f.online ? '#10b981' : '#334155',
                  boxShadow: f.online ? '0 0 12px rgba(16,185,129,0.5)' : 'none',
                  flexShrink: 0
                }}/>
              </div>
            ))}
            {tab === 'requests' && requests.map(r => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: 12, background: 'rgba(30,41,59,0.6)',
                borderRadius: 14, marginBottom: 6,
                border: '1px solid rgba(220,38,38,0.15)'
              }}>
                <Avatar name={r.remetente} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{r.remetente}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{r.telefone}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => acceptReq(r.id)} style={{
                    padding: 8, background: '#10b981', border: 'none',
                    borderRadius: 10, color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                  }}>
                    <Icons.Check />
                  </button>
                  <button onClick={() => rejectReq(r.id)} style={{
                    padding: 8, background: 'transparent',
                    border: '1px solid #ef4444', borderRadius: 10,
                    color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}>
                    <Icons.CloseCircle />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overlay mobile */}
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)', zIndex: 40
          }}/>
        )}

        {/* CHAT */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: 'rgba(15, 23, 42, 0.6)', minWidth: 0
        }}>
          {selFriend ? (
            <>
              <div style={{
                padding: '12px 20px', background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', gap: 12,
                flexShrink: 0, borderBottom: '1px solid rgba(220,38,38,0.2)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
              }}>
                {isMobile && (
                  <button onClick={() => { setSelFriend(null); setSidebarOpen(true); }} style={iconBtnDarkStyle}>
                    <Icons.ChevronLeft />
                  </button>
                )}
                <Avatar name={selFriend.username} online={selFriend.online} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#f1f5f9' }}>{selFriend.username}</div>
                  <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: selFriend.online ? '#10b981' : '#334155',
                      display: 'inline-block',
                      boxShadow: selFriend.online ? '0 0 8px rgba(16,185,129,0.5)' : 'none'
                    }}/>
                    {selFriend.online ? 'Online agora' : 'Offline'}
                  </div>
                </div>
              </div>

              <Divider />

              <div style={{
                flex: 1, overflowY: 'auto', padding: '20px',
                display: 'flex', flexDirection: 'column', gap: 10
              }}>
                {msgs.map(m => (
                  <MessageBubble key={m.id} msg={m} isOwn={m.remetente === user.username} />
                ))}
                <div ref={msgEnd}/>
              </div>

              <Divider />

              <div style={{
                padding: '14px 20px', background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(20px)',
                display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0,
                borderTop: '1px solid rgba(220,38,38,0.2)'
              }}>
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), sendMsg())}
                  placeholder="Digite sua mensagem..."
                  style={{
                    flex: 1, padding: '13px 18px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    borderRadius: 50, fontSize: 14, outline: 'none',
                    color: '#f1f5f9', backdropFilter: 'blur(10px)'
                  }}
                />
                <button onClick={sendMsg} disabled={!newMsg.trim()} style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
                  border: 'none', color: '#fff',
                  cursor: newMsg.trim() ? 'pointer' : 'not-allowed',
                  opacity: newMsg.trim() ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 8px 24px rgba(220,38,38,0.4), 0 4px 12px rgba(6,182,212,0.3)'
                }}>
                  <Icons.Send />
                </button>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: 24
            }}>
              <div style={{ textAlign: 'center', maxWidth: 360 }}>
                <div style={{
                  fontSize: 72, marginBottom: 16, opacity: 0.2,
                  filter: 'grayscale(0.5)'
                }}>💬</div>
                <h2 style={{
                  fontSize: 20, fontWeight: 800, marginBottom: 8,
                  background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                  {isMobile ? 'Selecione uma conversa' : 'Seus chats'}
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                  {isMobile ? 'Toque no menu para ver suas conversas' : 'Escolha um amigo para conversar com segurança'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobile && !selFriend && (
        <>
          <Divider />
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            padding: '6px 16px', display: 'flex', justifyContent: 'space-around',
            flexShrink: 0, borderTop: '1px solid rgba(220,38,38,0.2)'
          }}>
            <button onClick={() => { setTab('chats'); setSidebarOpen(true); }} style={mobileNavDarkStyle}>
              <Icons.Chat /><span style={{ fontSize: 10 }}>Chats</span>
            </button>
            <button onClick={() => { setTab('requests'); setSidebarOpen(true); }} style={mobileNavDarkStyle}>
              <Icons.Users /><span style={{ fontSize: 10 }}>Pedidos</span>
              {requests.length > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 'calc(50% - 22px)',
                  background: '#ef4444', color: '#fff', borderRadius: 10,
                  padding: '2px 6px', fontSize: 9, fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(239,68,68,0.5)'
                }}>
                  {requests.length}
                </span>
              )}
            </button>
            <button onClick={() => setShowSearch(true)} style={mobileNavDarkStyle}>
              <Icons.PersonAdd /><span style={{ fontSize: 10 }}>Adicionar</span>
            </button>
          </div>
        </>
      )}

      {/* SEARCH MODAL */}
      {showSearch && (
        <div onClick={() => setShowSearch(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 16
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(24px)',
            borderRadius: 24, padding: 32,
            width: '100%', maxWidth: 460,
            boxShadow: '0 24px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(220,38,38,0.3), 0 0 0 2px rgba(6,182,212,0.2)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{
              fontSize: 20, fontWeight: 800, marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              <Icons.PersonAdd /> Buscar Amigo
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
              Digite o número de telefone para encontrar alguém.
            </p>
            
            <Divider />
            
            <div style={{ display: 'flex', gap: 8, margin: '20px 0' }}>
              <input type="tel" placeholder="+55 (00) 00000-0000"
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                style={{
                  flex: 1, padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(220,38,38,0.3)',
                  borderRadius: 12, fontSize: 14, outline: 'none',
                  color: '#f1f5f9'
                }} />
              <button onClick={doSearch} style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(220,38,38,0.3)'
              }}>
                Buscar
              </button>
            </div>

            {searchResult?.encontrado && (
              <>
                <Divider />
                <div style={{
                  padding: 16, background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 14, marginTop: 16,
                  border: '1px solid rgba(220,38,38,0.2)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9', marginBottom: 4 }}>
                    {searchResult.usuario.username}
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>
                    {searchResult.usuario.telefone}
                  </div>
                  {searchResult.is_amigo ? (
                    <span style={{
                      padding: '7px 14px', background: 'rgba(16,185,129,0.15)',
                      color: '#10b981', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      border: '1px solid rgba(16,185,129,0.3)'
                    }}>✅ Já são amigos</span>
                  ) : searchResult.solicitacao_enviada ? (
                    <span style={{
                      padding: '7px 14px', background: 'rgba(245,158,11,0.15)',
                      color: '#f59e0b', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      border: '1px solid rgba(245,158,11,0.3)'
                    }}>⏳ Aguardando</span>
                  ) : (
                    <button onClick={sendReq} style={{
                      width: '100%', padding: 12,
                      background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
                      color: '#fff', border: 'none', borderRadius: 12,
                      fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(220,38,38,0.3)'
                    }}>🤝 Adicionar Amigo</button>
                  )}
                </div>
              </>
            )}
            
            <button onClick={() => setShowSearch(false)} style={{
              width: '100%', padding: 12, marginTop: 20,
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 12,
              fontSize: 13, fontWeight: 700, color: '#94a3b8', cursor: 'pointer'
            }}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== ESTILOS DARK =====
const inputDarkStyle = {
  width: '100%', padding: '13px 16px',
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(220, 38, 38, 0.3)',
  borderRadius: 10, fontSize: 14, outline: 'none',
  marginBottom: 14, color: '#f1f5f9',
  boxSizing: 'border-box'
};

const btnDarkStyle = (loading) => ({
  width: '100%', padding: 14,
  background: 'linear-gradient(135deg, #dc2626, #06b6d4)',
  color: '#fff', border: 'none', borderRadius: 10,
  fontSize: 14, fontWeight: 700,
  cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.7 : 1,
  boxShadow: '0 8px 24px rgba(220,38,38,0.3), 0 4px 12px rgba(6,182,212,0.2)'
});

const iconBtnDarkStyle = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  padding: 8, color: '#f1f5f9', display: 'flex', alignItems: 'center'
};

const tabDarkStyle = (active) => ({
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: 7, padding: '10px 14px', border: 'none', borderRadius: 12,
  cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500,
  background: active ? 'linear-gradient(135deg, #dc2626, #06b6d4)' : 'transparent',
  color: active ? '#fff' : '#94a3b8',
  boxShadow: active ? '0 4px 16px rgba(220,38,38,0.3)' : 'none',
  position: 'relative', transition: 'all 0.2s'
});

const mobileNavDarkStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  gap: 4, background: 'transparent', border: 'none',
  color: '#94a3b8', cursor: 'pointer', padding: 8,
  position: 'relative', fontSize: 20
};

export default App;