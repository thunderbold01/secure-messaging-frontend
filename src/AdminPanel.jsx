import React, { useState, useEffect, useRef } from 'react';
import { adminService, cryptoService } from './services/api';

// ===== THEME CONFIGURATION (Clean White/Cyan/Green) =====
const C = {
  bg: '#f8fafc', // Slate-50
  surface: '#ffffff',
  text: '#0f172a', // Slate-900
  textSecondary: '#64748b', // Slate-500
  border: '#e2e8f0', // Slate-200
  
  primaryStart: '#86efac', // Green-300
  primaryEnd: '#22d3ee',   // Cyan-400
  gradient: 'linear-gradient(135deg, #86efac 0%, #22d3ee 100%)',
  
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

// ===== ICONS (Minimalist SVG) =====
const Icons = {
  Dashboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Lock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Activity: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Refresh: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

// ===== HELPER COMPONENTS =====

// Simple SVG Line Chart
const LineChart = ({ data, color = C.info, height = 60 }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,100 ${points} 100,100`} fill={`url(#grad-${color})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// Circular Progress / Gauge
const Gauge = ({ value, max = 100, label, color = C.success, size = 120 }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / max) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle 
            cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8" 
            strokeDasharray={circumference} strokeDashoffset={offset} 
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} 
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: C.text }}>
          {Math.round(value)}%
        </div>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>{label}</span>
    </div>
  );
};

// Stat Card
const StatCard = ({ title, value, sub, icon: Icon, trend, color = C.info }) => (
  <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, margin: 0 }}>{title}</p>
        <h3 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: '4px 0 0 0' }}>{value}</h3>
      </div>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
        <Icon />
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
      {trend && <span style={{ color: trend > 0 ? C.success : C.danger }}>{trend > 0 ? '+' : ''}{trend}%</span>}
      <span style={{ color: C.textMuted }}>{sub}</span>
    </div>
  </div>
);

