import React, { useState, useEffect, useRef } from 'react';
import { authService, userService, chatService } from './services/api';
import Admin from './Admin';

// ===== PALETA DE CORES MODERNA =====
const C = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  secondary: '#06b6d4',
  accent: '#8b5cf6',
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',
  border: '#e2e8f0',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  online: '#10b981',
  offline: '#cbd5e1',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowMd: '0 4px 6px rgba(0,0,0,0.1)',
  shadowLg: '0 10px 15px rgba(0,0,0,0.1)',
  shadowXl: '0 20px 25px rgba(0,0,0,0.15)',
  radius: '12px',
  radiusSm: '8px',
  radiusLg: '16px',
  radiusFull: '50px',
};

// ===== ÍCONES SVG =====
const Icons = {
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  PersonAdd: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  Chat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Logout: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  CloseCircle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  ChevronLeft: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  MoreVert: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

// ===== COMPONENTE PRINCIPAL =====
function App() {
  const [auth, setAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const msgEnd = useRef(null);
  const pollingRef = useRef(null);

  // ===== DETECTAR MOBILE =====
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== FECHAR SIDEBAR AO SELECIONAR AMIGO NO MOBILE =====
  const handleSelectFriend = (friend) => {
    setSelFriend(friend);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // ===== INICIALIZAÇÃO =====
  useEffect(() => {
    const t = localStorage.getItem('token'), u = localStorage.getItem('user');
    if (t && u) {
      try {
        const d = JSON.parse(u);
        setUser(d);
        setAuth(true);
        if (d.username === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          loadFriends();
          loadRequests();
        }
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  // ===== NOTIFICAÇÕES =====
  useEffect(() => {
    if (auth && !isAdmin && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }
  }, [auth, isAdmin]);

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        new Notification('🔔 CipherChat', {
          body: 'Notificações ativadas com sucesso!',
        });
      } else {
        alert('❌ Permissão negada. Ative nas configurações do navegador.');
      }
    } catch (e) {
      console.error('Erro:', e);
    }
  };

  const disableNotifications = async () => {
    setNotificationsEnabled(false);
    alert('🔕 Notificações desativadas.');
  };

  // ===== POLLING DE MENSAGENS =====
  useEffect(() => {
    if (selFriend?.conversa_id) {
      loadMsgs();
      pollingRef.current = setInterval(loadMsgs, 2000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [selFriend?.conversa_id]);

  // ===== POLLING DE AMIGOS =====
  useEffect(() => {
    if (auth && !isAdmin) {
      const friendPolling = setInterval(() => {
        loadFriends();
        loadRequests();
      }, 5000);
      return () => clearInterval(friendPolling);
    }
  }, [auth, isAdmin]);

  // ===== SCROLL AUTOMÁTICO =====
  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // ===== API CALLS =====
  const loadFriends = async () => {
    try {
      const r = await userService.getFriends();
      setFriends(r.data.amigos || []);
    } catch (e) {
      console.error('Erro ao carregar amigos:', e);
    }
  };

  const loadRequests = async () => {
    try {
      const r = await userService.getFriendRequests();
      setRequests(r.data.recebidas || []);
    } catch (e) {
      console.error('Erro ao carregar solicitações:', e);
    }
  };

  const loadMsgs = async () => {
    if (!selFriend?.conversa_id) return;
    try {
      const r = await chatService.getMessages(selFriend.conversa_id);
      const mensagens = r.data.mensagens || [];
      setMsgs(mensagens);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

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
      if (userData.username === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        loadFriends();
        loadRequests();
      }
      setLogin({ username: '', password: '' });
    } catch (err) {
      alert('Login falhou. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

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
      if (userData.username === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        loadFriends();
        loadRequests();
      }
      setReg({ username: '', password: '', telefone: '' });
    } catch (err) {
      alert('Registro falhou. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const doLogout = () => {
    localStorage.clear();
    setAuth(false);
    setUser(null);
    setIsAdmin(false);
    setNotificationsEnabled(false);
    setFriends([]);
    setSelFriend(null);
    setMsgs([]);
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  const sendMsg = async () => {
    if (!newMsg.trim() || !selFriend?.conversa_id) return;

    const conteudo = newMsg.trim();
    setNewMsg('');

    try {
      await chatService.sendMessage(selFriend.conversa_id, conteudo);
      setTimeout(() => {
        loadMsgs();
      }, 300);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setNewMsg(conteudo);
      alert('Erro ao enviar mensagem');
    }
  };

  const doSearch = async () => {
    if (!searchPhone.trim()) return;
    try {
      const r = await userService.searchByPhone(searchPhone);
      setSearchResult(r.data);
    } catch (err) {
      console.error('Erro na busca:', err);
    }
  };

  const sendReq = async () => {
    if (!searchResult?.usuario) return;
    try {
      await userService.sendFriendRequest(searchResult.usuario.telefone);
      alert('Solicitação enviada!');
      setShowSearch(false);
      setSearchPhone('');
      setSearchResult(null);
    } catch (e) {
      alert(e.response?.data?.erro || 'Erro ao enviar solicitação');
    }
  };

  const acceptReq = async (id) => {
    try {
      await userService.respondToRequest(id, 'ACEITAR');
      loadFriends();
      loadRequests();
    } catch (e) {
      console.error('Erro ao aceitar:', e);
    }
  };

  const rejectReq = async (id) => {
    try {
      await userService.respondToRequest(id, 'RECUSAR');
      loadRequests();
    } catch (e) {
      console.error('Erro ao recusar:', e);
    }
  };

  const ini = (n) => (n ? n.substring(0, 2).toUpperCase() : '?');
  const ft = (iso) =>
    iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

  // ===== REDIRECIONAR ADMIN =====
  if (auth && isAdmin) return <Admin />;

  // ===== LOGIN PAGE =====
  if (!auth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${C.bg} 0%, ${C.surfaceAlt} 100%)`,
        padding: '16px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: C.surface,
          borderRadius: C.radiusLg,
          padding: '40px 32px',
          boxShadow: C.shadowXl,
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
              borderRadius: C.radius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}>
              <Icons.Lock />
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '800',
              background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px',
            }}>
              Haremessenger
            </h1>
            <p style={{ color: C.textMuted, fontSize: '14px' }}>
              Mensageiro Seguro com Criptografia
            </p>
          </div>

          <div style={{
            display: 'flex',
            background: C.surfaceAlt,
            borderRadius: C.radiusSm,
            padding: '4px',
            marginBottom: '24px',
          }}>
            <button
              onClick={() => setAuthTab('login')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: C.radiusSm,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: authTab === 'login' ? '600' : '400',
                background: authTab === 'login' ? C.surface : 'transparent',
                color: authTab === 'login' ? C.primary : C.textMuted,
                boxShadow: authTab === 'login' ? C.shadow : 'none',
                transition: 'all 0.2s',
              }}
            >
              Entrar
            </button>
            <button
              onClick={() => setAuthTab('register')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: C.radiusSm,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: authTab === 'register' ? '600' : '400',
                background: authTab === 'register' ? C.surface : 'transparent',
                color: authTab === 'register' ? C.primary : C.textMuted,
                boxShadow: authTab === 'register' ? C.shadow : 'none',
                transition: 'all 0.2s',
              }}
            >
              Registrar
            </button>
          </div>

          {authTab === 'login' ? (
            <form onSubmit={doLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: C.textSecondary,
                  marginBottom: '8px',
                }}>
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Seu username"
                  value={login.username}
                  onChange={e => setLogin({ ...login, username: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: C.surfaceAlt,
                    border: `2px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    fontSize: '14px',
                    color: C.text,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: C.textSecondary,
                  marginBottom: '8px',
                }}>
                  Senha
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={login.password}
                  onChange={e => setLogin({ ...login, password: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: C.surfaceAlt,
                    border: `2px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    fontSize: '14px',
                    color: C.text,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                  color: C.textInverse,
                  border: 'none',
                  borderRadius: C.radiusSm,
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: C.shadowMd,
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Entrando...' : '🔐 Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={doRegister}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: C.textSecondary,
                  marginBottom: '8px',
                }}>
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Escolha um username"
                  value={reg.username}
                  onChange={e => setReg({ ...reg, username: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: C.surfaceAlt,
                    border: `2px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    fontSize: '14px',
                    color: C.text,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: C.textSecondary,
                  marginBottom: '8px',
                }}>
                  Telefone
                </label>
                <input
                  type="tel"
                  placeholder="+55 (00) 00000-0000"
                  value={reg.telefone}
                  onChange={e => setReg({ ...reg, telefone: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: C.surfaceAlt,
                    border: `2px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    fontSize: '14px',
                    color: C.text,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: C.textSecondary,
                  marginBottom: '8px',
                }}>
                  Senha
                </label>
                <input
                  type="password"
                  placeholder="Crie uma senha segura"
                  value={reg.password}
                  onChange={e => setReg({ ...reg, password: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: C.surfaceAlt,
                    border: `2px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    fontSize: '14px',
                    color: C.text,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                  color: C.textInverse,
                  border: 'none',
                  borderRadius: C.radiusSm,
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: C.shadowMd,
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Registrando...' : '✨ Criar Conta'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ===== SIDEBAR CONTENT =====
  const sidebarContent = (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }}>
      {/* Search */}
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: C.surfaceAlt,
          borderRadius: C.radiusSm,
          border: `2px solid ${C.border}`,
        }}>
          <Icons.Search />
          <input
            placeholder="Buscar conversas..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '14px',
              color: C.text,
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        padding: '0 16px',
        gap: '4px',
        marginBottom: '8px',
      }}>
        <button
          onClick={() => setTab('chats')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px',
            border: 'none',
            borderRadius: C.radiusSm,
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: tab === 'chats' ? '600' : '400',
            background: tab === 'chats' ? C.primary : 'transparent',
            color: tab === 'chats' ? C.textInverse : C.textSecondary,
            transition: 'all 0.2s',
          }}
        >
          <Icons.Chat />
          Chats
        </button>
        <button
          onClick={() => setTab('requests')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px',
            border: 'none',
            borderRadius: C.radiusSm,
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: tab === 'requests' ? '600' : '400',
            background: tab === 'requests' ? C.primary : 'transparent',
            color: tab === 'requests' ? C.textInverse : C.textSecondary,
            transition: 'all 0.2s',
            position: 'relative',
          }}
        >
          <Icons.Users />
          Pedidos
          {requests.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '8px',
              background: C.danger,
              color: C.textInverse,
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: '700',
              minWidth: '18px',
              textAlign: 'center',
            }}>
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Contacts List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
      }}>
        {tab === 'chats' && friends.map(f => (
          <div
            key={f.id}
            onClick={() => handleSelectFriend(f)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: C.radiusSm,
              cursor: 'pointer',
              marginBottom: '4px',
              background: selFriend?.id === f.id ? C.surfaceAlt : 'transparent',
              border: selFriend?.id === f.id ? `2px solid ${C.primary}` : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: C.radiusSm,
              background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
              color: C.textInverse,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '16px',
              position: 'relative',
              flexShrink: 0,
            }}>
              {ini(f.username)}
              <span style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                border: `2px solid ${C.surface}`,
                background: f.online ? C.online : C.offline,
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '600', fontSize: '14px', color: C.text }}>
                {f.username}
              </div>
              <div style={{ fontSize: '12px', color: C.textMuted, marginTop: '2px' }}>
                {f.telefone}
              </div>
            </div>
          </div>
        ))}
        {tab === 'requests' && requests.map(r => (
          <div
            key={r.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: C.surfaceAlt,
              borderRadius: C.radiusSm,
              marginBottom: '8px',
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: C.radiusSm,
              background: `linear-gradient(135deg, ${C.secondary}, ${C.primary})`,
              color: C.textInverse,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '16px',
              flexShrink: 0,
            }}>
              {ini(r.remetente)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '600', fontSize: '14px', color: C.text }}>
                {r.remetente}
              </div>
              <div style={{ fontSize: '12px', color: C.textMuted, marginTop: '2px' }}>
                {r.telefone}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => acceptReq(r.id)}
                style={{
                  padding: '8px',
                  background: C.success,
                  border: 'none',
                  borderRadius: C.radiusSm,
                  color: C.textInverse,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icons.Check />
              </button>
              <button
                onClick={() => rejectReq(r.id)}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: `2px solid ${C.danger}`,
                  borderRadius: C.radiusSm,
                  color: C.danger,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icons.CloseCircle />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ===== DASHBOARD =====
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: C.bg,
      overflow: 'hidden',
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; padding: 0; overflow: hidden; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOut {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: C.shadow,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: C.text,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {sidebarOpen ? <Icons.Close /> : <Icons.Menu />}
            </button>
          )}
          <h1 style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '800',
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Icons.Lock />
            Haremessenger
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={notificationsEnabled ? disableNotifications : enableNotifications}
            style={{
              padding: '8px 12px',
              background: notificationsEnabled ? `${C.success}15` : 'transparent',
              border: `2px solid ${notificationsEnabled ? C.success : C.border}`,
              borderRadius: C.radiusSm,
              cursor: 'pointer',
              fontSize: '16px',
              color: notificationsEnabled ? C.success : C.textMuted,
              display: 'flex',
              alignItems: 'center',
            }}
            title={notificationsEnabled ? 'Desativar notificações' : 'Ativar notificações'}
          >
            {notificationsEnabled ? '🔔' : '🔕'}
          </button>
          {!isMobile && (
            <>
              <button
                onClick={() => setShowSearch(true)}
                style={{
                  padding: '8px 12px',
                  background: C.primary,
                  border: 'none',
                  borderRadius: C.radiusSm,
                  cursor: 'pointer',
                  color: C.textInverse,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  position: 'relative',
                }}
              >
                <Icons.PersonAdd />
                Adicionar
                {requests.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: C.danger,
                    color: C.textInverse,
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: '700',
                  }}>
                    {requests.length}
                  </span>
                )}
              </button>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: C.radiusSm,
                background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                color: C.textInverse,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '14px',
              }}>
                {ini(user?.username)}
              </div>
              <span style={{ fontWeight: '600', fontSize: '14px', color: C.text }}>
                {user?.username}
              </span>
            </>
          )}
          <button
            onClick={doLogout}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: `2px solid ${C.border}`,
              borderRadius: C.radiusSm,
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              color: C.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icons.Logout />
            {!isMobile && 'Sair'}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* SIDEBAR */}
        <div style={{
          width: isMobile ? '100%' : '380px',
          height: '100%',
          background: C.surface,
          borderRight: isMobile ? 'none' : `1px solid ${C.border}`,
          display: isMobile && !sidebarOpen ? 'none' : 'flex',
          flexDirection: 'column',
          position: isMobile ? 'absolute' : 'relative',
          zIndex: 50,
          boxShadow: isMobile ? C.shadowXl : 'none',
          animation: isMobile && sidebarOpen ? 'slideIn 0.3s ease' : 'none',
        }}>
          {sidebarContent}
        </div>

        {/* OVERLAY MOBILE */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 40,
            }}
          />
        )}

        {/* CHAT AREA */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: C.bg,
        }}>
          {selFriend ? (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '16px',
                background: C.surface,
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: C.shadow,
              }}>
                {isMobile && (
                  <button
                    onClick={() => {
                      setSelFriend(null);
                      setSidebarOpen(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      color: C.text,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Icons.ChevronLeft />
                  </button>
                )}
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: C.radiusSm,
                  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                  color: C.textInverse,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '16px',
                  flexShrink: 0,
                }}>
                  {ini(selFriend.username)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: C.text }}>
                    {selFriend.username}
                  </div>
                  <div style={{ fontSize: '12px', color: C.textMuted, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: selFriend.online ? C.online : C.offline,
                      display: 'inline-block',
                    }} />
                    {selFriend.online ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {msgs.map(m => (
                  <div
                    key={m.id}
                    style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: m.remetente === user.username
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                      background: m.remetente === user.username
                        ? `linear-gradient(135deg, ${C.primary}, ${C.accent})`
                        : C.surface,
                      color: m.remetente === user.username ? C.textInverse : C.text,
                      alignSelf: m.remetente === user.username ? 'flex-end' : 'flex-start',
                      boxShadow: C.shadow,
                      fontSize: '14px',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {typeof m.conteudo === 'string' ? m.conteudo : '[Mensagem criptografada]'}
                    <div style={{
                      fontSize: '10px',
                      marginTop: '4px',
                      textAlign: 'right',
                      opacity: 0.7,
                    }}>
                      {ft(m.enviada_em)}
                    </div>
                  </div>
                ))}
                <div ref={msgEnd} />
              </div>

              {/* Input */}
              <div style={{
                padding: '16px',
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}>
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMsg())}
                  placeholder="Digite sua mensagem..."
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    background: C.surfaceAlt,
                    border: `2px solid ${C.border}`,
                    borderRadius: C.radiusFull,
                    fontSize: '14px',
                    outline: 'none',
                    color: C.text,
                  }}
                />
                <button
                  onClick={sendMsg}
                  disabled={!newMsg.trim()}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                    border: 'none',
                    color: C.textInverse,
                    cursor: newMsg.trim() ? 'pointer' : 'not-allowed',
                    opacity: newMsg.trim() ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: C.shadowMd,
                    flexShrink: 0,
                  }}
                >
                  <Icons.Send />
                </button>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
            }}>
              <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                <div style={{
                  fontSize: '64px',
                  marginBottom: '16px',
                  opacity: 0.3,
                }}>
                  💬
                </div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: C.text,
                  marginBottom: '8px',
                }}>
                  {isMobile ? 'Selecione uma conversa' : 'Selecione um amigo'}
                </h2>
                <p style={{ fontSize: '14px', color: C.textMuted, lineHeight: 1.6 }}>
                  {isMobile
                    ? 'Toque no menu para ver suas conversas'
                    : 'Escolha uma conversa na lista ao lado para começar a trocar mensagens de forma segura.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && !selFriend && (
        <div style={{
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-around',
          boxShadow: '0 -4px 6px rgba(0,0,0,0.05)',
        }}>
          <button
            onClick={() => {
              setTab('chats');
              setSidebarOpen(true);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: tab === 'chats' ? C.primary : C.textMuted,
              fontSize: '12px',
              fontWeight: tab === 'chats' ? '600' : '400',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <Icons.Chat />
            Chats
          </button>
          <button
            onClick={() => {
              setTab('requests');
              setSidebarOpen(true);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: tab === 'requests' ? C.primary : C.textMuted,
              fontSize: '12px',
              fontWeight: tab === 'requests' ? '600' : '400',
              cursor: 'pointer',
              padding: '8px',
              position: 'relative',
            }}
          >
            <Icons.Users />
            Pedidos
            {requests.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: 'calc(50% - 20px)',
                background: C.danger,
                color: C.textInverse,
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: '700',
                minWidth: '18px',
                textAlign: 'center',
              }}>
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowSearch(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: C.textMuted,
              fontSize: '12px',
              fontWeight: '400',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <Icons.PersonAdd />
            Adicionar
          </button>
        </div>
      )}

      {/* SEARCH MODAL */}
      {showSearch && (
        <div
          onClick={() => setShowSearch(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: C.surface,
              borderRadius: C.radiusLg,
              padding: '32px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: C.shadowXl,
            }}
          >
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: C.text,
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Icons.PersonAdd />
              Buscar Amigo
            </h2>
            <p style={{
              fontSize: '14px',
              color: C.textMuted,
              marginBottom: '24px',
              lineHeight: 1.5,
            }}>
              Digite o número de telefone para encontrar alguém e enviar um pedido de amizade.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="tel"
                placeholder="+55 (00) 00000-0000"
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: C.surfaceAlt,
                  border: `2px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <button
                onClick={doSearch}
                style={{
                  padding: '12px 24px',
                  background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                  color: C.textInverse,
                  border: 'none',
                  borderRadius: C.radiusSm,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Buscar
              </button>
            </div>
            {searchResult?.encontrado && (
              <div style={{
                padding: '16px',
                background: C.surfaceAlt,
                borderRadius: C.radiusSm,
                marginBottom: '16px',
              }}>
                <div style={{ fontWeight: '600', fontSize: '16px', color: C.text, marginBottom: '4px' }}>
                  {searchResult.usuario.username}
                </div>
                <div style={{ fontSize: '14px', color: C.textMuted, marginBottom: '12px' }}>
                  {searchResult.usuario.telefone}
                </div>
                {searchResult.is_amigo ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: `${C.success}15`,
                    color: C.success,
                    borderRadius: C.radiusFull,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    ✅ Já são amigos
                  </span>
                ) : searchResult.solicitacao_enviada ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: `${C.warning}15`,
                    color: C.warning,
                    borderRadius: C.radiusFull,
                    fontSize: '13px',
                    fontWeight: '600',
                  }}>
                    ⏳ Aguardando
                  </span>
                ) : (
                  <button
                    onClick={sendReq}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                      color: C.textInverse,
                      border: 'none',
                      borderRadius: C.radiusSm,
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    🤝 Adicionar Amigo
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => setShowSearch(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: C.surfaceAlt,
                border: `2px solid ${C.border}`,
                borderRadius: C.radiusSm,
                fontSize: '14px',
                fontWeight: '600',
                color: C.textSecondary,
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
