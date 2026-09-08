import React, { useState, useEffect, useRef, useCallback } from 'react';
import { authService, userService, chatService, cryptoService } from './services/api';
import { API_BASE, WS_BASE } from './config';
import AdminPanel from './AdminPanel';
import MediaViewer from './MediaViewer';
import WebRTCCall from './WebRTCCall';
import TiltMosaic from './components/TiltMosaic';
import EncryptButton from './components/EncryptButton';

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>'"&]/g, function(c) {
    return {'<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;','&':'&amp;'}[c];
  });
}

function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  if (token.length < 10 || token.length > 200) return false;
  return true;
}

// Background image URL
const BG_IMAGE = 'https://image.qwenlm.ai/public_source/0203102d-d25c-4946-aa43-9509911dcaa2/194baccdb-a9bc-41b7-9eb7-ce11fe8d83b5.png';

const C = {
  bodyBg: '#f0f2f5',
  glass: '#ffffff',
  glassDark: '#f8f9fa',
  glassBorder: '#e0e0e0',
  glassBorderLight: '#eeeeee',
  text: '#1a1a1a',
  textSecondary: '#555555',
  textMuted: '#999999',
  accent: '#5865F2',
  green: '#23a55a',
  danger: '#ed4245',
  inputBg: '#f5f5f5',
  hover: '#f0f0f0',
  hoverBright: '#e8e8e8',
  msgSent: '#e3f2fd',
  msgReceived: '#ffffff',
  online: '#23a55a',
  offline: '#999999',
  idle: '#f0b232',
  dnd: '#ed4245',
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #a855f7, #ec4899)',
  'linear-gradient(135deg, #3b82f6, #06b6d4)',
  'linear-gradient(135deg, #f97316, #ef4444)',
  'linear-gradient(135deg, #22c55e, #3b82f6)',
  'linear-gradient(135deg, #a855f7, #3b82f6)',
  'linear-gradient(135deg, #ec4899, #f97316)',
  'linear-gradient(135deg, #06b6d4, #22c55e)',
  'linear-gradient(135deg, #ef4444, #a855f7)',
];

const I = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>,
  Smile: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  Mic: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>,
  Attach: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Phone: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  PhoneEnd: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>,
  Video: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  VideoOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 16V8a2 2 0 0 0-2-2H5.5"/><path d="M12.5 15.5L16 19"/><path d="M2 2l20 20"/><path d="M10.66 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5.34"/><polygon points="23 7 16 12 23 17 23 7"/></svg>,
  MicOff: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  More: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Image: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  File: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Logout: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  UserPlus: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  Lock: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  DoubleCheck: () => <svg width="16" height="14" viewBox="0 0 28 24" fill="none" stroke={C.green} strokeWidth="2.5"><polyline points="18 6 9 17 4 12"/><polyline points="24 6 15 17 12 14"/></svg>,
  Bot: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>,
  Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Call: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Gift: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  Sticker: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Gif: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><text x="6" y="15" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">GIF</text></svg>,
  Headset: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
  Minimize: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  ChevronUp: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
  Nitro: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  CallIcon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>,
  Spotify: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>,
  Game: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>,
  Stream: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 15h14v3H5z"/></svg>,
};

const Avatar = ({ name, online, size = 42, isAI, statusColor }) => {
  const bg = isAI ? 'linear-gradient(135deg, #5865F2, #23a55a)' : AVATAR_GRADIENTS[((name||'').charCodeAt(0)||0) % AVATAR_GRADIENTS.length];
  const letter = isAI ? '' : (name||'?')[0].toUpperCase();
  const sColor = statusColor || (online ? C.online : C.offline);
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:bg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize: size * 0.4, position:'relative', flexShrink:0 }}>
      {isAI ? <I.Bot /> : letter}
      {online !== undefined && <span style={{ position:'absolute', bottom:-1, right:-1, width:Math.max(10, size*0.28), height:Math.max(10, size*0.28), borderRadius:'50%', background: sColor, border:`2.5px solid rgba(18,18,26,0.95)` }}/>}
    </div>
  );
};

const AudioPlayer = ({ src }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const ref = useRef(null);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:200 }}>
      <audio ref={ref} src={src} onEnded={() => setPlaying(false)}
        onLoadedMetadata={() => setDuration(ref.current.duration)}
        onTimeUpdate={e => setProgress((e.target.currentTime / e.target.duration) * 100)} />
      <button onClick={() => { if(ref.current.paused) { ref.current.play(); setPlaying(true); } else { ref.current.pause(); setPlaying(false); } }}
        style={{ width:32, height:32, borderRadius:'50%', background:C.accent, border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {playing
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>}
      </button>
      <div style={{ flex:1 }}>
        <div style={{ height:3, background:'#e0e0e0', borderRadius:2, overflow:'hidden' }}>
          <div style={{ width:`${progress}%`, height:'100%', background:C.accent, borderRadius:2, transition:'width 0.1s linear' }} />
        </div>
        <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>
          {duration ? Math.floor(duration/60)+':'+String(Math.floor(duration%60)).padStart(2,'0') : ''}
        </div>
      </div>
    </div>
  );
};