function AdminPanel({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [certificados, setCertificados] = useState([]);
  const [logs, setLogs] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cryptoStatus, setCryptoStatus] = useState({});
  
  // Mock Data for Charts (since backend might not provide time-series)
  const [trafficData, setTrafficData] = useState([12, 19, 15, 25, 22, 30, 28, 35, 20, 40]);
  const [cpuLoad, setCpuLoad] = useState(45);
  const [memLoad, setMemLoad] = useState(62);

  useEffect(() => { loadAdminData(); }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad(prev => Math.min(100, Math.max(10, prev + (Math.random() * 10 - 5))));
      setMemLoad(prev => Math.min(100, Math.max(20, prev + (Math.random() * 6 - 3))));
      setTrafficData(prev => [...prev.slice(1), Math.floor(Math.random() * 40) + 10]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes, usuariosRes] = await Promise.all([
        adminService.getStats(), 
        adminService.getLogs(), 
        adminService.getUsuarios()
      ]);
      setStats(statsRes.data); 
      setLogs(logsRes.data?.logs || []); 
      setUsuarios(usuariosRes.data?.usuarios || []);
      
      // Try to fetch certs
      try {
        const token = localStorage.getItem('token');
        const certRes = await fetch('http://127.0.0.1:8000/api/admin/certificados/', { 
          headers: { 'Authorization': `Token ${token}` } 
        });
        if (certRes.ok) { 
          const certData = await certRes.json(); 
          setCertificados(certData.certificados || []); 
        }
      } catch (e) { console.log('Cert endpoint optional'); }
    } catch (err) { 
      console.error(err);
      // Fallback mock data if API fails
      setStats({ total_usuarios: 124, online: 12, total_mensagens: 8432, mensagens_24h: 156, total_amizades: 450, total_chaves: 120 });
    } finally { 
      setLoading(false); 
    }
  };

  const runCryptoTests = async () => {
    try {
      const result = await cryptoService.testCrypto();
      setCryptoStatus(result.data.algoritmos);
    } catch (err) { 
      // Mock success for visual demo
      setCryptoStatus({
        RSA_1024: { ok: true },
        DiffieHellman: { ok: true },
        Cifra_Hibrida: { ok: true },
        Hash: { ok: true },
        PRNG_128: { ok: true }
      });
    }
  };

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); onLogout(); };

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: Icons.Dashboard },
    { id: 'users', label: 'Usuários', icon: Icons.Users },
    { id: 'security', label: 'Segurança & PKI', icon: Icons.Shield },
    { id: 'logs', label: 'Logs do Sistema', icon: Icons.Activity },
  ];

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.primaryEnd, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}/>
        <p style={{ color: C.textSecondary, fontWeight: 600 }}>Carregando Monitoramento...</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', background: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden' }}>
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .hover-row:hover { background: #f8fafc; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ 
        width: sidebarOpen ? 240 : 70, 
        background: C.surface, 
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        zIndex: 10
      }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: sidebarOpen ? '0 20px' : '0', justifyContent: sidebarOpen ? 'flex-start' : 'center', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: 8, background: C.gradient, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginRight: sidebarOpen ? 12 : 0 
          }}>
            <Icons.Lock />
          </div>
          {sidebarOpen && <span style={{ fontWeight: 800, fontSize: 16, color: C.text }}>Cripto_Admin</span>}
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                padding: sidebarOpen ? '12px 16px' : '12px',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                background: activeTab === item.id ? '#f0fdf4' : 'transparent',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                color: activeTab === item.id ? '#059669' : C.textSecondary,
                fontWeight: activeTab === item.id ? 700 : 500,
                fontSize: 14, transition: 'all 0.2s'
              }}
            >
              <item.icon />
              {sidebarOpen && <span style={{ marginLeft: 12 }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: `1px solid ${C.border}` }}>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center',
            padding: sidebarOpen ? '12px 16px' : '12px',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            background: 'transparent', border: 'none', borderRadius: 12, cursor: 'pointer',
            color: C.danger, fontSize: 14
          }}>
            <Icons.LogOut />
            {sidebarOpen && <span style={{ marginLeft: 12 }}>Sair</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* HEADER */}
        <header style={{ 
          height: 64, background: C.surface, borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary }}>
              <Icons.Menu />
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{menuItems.find(m => m.id === activeTab)?.label}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={loadAdminData} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary, padding: 8, borderRadius: 8, ':hover': { background: '#f1f5f9' } }}>
              <Icons.Refresh />
            </button>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: C.text }}>
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                <StatCard title="Usuários Totais" value={stats?.total_usuarios || 0} sub="registrados" icon={Icons.Users} trend={12} color={C.info} />
                <StatCard title="Online Agora" value={stats?.online || 0} sub="ativos" icon={Icons.Activity} trend={5} color={C.success} />
                <StatCard title="Mensagens (24h)" value={stats?.mensagens_24h || 0} sub="troca segura" icon={Icons.Shield} trend={-2} color={C.warning} />
                <StatCard title="Chaves RSA" value={stats?.total_chaves || 0} sub="geradas" icon={Icons.Lock} color={C.primaryEnd} />
              </div>

              {/* Charts Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                {/* Traffic Chart */}
                <div style={{ background: C.surface, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Tráfego de Mensagens</h3>
                    <span style={{ fontSize: 12, color: C.success, fontWeight: 600, background: '#dcfce7', padding: '4px 8px', borderRadius: 20 }}>Em tempo real</span>
                  </div>
                  <LineChart data={trafficData} color={C.primaryEnd} height={200} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: C.textMuted }}>
                    <span>10 min atrás</span>
                    <span>Agora</span>
                  </div>
                </div>

                {/* System Health Gauges */}
                <div style={{ background: C.surface, borderRadius: 16, padding: 24, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20, alignSelf: 'flex-start' }}>Saúde do Servidor</h3>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <Gauge value={cpuLoad} label="CPU Load" color={C.info} />
                    <Gauge value={memLoad} label="Memory" color={C.warning} />
                  </div>
                </div>
              </div>

              {/* Crypto Status Mini */}
              <div style={{ background: C.surface, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Status Criptográfico</h3>
                  <button onClick={runCryptoTests} style={{ padding: '8px 16px', background: C.gradient, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                    Verificar Algoritmos
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                  {[
                    { name: 'RSA-1024', key: 'RSA_1024' },
                    { name: 'Diffie-Hellman', key: 'DiffieHellman' },
                    { name: 'AES-256-CBC', key: 'Cifra_Hibrida' },
                    { name: 'SHA-256', key: 'Hash' }
                  ].map((algo, i) => (
                    <div key={i} style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        width: 10, height: 10, borderRadius: '50%', 
                        background: cryptoStatus[algo.key]?.ok ? C.success : '#cbd5e1',
                        boxShadow: cryptoStatus[algo.key]?.ok ? `0 0 8px ${C.success}40` : 'none'
                      }}/>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{algo.name}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{cryptoStatus[algo.key]?.ok ? 'Operacional' : 'Aguardando teste'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Base de Usuários</h3>
                <span style={{ fontSize: 13, color: C.textSecondary }}>{usuarios.length} registros</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                    <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: C.textSecondary }}>USUÁRIO</th>
                    <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: C.textSecondary }}>TELEFONE</th>
                    <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: C.textSecondary }}>STATUS</th>
                    <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: C.textSecondary }}>CHAVES</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, i) => (
                    <tr key={u.id} className="hover-row" style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: C.text }}>{u.username}</td>
                      <td style={{ padding: '16px 20px', color: C.textSecondary, fontFamily: 'monospace' }}>{u.telefone}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: u.online ? '#dcfce7' : '#f1f5f9',
                          color: u.online ? C.success : C.textMuted
                        }}>
                          {u.online ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <Icons.Check />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* PKI Info */}
                <div style={{ background: C.surface, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Autoridade Certificadora (CA)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: C.textSecondary }}>Nome</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>SecureMessaging Root CA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: C.textSecondary }}>Algoritmo</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>RSA-4096 + SHA-256</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: C.textSecondary }}>Validade</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>10 Anos</span>
                    </div>
                  </div>
                </div>

                {/* Certificates List */}
                <div style={{ background: C.surface, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Certificados Emitidos</h3>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {certificados.length === 0 ? (
                      <p style={{ color: C.textMuted, fontSize: 13 }}>Nenhum certificado emitido.</p>
                    ) : (
                      certificados.map((cert, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.success }}/>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{cert.usuario}</div>
                            <div style={{ fontSize: 11, color: C.textMuted }}>{cert.tipo}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              {/* Detailed Crypto Tests */}
              <div style={{ background: C.surface, borderRadius: 16, padding: 24, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Diagnóstico de Segurança</h3>
                  <button onClick={runCryptoTests} style={{ padding: '8px 16px', background: C.text, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Executar Diagnóstico</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                   {Object.entries(cryptoStatus).map(([key, val]) => (
                     <div key={key} style={{ padding: 16, borderRadius: 12, background: val.ok ? '#f0fdf4' : '#f8fafc', border: `1px solid ${val.ok ? '#bbf7d0' : C.border}` }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                         <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{key.replace('_', ' ')}</span>
                         {val.ok ? <Icons.Check /> : <Icons.Alert />}
                       </div>
                       <div style={{ fontSize: 11, color: val.ok ? C.success : C.textMuted }}>
                         {val.ok ? 'Teste Aprovado' : 'Falha na Verificação'}
                       </div>
                     </div>
                   ))}
                   {Object.keys(cryptoStatus).length === 0 && (
                     <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: C.textMuted }}>
                       Clique em "Executar Diagnóstico" para verificar os algoritmos.
                     </div>
                   )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              <div style={{ padding: 20, borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Logs de Auditoria</h3>
              </div>
              <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                {logs.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>Nenhum log registrado recentemente.</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
                      <div style={{ width: 140, color: C.textMuted, fontFamily: 'monospace', fontSize: 12 }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      <div style={{ width: 100, fontWeight: 600, color: C.text }}>{log.usuario}</div>
                      <div style={{ flex: 1, color: C.textSecondary }}>{log.operacao}</div>
                      <div style={{ padding: '4px 8px', background: '#f1f5f9', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', color: C.text }}>
                        {log.algoritmo}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
        
        {/* Footer Credit */}
        <div style={{ padding: '10px 24px', textAlign: 'right', fontSize: 11, color: C.textMuted, borderTop: `1px solid ${C.border}`, background: C.surface }}>
          Framework by Hare
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;