function App() {
  const hasToken = isTokenValid(localStorage.getItem('token'));
  const savedUser = (() => { try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.username) return null;
    return parsed;
  } catch(e) { return null; } })();

  const [auth, setAuth] = useState(hasToken);
  const [user, setUser] = useState(savedUser);
  const [isAdmin, setIsAdmin] = useState(savedUser?.username === 'admin');
  const [selFriend, setSelFriend] = useState(null);
  const [showAiChat, setShowAiChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarView, setSidebarView] = useState('list');
  const [showRequests, setShowRequests] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [toast, setToast] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [callMinimized, setCallMinimized] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(false);
  const [headsetOn, setHeadsetOn] = useState(true);
  const prevReqCount = useRef(0);
  const globalWsRef = useRef(null);
  const activeCallRef = useRef(null);
  const incomingCallRef = useRef(null);
  const msgEndRef = useRef(null);
  const inputRef = useRef(null);
  const attachRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { if(msgEndRef.current) msgEndRef.current.scrollIntoView({ behavior:'smooth' }); }, [msgs, aiMessages]);

  useEffect(() => {
    if(!selFriend?.conversa_id || showAiChat) return;
    let active = true;
    const poll = async () => { if(!active) return; try { const r = await chatService.getMessages(selFriend.conversa_id); if(active) setMsgs(r.data.mensagens || []); } catch(e) {} };
    poll();
    const i = setInterval(poll, 2000);
    return () => { active = false; clearInterval(i); };
  }, [selFriend?.conversa_id, showAiChat]);

  useEffect(() => {
    if(!auth || isAdmin) return;
    let active = true;
    const poll = async () => { if(!active) return; try { const [fr, rq] = await Promise.all([userService.getFriends(), userService.getFriendRequests()]); if(active) {
      const newRecebidas = rq.data.recebidas || [];
      if(newRecebidas.length > prevReqCount.current && prevReqCount.current > 0) {
        setToast({ text: 'Novo pedido de amizade de ' + newRecebidas[0]?.remetente + '!', type:'friend' });
        setTimeout(() => setToast(null), 5000);
      }
      prevReqCount.current = newRecebidas.length;
      setFriends(fr.data.amigos || []); setRequests(newRecebidas);
    }} catch(e) {} };
    poll();
    const i = setInterval(poll, 5000);
    return () => { active = false; clearInterval(i); };
  }, [auth, isAdmin]);

  useEffect(() => { if(auth && user && !isAdmin) gerarChavesSeNecessario(); }, [auth, user, isAdmin]);

  useEffect(() => {
    const handleClick = (e) => { if(attachRef.current && !attachRef.current.contains(e.target)) setAttachOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

  useEffect(() => {
    if(!auth || isAdmin || !user) return;
    let ws = null;
    let reconnectTimeout = null;
    let closed = false;

    const connectWs = () => {
      if(closed) return;
      const token = localStorage.getItem('token');
      if(!isTokenValid(token)) return;
      const wsUrl = WS_BASE + '?token=' + encodeURIComponent(token);

      ws = new WebSocket(wsUrl);
      globalWsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if(data.type === 'incoming_call' && !activeCallRef.current) {
          setIncomingCall({ userId: data.sender_id, username: data.sender_name, callType: data.call_type });
        }
        if(data.type === 'call_end' && incomingCallRef.current) {
          setIncomingCall(null);
        }
      };

      ws.onclose = () => {
        if(!closed) reconnectTimeout = setTimeout(connectWs, 3000);
      };
    };

    connectWs();
    return () => {
      closed = true;
      if(ws) { ws.onclose = null; ws.close(); }
      if(reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [auth, isAdmin, user]);

  const gerarChavesSeNecessario = async () => {
    try { const v = await cryptoService.verificarChaves(); if(!v.data.tem_chaves) await cryptoService.gerarChavesRSA(); } catch(e) {}
  };

  const doLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const username = e.target.username.value.trim();
      const password = e.target.password.value;
      if (!username || !password) { alert('Preencha todos os campos'); setLoading(false); return; }
      if (username.length < 3 || username.length > 30) { alert('Username invalido'); setLoading(false); return; }
      if (password.length < 8) { alert('Password deve ter pelo menos 8 caracteres'); setLoading(false); return; }
      const r = await authService.login({ username, password });
      setUser(r.data.usuario); setAuth(true);
      localStorage.setItem('token', r.data.token);
      localStorage.setItem('user', JSON.stringify(r.data.usuario));
      setIsAdmin(r.data.usuario.username === 'admin');
    } catch(err) { alert('Credenciais invalidas'); } finally { setLoading(false); }
  };

  const doLogout = () => {
    try { chatService.getConversations?.(); } catch(e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login.html');
  };

  const selectFriend = (f) => { if(f?.id === 'ai') openAiChat(); else { setSelFriend(f); setShowAiChat(false); setShowRequests(false); if(isMobile) setSidebarView('chat'); } };

  const openAiChat = () => { if(!showAiChat) setAiMessages([{ role:'assistant', content:'Ola! Sou o Thunderbold_AI. Como posso ajudar?', id:Date.now() }]); setShowAiChat(true); setSelFriend(null); setShowRequests(false); if(isMobile) setSidebarView('chat'); };

  const sendMsg = useCallback(async () => {
    const m = newMsg.trim(); if(!m || !selFriend?.conversa_id) return;
    if(m.length > 5000) { setToast({text:'Mensagem muito longa (max 5000)', type:'error'}); setTimeout(() => setToast(null), 3000); return; }
    const tempId = Date.now();
    setMsgs(p => [...p, { id:tempId, remetente:user.username, conteudo:m, enviada_em:new Date().toISOString(), temp:true }]);
    setNewMsg('');
    try { await chatService.sendMessage(selFriend.conversa_id, m); const r = await chatService.getMessages(selFriend.conversa_id); setMsgs(r.data.mensagens || []); } catch(e) { setMsgs(p => p.filter(msg => msg.id !== tempId)); setNewMsg(m); }
  }, [newMsg, selFriend, user]);

  const handleFileUpload = useCallback(async (file, tipo) => {
    if(!file || !selFriend?.conversa_id) return;
    const maxSize = 10 * 1024 * 1024;
    if(file.size > maxSize) { alert('Arquivo muito grande (maximo 10MB)'); return; }
    const allowedExts = {
      'IMAGEM': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      'VIDEO': ['mp4', 'webm', 'ogg'],
      'AUDIO': ['webm', 'ogg', 'mp3', 'wav'],
      'ARQUIVO': ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar']
    };
    const ext = file.name.split('.').pop().toLowerCase();
    if(allowedExts[tipo] && !allowedExts[tipo].includes(ext)) { alert('Tipo de arquivo nao permitido'); return; }
    setAttachOpen(false);
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const mime = tipo === 'IMAGEM' ? 'image/' + (ext === 'jpg' ? 'jpeg' : ext) :
                     tipo === 'VIDEO' ? 'video/' + ext :
                     tipo === 'AUDIO' ? file.type || 'audio/webm' : file.type || 'application/octet-stream';
        await chatService.sendFile(selFriend.conversa_id, base64, tipo, file.name, mime);
        const r = await chatService.getMessages(selFriend.conversa_id);
        setMsgs(r.data.mensagens || []);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch(e) { setUploading(false); }
  }, [selFriend]);

  const sendToAI = useCallback(async () => {
    if(!aiInput.trim() || aiLoading) return;
    const msgText = aiInput.trim();
    if(msgText.length > 2000) { setToast({text:'Mensagem muito longa', type:'error'}); setTimeout(() => setToast(null), 3000); return; }
    setAiMessages(p => [...p, { role:'user', content:msgText, id:Date.now() }]);
    setAiInput(''); setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      if(!isTokenValid(token)) { window.location.replace('/login.html'); return; }
      const apiBase = API_BASE;
      const r = await fetch(apiBase + '/ai/chat/', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Token '+token}, body:JSON.stringify({mensagem:msgText}) });
      const d = await r.json();
      setAiMessages(p => [...p, { role:'assistant', content:d.reply || 'Sem resposta.', agent:d.agent_name, id:Date.now()+1 }]);
    } catch(e) { setAiMessages(p => [...p, { role:'assistant', content:'Erro de conexao.', id:Date.now()+1 }]); } finally { setAiLoading(false); }
  }, [aiInput, aiLoading]);

  const acceptReq = async (id) => { if(!id) return; try { await userService.respondToRequest(id, 'ACEITAR'); const [fr, rq] = await Promise.all([userService.getFriends(), userService.getFriendRequests()]); setFriends(fr.data.amigos || []); setRequests(rq.data.recebidas || []); } catch(e) {} };
  const rejectReq = async (id) => { if(!id) return; try { await userService.respondToRequest(id, 'RECUSAR'); const rq = await userService.getFriendRequests(); setRequests(rq.data.recebidas || []); } catch(e) {} };
  const doSearch = async () => { if(!searchPhone.trim()) return; const cleanPhone = searchPhone.replace(/\D/g, ''); if(cleanPhone.length < 9 || cleanPhone.length > 15) { alert('Telefone invalido'); return; } try { const r = await userService.searchByPhone(cleanPhone); setSearchResult(r.data); } catch(e) { setSearchResult(null); } };
  const sendFriendRequest = async () => { try { await userService.sendFriendRequest(searchResult.usuario.telefone); alert('Solicitacao enviada!'); setShowSearchModal(false); setSearchResult(null); setSearchPhone(''); } catch(e) { alert(e.response?.data?.erro || 'Erro'); } };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async (ev) => {
          if (!selFriend?.conversa_id) return;
          setUploading(true);
          try {
            await chatService.sendFile(selFriend.conversa_id, ev.target.result, 'AUDIO', 'gravacao.webm', 'audio/webm');
            const r = await chatService.getMessages(selFriend.conversa_id);
            setMsgs(r.data.mensagens || []);
          } catch(e) { alert('Erro ao enviar audio'); }
          setUploading(false);
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start(1000);
      setRecording(true);
      setRecordTime(0);
      recordTimerRef.current = setInterval(() => setRecordTime(p => p + 1), 1000);
    } catch(e) {
      alert('Microfone nao permitido');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    setRecording(false);
    setRecordTime(0);
  };

  const toggleRecording = () => {
    if (recording) stopRecording(); else startRecording();
  };

  const acceptIncomingCall = () => {
    if(incomingCall) {
      setActiveCall({ user: incomingCall.username, userId: incomingCall.userId, type: incomingCall.callType, caller:false });
      setIncomingCall(null);
    }
  };

  const rejectIncomingCall = () => {
    if(globalWsRef.current && globalWsRef.current.readyState === 1) {
      globalWsRef.current.send(JSON.stringify({ type: 'call_reject', target_user_id: incomingCall.userId }));
    }
    setIncomingCall(null);
  };

  const ft = (iso) => iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : '';

  if(auth && isAdmin) return <div style={{ height:'100dvh', width:'100vw', background:C.bodyBg, fontFamily:'"Fira Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow:'hidden' }}><AdminPanel user={user} onLogout={doLogout} /></div>;

  if(!auth) {
    window.location.href = '/login.html';
    return null;
  }

  const showSidebar = !isMobile || sidebarView === 'list';
  const showChat = !isMobile || sidebarView === 'chat';
  const activeMessages = showAiChat ? aiMessages : msgs;
  const activeName = showAiChat ? 'Thunderbold AI' : selFriend?.username;

  const renderMedia = (msg) => {
    const safeContent = typeof msg.conteudo === 'string' ? msg.conteudo : '';
    const safeName = typeof msg.nome_arquivo === 'string' ? msg.nome_arquivo : 'Ficheiro';
    if(msg.tipo === 'AUDIO') return <AudioPlayer src={safeContent} />;
    if(msg.tipo === 'VIDEO') return <video src={safeContent} controls style={{ maxWidth:330, maxHeight:250, borderRadius:12, background:'#000', display:'block' }} preload="metadata" />;
    if(msg.tipo === 'IMAGEM') return <img src={safeContent} alt="" style={{ maxWidth:330, maxHeight:280, borderRadius:12, cursor:'pointer', display:'block' }} onClick={() => setSelectedMedia(msg)} />;
    return <div style={{ display:'flex', alignItems:'center', gap:8 }}><I.File /><span style={{ fontSize:13, color:'#333333' }}>{escapeHtml(safeName)}</span></div>;
  };

  return (
    <div style={{ height:'100dvh', width:'100vw', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Fira Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow:'hidden', position:'relative' }}>
      {/* Interactive WebGL Background */}
      <div style={{ position:'absolute', inset:0, zIndex:0 }}>
        <TiltMosaic
          background="#e8eaed"
          baseColor="#d0d4da"
          accentColor="#f5f5f5"
          density={30}
          gap={3}
          rounded={90}
          tilt={15}
          reach={100}
          hover={0}
          speed={50}
          grain={5}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', minWidth:'unset', minHeight:'unset' }}
        />
      </div>

      <style>{`
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#f5f5f5}::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px}::-webkit-scrollbar-thumb:hover{background:#aaa}
        *{box-sizing:border-box;margin:0;padding:0}input:focus,textarea:focus{outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes typing{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes wave{0%,100%{height:4px}50%{height:18px}}
        @keyframes serverHover{from{border-radius:50%}to{border-radius:16px}}
        @keyframes ringPulse{0%{box-shadow:0 0 0 0 rgba(35,165,90,0.6)}100%{box-shadow:0 0 0 12px rgba(35,165,90,0)}}
        .server-icon{transition:all 0.2s ease}
        .server-icon:hover{border-radius:16px!important;transform:scale(1.05)}
        .server-icon.active{border-radius:16px!important}
        .dm-item{transition:background 0.15s ease}
        .dm-item:hover{background:#f0f0f0!important}
        .dm-item.active{background:#e8e8e8!important}
        .msg-row{transition:background 0.1s ease}
        .msg-row:hover{background:#f5f5f5}
        .btn-ctrl{transition:all 0.2s ease}
        .btn-ctrl:hover{transform:scale(1.08)}
        .btn-ctrl:active{transform:scale(0.95)}
        .call-bar{animation:slideUp 0.3s ease}
        .ring{animation:ringPulse 1.5s infinite}
        @media(max-width:767px){.app-sidebar{position:absolute!important;z-index:30;width:100%!important;height:100%}.app-chat{width:100%!important;position:absolute!important;z-index:25;height:100%}.app-serverbar{display:none!important}}
      `}</style>

      {/* Main App Container - Discord-like glass */}
      <div style={{ width:'100vw', height:'100dvh', display:'flex', overflow:'hidden', position:'relative' }}>

        {/* No server bar - removed */}

        {/* DM Sidebar */}
        {showSidebar && (
          <div className="app-sidebar" style={{ width:isMobile?'100%':260, background:'#ffffff', borderRight:'1px solid #e0e0e0', boxShadow:'2px 0 8px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', flexShrink:0, height:'100%' }}>
            {/* Search */}
            <div style={{ padding:'12px 12px 8px', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#f5f5f5', borderRadius:8, border:'1px solid #e0e0e0' }}>
                <span style={{ color:C.textMuted, display:'flex' }}><I.Search /></span>
                <input placeholder="Encontrar ou iniciar conversa" style={{ flex:1, border:'none', background:'transparent', fontSize:13, outline:'none', color:C.text, minWidth:0, fontFamily:'"Fira Sans", sans-serif' }} />
              </div>
            </div>

            {/* Menu Items */}
            <div style={{ padding:'4px 8px', flexShrink:0 }}>
              <div className="dm-item" style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, cursor:'pointer', color:C.textSecondary }}
                onClick={() => { setSelFriend(null); setShowAiChat(false); setShowRequests(false); if(isMobile) setSidebarView('list'); }}>
                <I.Users />
                <span style={{ fontSize:14, fontWeight:500 }}>Amigos</span>
              </div>
              <div className="dm-item" style={{ display:'flex', alignItems:'center', padding:'4px 12px', borderRadius:8, cursor:'pointer', color:C.textSecondary }}
                onClick={() => setShowSearchModal(true)}>
                <EncryptButton
                  label="Adicionar amigo"
                  fill="#5865F2"
                  textColor="#ffffff"
                  hoverTextColor="#ffffff"
                  paddingX={16}
                  paddingY={8}
                  rounded={8}
                  font={{ fontFamily: '"Fira Sans", sans-serif', fontWeight: 600, fontSize: 13, lineHeight: "1.2em", textAlign: "left" }}
                  sweepOptions={{ color: "#ffffff", speed: 7, count: 2, width: 8 }}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* DM Section Header */}
            <div style={{ padding:'12px 16px 4px', flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:0.5 }}>Mensagens Diretas</span>
            </div>

            {/* Friend requests section */}
            {requests.length > 0 && (
              <div style={{ padding:'0 8px', marginBottom:4, flexShrink:0 }}>
                <div onClick={() => setShowRequests(!showRequests)} style={{ padding:'8px 12px', background:'rgba(35,165,90,0.12)', borderRadius:8, border:'1px solid rgba(35,165,90,0.2)', cursor:'pointer', display:'flex', alignItems:'center', gap:10, transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,165,90,0.18)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(35,165,90,0.12)'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={C.green}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                  <span style={{ flex:1, fontSize:13, fontWeight:500, color:C.green }}>Pedidos de amizade</span>
                  <span style={{ background:C.green, color:'#fff', padding:'1px 7px', borderRadius:10, fontSize:11, fontWeight:700 }}>{requests.length}</span>
                </div>
              </div>
            )}

            {/* Expanded requests */}
            {showRequests && (
              <div style={{ padding:'0 12px', marginBottom:4, animation:'fadeUp 0.15s ease' }}>
                <div style={{ fontSize:11, fontWeight:600, color:C.green, textTransform:'uppercase', letterSpacing:0.5, padding:'4px 0' }}>Pedidos de amizade</div>
                {requests.length === 0 ? (
                  <div style={{ padding:16, textAlign:'center', color:C.textMuted, fontSize:12 }}>Nenhum pedido pendente</div>
                ) : requests.map(r => (
                  <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, background:'#f9f9f9', marginBottom:4 }}>
                    <Avatar name={r.remetente} size={36} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:C.text }}>{r.remetente}</div>
                      <div style={{ fontSize:11, color:C.textMuted }}>{r.telefone}</div>
                    </div>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => acceptReq(r.id)} style={{ padding:'4px 12px', background:C.green, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:11, fontFamily:'"Fira Sans", sans-serif' }}>Aceitar</button>
                      <button onClick={() => rejectReq(r.id)} style={{ padding:'4px 12px', background:'transparent', color:C.textMuted, border:'1px solid #e0e0e0', borderRadius:6, cursor:'pointer', fontSize:11, fontFamily:'"Fira Sans", sans-serif' }}>Recusar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Friends list area */}
            <div style={{ flex:1, overflowY:'auto', padding:'0 8px' }}>
              {/* AI Chat entry */}
              <div className="dm-item" onClick={() => openAiChat()} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', cursor:'pointer', borderRadius:8, background: showAiChat ? 'rgba(88,101,242,0.15)' : 'transparent', marginBottom:2 }}>
                <Avatar name="AI" isAI size={38} online />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:500, fontSize:14, color:C.text }}>Thunderbold AI</span>
                  </div>
                  <div style={{ fontSize:12, color:C.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
                    <I.Spotify />
                    Assistente inteligente
                  </div>
                </div>
              </div>

              {/* Friends list */}
              {friends.map(f => {
                const active = selFriend?.id === f.id && !showAiChat;
                const statusColor = f.online ? C.online : C.offline;
                return (
                  <div key={f.id} className={`dm-item ${active ? 'active' : ''}`} onClick={() => selectFriend(f)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', cursor:'pointer', borderRadius:8, background: active ? '#e8e8e8' : 'transparent', marginBottom:2 }}>
                    <Avatar name={f.username} online={f.online} size={38} statusColor={statusColor} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontWeight: active ? 600 : 400, fontSize:14, color:C.text }}>{f.username}</span>
                      </div>
                      <div style={{ fontSize:12, color:C.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
                        {f.canal_seguro ? <><I.Lock /> Canal Seguro</> : f.telefone}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {friends.length === 0 && !showRequests && (
                <div style={{ padding:'32px 16px', textAlign:'center' }}>
                  <div style={{ width:48, height:48, borderRadius:16, background:'rgba(88,101,242,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:C.accent }}><I.UserPlus /></div>
                  <p style={{ fontSize:12, color:C.textMuted }}>Nenhum contato ainda</p>
                </div>
              )}
            </div>

            {/* User profile bar at bottom */}
            <div style={{ padding:'8px 12px', borderTop:'1px solid #e0e0e0', display:'flex', alignItems:'center', gap:10, flexShrink:0, background:'#ffffff' }}>
              <div style={{ position:'relative' }}>
                <Avatar name={user?.username} online size={34} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.username}</div>
                <div style={{ fontSize:11, color:C.green, fontWeight:500 }}>Online</div>
              </div>
              <button onClick={() => setShowSearchModal(true)} style={{ width:30, height:30, borderRadius:8, background:'#f0f0f0', border:'none', cursor:'pointer', color:C.green, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e0e0e0'} onMouseLeave={e => e.currentTarget.style.background = '#f0f0f0'} title="Novo amigo">
                <I.UserPlus />
              </button>
              <button onClick={doLogout} style={{ width:30, height:30, borderRadius:8, background:'#f0f0f0', border:'none', cursor:'pointer', color:C.danger, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e0e0e0'} onMouseLeave={e => e.currentTarget.style.background = '#f0f0f0'} title="Terminar sessao">
                <I.Logout />
              </button>
            </div>
          </div>
        )}

        {/* Chat area */}
        {showChat && (
          <div className="app-chat" style={{ flex:1, display:'flex', flexDirection:'column', background:'#f0f2f5', minWidth:0 }}>
            {(selFriend || showAiChat) ? (
              <>
                {/* Chat header */}
                <div style={{ height:48, padding:'0 16px', borderBottom:'1px solid #e0e0e0', display:'flex', alignItems:'center', gap:12, background:'#ffffff', flexShrink:0 }}>
                  {isMobile && <button onClick={() => setSidebarView('list')} style={{ background:'none', border:'none', padding:4, color:C.accent, display:'flex' }}><I.Back /></button>}
                  <Avatar name={showAiChat ? 'AI' : selFriend?.username} isAI={showAiChat} online={selFriend?.online} size={36} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:15, color:C.text }}>{activeName}</div>
                    <div style={{ fontSize:11, color: showAiChat ? C.green : (selFriend?.online ? C.green : C.textMuted) }}>
                      {showAiChat ? 'Online' : (selFriend?.online ? 'Online' : 'Offline')}
                    </div>
                  </div>
                  {!showAiChat && selFriend && (
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => setActiveCall({ user: selFriend.username, userId: selFriend.id, type:'voice', caller:true })} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(35,165,90,0.15)', border:'none', cursor:'pointer', color:C.green, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s' }} title="Chamada de voz"><I.Phone /></button>
                      <button onClick={() => setActiveCall({ user: selFriend.username, userId: selFriend.id, type:'video', caller:true })} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(88,101,242,0.15)', border:'none', cursor:'pointer', color:C.accent, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s' }} title="Chamada de video"><I.Video /></button>
                      <div style={{ position:'relative', marginLeft:8 }}>
                        <input type="text" placeholder="Buscar" style={{ width:140, padding:'6px 28px 6px 10px', background:'#f5f5f5', border:'1px solid #e0e0e0', borderRadius:6, fontSize:12, color:C.text, outline:'none', fontFamily:'"Fira Sans", sans-serif' }} />
                        <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:C.textMuted, display:'flex' }}><I.Search /></span>
                      </div>
                      <button style={{ width:32, height:32, borderRadius:'50%', background:'transparent', border:'none', cursor:'pointer', color:C.textSecondary, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s' }}><I.More /></button>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div style={{ flex:1, overflowY:'auto', padding: isMobile ? '12px 16px' : '12px 24px', display:'flex', flexDirection:'column', gap:2, background:'#f0f2f5' }}>
                  <div style={{ textAlign:'center', padding:'16px 0' }}>
                    <div style={{ fontSize:11, color:C.textMuted }}>21 de Agosto de 2026</div>
                  </div>

                  {activeMessages.map((msg, idx) => {
                    const isOwn = showAiChat ? msg.role === 'user' : msg.remetente === user?.username;
                    const prev = activeMessages[idx-1];
                    const next = activeMessages[idx+1];
                    const isFirst = !prev || (prev.remetente || prev.role) !== (msg.remetente || msg.role);
                    const isLast = !next || (next.remetente || next.role) !== (msg.remetente || msg.role);
                    const isMedia = ['IMAGEM','AUDIO','VIDEO','ARQUIVO'].includes(msg.tipo);
                    const senderName = showAiChat ? (msg.role === 'user' ? user?.username : 'Thunderbold AI') : msg.remetente;

                    return (
                      <div key={msg.id} className="msg-row" style={{ display:'flex', gap:12, padding:'4px 8px', borderRadius:8, animation:'fadeUp 0.15s ease' }}>
                        {isFirst && !isOwn ? (
                          <Avatar name={senderName} size={40} />
                        ) : !isOwn ? (
                          <div style={{ width:40, flexShrink:0 }} />
                        ) : null}
                        <div style={{ flex:1, minWidth:0 }}>
                          {isFirst && (
                            <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:2 }}>
                              <span style={{ fontWeight:600, fontSize:14, color:C.text }}>{senderName}</span>
                              <span style={{ fontSize:11, color:C.textMuted }}>Hoje às {ft(msg.enviada_em)}</span>
                            </div>
                          )}
                          {isMedia ? (
                            <div style={{ marginTop:2 }}>{renderMedia(msg)}</div>
                          ) : (
                            <div style={{ fontSize:14, lineHeight:1.5, color:'#1a1a1a', wordBreak:'break-word', whiteSpace:'pre-wrap' }}>
                              {showAiChat ? (msg.content || '') : (msg.conteudo || '')}
                            </div>
                          )}
                          {isLast && isOwn && !showAiChat && (
                            <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:2 }}>
                              <I.DoubleCheck />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Call message */}
                  {activeCall && !showAiChat && (
                    <div className="msg-row" style={{ display:'flex', gap:12, padding:'4px 8px', borderRadius:8 }}>
                      <div style={{ width:40 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={C.green}><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                          <div>
                            <div style={{ fontWeight:600, fontSize:14, color:C.text }}>Chamada em andamento</div>
                            <div style={{ fontSize:12, color:C.textMuted }}>00:17:09</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {aiLoading && (
                    <div style={{ display:'flex', alignItems:'flex-end', gap:10, animation:'fadeUp 0.15s ease', padding:'4px 8px' }}>
                      <div style={{ width:40, flexShrink:0 }} />
                      <div style={{ display:'flex', gap:4, alignItems:'center', padding:'8px 12px' }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:C.accent, animation:'typing 1s infinite 0s' }} />
                        <div style={{ width:6, height:6, borderRadius:'50%', background:C.accent, animation:'typing 1s infinite 0.2s' }} />
                        <div style={{ width:6, height:6, borderRadius:'50%', background:C.accent, animation:'typing 1s infinite 0.4s' }} />
                      </div>
                    </div>
                  )}
                  <div ref={msgEndRef} />
                </div>

                {/* Message Input */}
                <div style={{ padding:'0 16px 8px', borderTop:'1px solid #e0e0e0', background:'#ffffff', flexShrink:0 }}>
                  {uploading && (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'4px 0', fontSize:12, color:C.accent, fontWeight:500 }}>
                      <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${C.accent}`, borderTopColor:'transparent', animation:'spin 1s linear infinite' }} />
                      Enviando ficheiro...
                    </div>
                  )}
                  {recording && (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'4px 0', fontSize:12, color:C.danger, fontWeight:600, animation:'fadeUp 0.15s ease' }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:C.danger, animation:'pulse 1s infinite' }} />
                      Gravando... {Math.floor(recordTime/60)}:{String(recordTime%60).padStart(2,'0')}
                      <button onClick={stopRecording} style={{ padding:'3px 10px', background:C.danger, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'"Fira Sans", sans-serif' }}>Parar</button>
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f5f5f5', borderRadius:8, padding:'4px 12px', border:'1px solid #e0e0e0' }}>
                    <input type="file" id="fi" accept="image/*" style={{ display:'none' }} onChange={e => { handleFileUpload(e.target.files[0], 'IMAGEM'); e.target.value=''; }} />
                    <input type="file" id="fv" accept="video/*" style={{ display:'none' }} onChange={e => { handleFileUpload(e.target.files[0], 'VIDEO'); e.target.value=''; }} />
                    <input type="file" id="fa" accept="audio/*" style={{ display:'none' }} onChange={e => { handleFileUpload(e.target.files[0], 'AUDIO'); e.target.value=''; }} />
                    <input type="file" id="fd" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar" style={{ display:'none' }} onChange={e => { handleFileUpload(e.target.files[0], 'ARQUIVO'); e.target.value=''; }} />

                    <button onClick={() => setAttachOpen(!attachOpen)} style={{ width:32, height:32, borderRadius:'50%', background:'transparent', border:'none', cursor:'pointer', color:C.textMuted, display:'flex', alignItems:'center', justifyContent:'center', transition:'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
                      <I.Attach />
                    </button>

                    <div style={{ flex:1, position:'relative' }} ref={attachRef}>
                      <input ref={inputRef} value={showAiChat ? aiInput : newMsg}
                        onChange={e => showAiChat ? setAiInput(e.target.value) : setNewMsg(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (showAiChat ? sendToAI : sendMsg)(); } }}
                        placeholder={`Mensagem @${activeName}`}
                        style={{ width:'100%', border:'none', background:'transparent', fontSize:14, outline:'none', color:C.text, fontFamily:'"Fira Sans", sans-serif', padding:'8px 0' }} />
                      {attachOpen && !showAiChat && (
                        <div style={{ position:'absolute', bottom:48, left:0, background:'#ffffff', borderRadius:12, boxShadow:'0 4px 20px rgba(0,0,0,0.12)', border:'1px solid #e0e0e0', overflow:'hidden', zIndex:10, minWidth:180, animation:'fadeUp 0.15s ease' }}>
                          <button onClick={() => document.getElementById('fi').click()} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px', background:'transparent', border:'none', color:C.text, cursor:'pointer', fontSize:13, fontFamily:'"Fira Sans", sans-serif', transition:'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><I.Image /> Foto</button>
                          <button onClick={() => document.getElementById('fv').click()} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px', background:'transparent', border:'none', color:C.text, cursor:'pointer', fontSize:13, fontFamily:'"Fira Sans", sans-serif', transition:'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><I.Video /> Video</button>
                          <button onClick={() => document.getElementById('fa').click()} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px', background:'transparent', border:'none', color:C.text, cursor:'pointer', fontSize:13, fontFamily:'"Fira Sans", sans-serif', transition:'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><I.Mic /> Audio</button>
                          <button onClick={() => { document.getElementById('fd').click(); setAttachOpen(false); }} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'10px 14px', background:'transparent', border:'none', color:C.text, cursor:'pointer', fontSize:13, fontFamily:'"Fira Sans", sans-serif', borderTop:'1px solid #e0e0e0', transition:'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><I.File /> Documento</button>
                        </div>
                      )}
                    </div>

                    <div style={{ display:'flex', gap:2 }}>
                      <button style={{ width:32, height:32, borderRadius:'50%', background:'transparent', border:'none', cursor:'pointer', color:C.textMuted, display:'flex', alignItems:'center', justifyContent:'center', transition:'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.textMuted} title="Presente"><I.Gift /></button>
                      <button style={{ width:32, height:32, borderRadius:'50%', background:'transparent', border:'none', cursor:'pointer', color:C.textMuted, display:'flex', alignItems:'center', justifyContent:'center', transition:'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.textMuted} title="Sticker"><I.Sticker /></button>
                      <button style={{ width:32, height:32, borderRadius:'50%', background:'transparent', border:'none', cursor:'pointer', color:C.textMuted, display:'flex', alignItems:'center', justifyContent:'center', transition:'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.textMuted} title="GIF"><I.Gif /></button>
                      <button style={{ width:32, height:32, borderRadius:'50%', background:'transparent', border:'none', cursor:'pointer', color:C.textMuted, display:'flex', alignItems:'center', justifyContent:'center', transition:'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.textMuted} title="Emoji"><I.Smile /></button>
                    </div>

                    {showAiChat ? (
                      <button onClick={sendToAI} disabled={(!aiInput.trim()) || aiLoading}
                        style={{ width:36, height:36, borderRadius:'50%', background: aiInput.trim() && !aiLoading ? C.accent : '#e0e0e0', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor: aiInput.trim() ? 'pointer' : 'default', flexShrink:0, transition:'background 0.2s' }}>
                        {aiLoading ? <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid #fff', borderTopColor:'transparent', animation:'spin 1s linear infinite' }} /> : <I.Send />}
                      </button>
                    ) : newMsg.trim() ? (
                      <button onClick={sendMsg} style={{ width:36, height:36, borderRadius:'50%', background:C.accent, border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, boxShadow:'0 2px 8px rgba(88,101,242,0.3)' }}><I.Send /></button>
                    ) : (
                      <button onClick={toggleRecording} style={{ width:36, height:36, borderRadius:'50%', background: recording ? C.danger : 'transparent', border:'none', color: recording ? '#fff' : C.textMuted, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all 0.2s' }}><I.Mic /></button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Empty state */
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <p style={{ fontSize:14, color:C.textMuted, textAlign:'center', maxWidth:360, lineHeight:1.5 }}>Envie mensagens, ficheiros, fotos e videos de forma segura e criptografada.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WebRTCCall - rendered OUTSIDE the container so position:fixed works */}
      {activeCall && (
        <WebRTCCall targetUser={activeCall.user} targetUserId={activeCall.userId} callType={activeCall.type} caller={activeCall.caller} onEndCall={() => { setActiveCall(null); setCallMinimized(false); }} />
      )}

      {/* Search modal */}
      {showSearchModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={() => setShowSearchModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#ffffff', width:'100%', maxWidth:400, borderRadius:16, padding:0, overflow:'hidden', animation:'fadeUp 0.2s ease', boxShadow:'0 10px 40px rgba(0,0,0,0.15)', border:'1px solid #e0e0e0' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #e0e0e0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:600, color:C.text, fontFamily:'"Fira Sans", sans-serif' }}>Novo contato</h3>
              <button onClick={() => setShowSearchModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:C.textMuted, padding:4 }}><I.X /></button>
            </div>
            <div style={{ padding:20 }}>
              <div style={{ display:'flex', gap:8 }}>
                <input type="tel" placeholder="Numero de telefone" value={searchPhone} onChange={e => setSearchPhone(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') doSearch(); }}
                  style={{ flex:1, padding:'10px 14px', borderRadius:10, border:'1px solid #e0e0e0', outline:'none', fontSize:14, color:C.text, background:'#f5f5f5', minWidth:0, fontFamily:'"Fira Sans", sans-serif' }} />
                <button onClick={doSearch} style={{ padding:'0 16px', background:C.accent, color:'#fff', border:'none', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'"Fira Sans", sans-serif' }}>Buscar</button>
              </div>
              {searchResult?.encontrado && (
                <div style={{ marginTop:16, padding:16, borderRadius:12, background:'#f9f9f9', animation:'fadeUp 0.2s ease', border:'1px solid #e0e0e0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <Avatar name={searchResult.usuario.username} size={42} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:15, color:C.text }}>{searchResult.usuario.username}</div>
                      <div style={{ fontSize:12, color:C.textMuted }}>{searchResult.usuario.telefone}</div>
                    </div>
                  </div>
                  <div style={{ marginTop:12 }}>
                    {searchResult.is_amigo ? <div style={{ color:C.green, fontSize:13, fontWeight:500 }}>Ja e seu amigo</div> :
                     searchResult.solicitacao_enviada ? <div style={{ color:C.textMuted, fontSize:13, fontWeight:500 }}>Solicitacao enviada</div> :
                     <button onClick={sendFriendRequest} style={{ width:'100%', padding:10, background:C.accent, color:'#fff', border:'none', borderRadius:10, fontWeight:600, cursor:'pointer', fontSize:14, fontFamily:'"Fira Sans", sans-serif', boxShadow:'0 2px 8px rgba(88,101,242,0.3)' }}>Enviar solicitacao</button>}
                  </div>
                </div>
              )}
              {searchResult && !searchResult.encontrado && (
                <div style={{ padding:20, textAlign:'center', color:C.textMuted, fontSize:13 }}>Usuario nao encontrado</div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedMedia && <MediaViewer mensagem={selectedMedia} onClose={() => setSelectedMedia(null)} />}

      {/* Incoming call popup */}
      {incomingCall && (
        <div style={{ position:'fixed', inset:0, zIndex:6000, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeUp 0.2s ease' }}>
          <div style={{ background:'#ffffff', borderRadius:20, padding:32, textAlign:'center', width:320, boxShadow:'0 10px 40px rgba(0,0,0,0.15)', border:'1px solid #e0e0e0' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background: incomingCall.callType === 'video' ? 'linear-gradient(135deg, #5865F2, #23a55a)' : 'linear-gradient(135deg, #23a55a, #5865F2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 4px 20px rgba(88,101,242,0.3)' }}>
              {incomingCall.callType === 'video' ? <I.Video /> : <I.Phone />}
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:C.text, marginBottom:4 }}>{incomingCall.username}</div>
            <div style={{ fontSize:14, color:C.textMuted, marginBottom:24 }}>Chamada {incomingCall.callType === 'video' ? 'de video' : 'de voz'}...</div>
            <div style={{ display:'flex', gap:16, justifyContent:'center' }}>
              <button onClick={rejectIncomingCall} style={{ width:64, height:64, borderRadius:'50%', background:C.danger, border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(237,66,69,0.4)' }}>
                <I.PhoneEnd />
              </button>
              <button onClick={acceptIncomingCall} style={{ width:64, height:64, borderRadius:'50%', background:C.green, border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(35,165,90,0.4)', animation:'pulse 1.5s infinite' }}>
                <I.Phone />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div onClick={() => { setToast(null); setShowRequests(true); }} style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', zIndex:7000, background:'#ffffff', borderRadius:12, padding:'12px 20px', boxShadow:'0 4px 20px rgba(0,0,0,0.15)', border:'1px solid #e0e0e0', display:'flex', alignItems:'center', gap:10, cursor:'pointer', animation:'fadeUp 0.3s ease', maxWidth:380 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:C.green, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, fontSize:13, color:C.text }}>{toast.text}</div>
            <div style={{ fontSize:11, color:C.textMuted }}>Toque para ver</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
