import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WS_BASE } from './config';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #a855f7, #ec4899)',
  'linear-gradient(135deg, #3b82f6, #06b6d4)',
  'linear-gradient(135deg, #f97316, #ef4444)',
  'linear-gradient(135deg, #22c55e, #3b82f6)',
];

function WebRTCCall({ targetUser, targetUserId, callType, caller, onEndCall }) {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(false);
  const [headsetOn, setHeadsetOn] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [showCallBanner, setShowCallBanner] = useState(true);
  const [status, setStatus] = useState('calling');
  const [errorMsg, setErrorMsg] = useState('');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const endedRef = useRef(false);
  const mountedRef = useRef(true);
  const timerRef = useRef(null);
  const statusRef = useRef('calling');

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const setStatusSafe = useCallback((s) => {
    statusRef.current = s;
    if (mountedRef.current) setStatus(s);
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch(e) {}
      peerConnectionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => { try { t.stop(); } catch(e) {} });
      streamRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.onclose = null; wsRef.current.close(); } catch(e) {}
      wsRef.current = null;
    }
  }, []);

  const endCall = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try { wsRef.current.send(JSON.stringify({ type: 'call_end', target_user_id: targetUserId })); } catch(e) {}
    }
    cleanup();
    onEndCall();
  }, [targetUserId, cleanup, onEndCall]);

  useEffect(() => {
    mountedRef.current = true;
    endedRef.current = false;

    const init = async () => {
      var PC = window.RTCPeerConnection || window.webkitRTCPeerConnection;
      if (!PC) {
        setErrorMsg('Navegador nao suporta chamadas');
        setStatusSafe('error');
        setTimeout(() => { if (!endedRef.current) endCall(); }, 3000);
        return;
      }

      try {
        var constraints = {
          audio: true,
          video: callType === 'video' ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } } : false,
        };
        var stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' ? true : false });
        }
        if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        var token = localStorage.getItem('token');
        var wsUrl = WS_BASE + '?token=' + token;
        var ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const createPC = async (s, remoteUid) => {
          var pc = new PC({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          });
          peerConnectionRef.current = pc;
          s.getTracks().forEach(t => pc.addTrack(t, s));
          pc.onicecandidate = (ev) => {
            if (ev.candidate && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ice_candidate', target_user_id: remoteUid, candidate: ev.candidate.toJSON() }));
            }
          };
          pc.ontrack = (ev) => {
            if (remoteVideoRef.current && ev.streams && ev.streams[0]) {
              remoteVideoRef.current.srcObject = ev.streams[0];
            }
          };
          pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') setStatusSafe('connected');
            if ((pc.connectionState === 'disconnected' || pc.connectionState === 'failed') && !endedRef.current) {
              setErrorMsg('Conexao perdida');
              setTimeout(() => { if (!endedRef.current) endCall(); }, 2000);
            }
          };
          return pc;
        };

        ws.onopen = () => {
          if (caller) {
            ws.send(JSON.stringify({ type: 'call_request', target_user_id: targetUserId, call_type: callType }));
          }
        };

        ws.onmessage = async (event) => {
          var data = JSON.parse(event.data);
          if (data.type === 'call_sent') {
            setStatusSafe('ringing');
          } else if (data.type === 'call_offer') {
            if (!peerConnectionRef.current && mountedRef.current) {
              var pc = await createPC(stream, data.sender_id);
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              var answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ws.send(JSON.stringify({ type: 'call_answer', target_user_id: data.sender_id, answer: { sdp: answer.sdp, type: answer.type } }));
              setStatusSafe('connected');
            }
          } else if (data.type === 'call_answer') {
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
              setStatusSafe('connected');
            }
          } else if (data.type === 'ice_candidate') {
            if (peerConnectionRef.current && data.candidate) {
              try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch(e) {}
            }
          } else if (data.type === 'call_reject') {
            setStatusSafe('rejected');
            setTimeout(() => { if (!endedRef.current) endCall(); }, 2000);
          } else if (data.type === 'call_end') {
            if (!endedRef.current) endCall();
          }
        };

        ws.onerror = () => {
          if (mountedRef.current) { setErrorMsg('Erro de conexao'); setStatusSafe('error'); }
        };

        ws.onclose = () => {
          if (!endedRef.current && mountedRef.current && statusRef.current !== 'connected') endCall();
        };

        if (caller) {
          setTimeout(async () => {
            if (!mountedRef.current || endedRef.current || !ws || ws.readyState !== WebSocket.OPEN) return;
            var pc = await createPC(stream, targetUserId);
            var offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify({ type: 'call_offer', target_user_id: targetUserId, offer: { sdp: offer.sdp, type: offer.type }, call_type: callType }));
          }, 2000);
        }
      } catch (err) {
        if (mountedRef.current) {
          if (err.name === 'NotAllowedError') setErrorMsg('Permissao de microfone/camera negada');
          else if (err.name === 'NotFoundError') setErrorMsg('Microfone/camera nao encontrado');
          else setErrorMsg(err.message || 'Erro ao iniciar chamada');
          setStatusSafe('error');
          setTimeout(() => { if (!endedRef.current) endCall(); }, 4000);
        }
      }
    };

    init();
    return () => { mountedRef.current = false; cleanup(); };
  }, []);

  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => setCallSeconds(p => p + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const toggleMic = () => {
    if (streamRef.current) streamRef.current.getAudioTracks().forEach(t => t.enabled = !micOn);
    setMicOn(!micOn);
  };

  const toggleVideo = () => {
    if (streamRef.current) streamRef.current.getVideoTracks().forEach(t => t.enabled = !videoOn);
    setVideoOn(!videoOn);
  };

  const toggleMinimize = () => {
    setMinimized(!minimized);
    setShowCallBanner(!showCallBanner);
  };

  const getAvatarGradient = (name) => AVATAR_GRADIENTS[((name || '').charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
  const getInitial = (name) => (name || '?')[0].toUpperCase();

  return (
    <>
      <style>{`
        @keyframes wave { 0%,100%{height:4px} 50%{height:18px} }
        @keyframes slideUp { from{transform:translateX(-50%) translateY(20px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .btn-ctrl { transition:all 0.2s ease; }
        .btn-ctrl:hover { transform:scale(1.08); }
        .btn-ctrl:active { transform:scale(0.95); }
      `}</style>

      {/* Call Banner */}
      {showCallBanner && !minimized && (
        <div style={{ padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'linear-gradient(90deg, rgba(35,165,90,0.12) 0%, rgba(35,165,90,0.04) 50%, transparent 100%)', display:'flex', alignItems:'center', justifyContent:'center', gap:32, backdropFilter:'blur(10px)', animation:'fadeUp 0.3s ease' }}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg, #f97316, #ef4444)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:26, fontWeight:700, boxShadow:'0 4px 16px rgba(249,115,22,0.3)', position:'relative' }}>
              {!micOn && <div style={{ position:'absolute', bottom:-2, right:-2, width:22, height:22, borderRadius:'50%', background:'#ed4245', border:'2.5px solid rgba(18,18,26,0.95)', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/></svg></div>}
            </div>
            <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:24, padding:'0 8px' }}>
              {[0,0.15,0.3,0.1,0.25,0.05,0.2].map((d,i) => <div key={i} style={{ width:3, background:'#23a55a', borderRadius:2, animation:`wave 1s ease-in-out ${d}s infinite`, height:4 }} />)}
            </div>
            <div style={{ width:64, height:64, borderRadius:'50%', background:getAvatarGradient(targetUser), display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:26, fontWeight:700, boxShadow:'0 0 0 2px rgba(18,18,26,0.95), 0 0 0 4px #23a55a, 0 4px 16px rgba(168,85,247,0.3)' }}>
              {getInitial(targetUser)}
            </div>
          </div>
          <div style={{ textAlign:'center', minWidth:140 }}>
            <div style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:4 }}>{targetUser}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:6 }}>
              {status === 'calling' ? 'A ligar...' : status === 'ringing' ? 'A tocar...' : status === 'rejected' ? 'Chamada recusada' : status === 'error' ? errorMsg : 'Chamada em andamento'}
            </div>
            {status === 'connected' && <div style={{ fontSize:16, color:'#23a55a', fontFamily:'monospace', fontWeight:700, letterSpacing:1 }}>{formatTime(callSeconds)}</div>}
          </div>
        </div>
      )}

      {/* Video streams */}
      {callType === 'video' && !minimized && (
        <div style={{ position:'relative', flex:1, background:'#000', overflow:'hidden' }}>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          <video ref={localVideoRef} autoPlay playsInline muted style={{ position:'absolute', bottom:100, right:20, width:160, height:120, objectFit:'cover', borderRadius:12, border:'2px solid rgba(255,255,255,0.2)', boxShadow:'0 4px 16px rgba(0,0,0,0.5)', zIndex:10 }} />
          <div style={{ position:'absolute', bottom:100, left:20, padding:'8px 14px', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(10px)', borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:getAvatarGradient(targetUser), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>{getInitial(targetUser)}</div>
            <span style={{ color:'#fff', fontSize:13, fontWeight:600 }}>{targetUser}</span>
          </div>
        </div>
      )}

      {/* Voice call avatar */}
      {callType === 'voice' && !minimized && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#000', zIndex:10 }}>
          <div style={{ width:120, height:120, borderRadius:'50%', background:getAvatarGradient(targetUser), display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, boxShadow:`0 4px 24px rgba(168,85,247,0.4)`, animation:'pulse 2s infinite' }}>
            <span style={{ fontSize:42, color:'#fff', fontWeight:700 }}>{getInitial(targetUser)}</span>
          </div>
          <div style={{ color:'#fff', fontSize:20, fontWeight:700, marginBottom:8 }}>{targetUser}</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:12 }}>
            {status === 'calling' ? 'A ligar...' : status === 'ringing' ? 'A tocar...' : status === 'rejected' ? 'Chamada recusada' : status === 'error' ? errorMsg : formatTime(callSeconds)}
          </div>
        </div>
      )}

      {/* Error overlay */}
      {status === 'error' && errorMsg && (
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, padding:'16px 24px', zIndex:15, textAlign:'center', maxWidth:300 }}>
          <div style={{ color:'#f87171', fontSize:14, fontWeight:500 }}>{errorMsg}</div>
        </div>
      )}

      {/* Call Control Bar */}
      {!minimized && status !== 'error' && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:5000, background:'rgba(20,20,30,0.88)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderRadius:28, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 8px 32px rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.1)', animation:'slideUp 0.3s ease' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(35,165,90,0.15)', border:'1px solid rgba(35,165,90,0.3)', borderRadius:24, padding:'6px 14px' }}>
            <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:14 }}>
              {[0,0.15,0.3].map((d,i) => <div key={i} style={{ width:2.5, background:'#23a55a', borderRadius:1, animation:`wave 1s ease-in-out ${d}s infinite`, height:4 }} />)}
            </div>
            <span style={{ color:'#23a55a', fontSize:13, fontWeight:700 }}>@{targetUser}</span>
          </div>

          {callType === 'video' && (
            <button className="btn-ctrl" onClick={toggleVideo} style={{ width:44, height:44, borderRadius:'50%', background: videoOn ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)', border:'none', color: videoOn ? '#fff' : 'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }} title={videoOn ? 'Desligar camera' : 'Ligar camera'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </button>
          )}

          <button className="btn-ctrl" onClick={toggleMic} style={{ width:52, height:52, borderRadius:'50%', background: micOn ? 'rgba(255,255,255,0.1)' : 'rgba(237,66,69,0.25)', border: micOn ? 'none' : '1px solid rgba(237,66,69,0.3)', color: micOn ? '#fff' : '#ed4245', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }} title={micOn ? 'Silenciar' : 'Ativar microfone'}>
            {micOn ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
          </button>

          <button className="btn-ctrl" onClick={endCall} style={{ width:52, height:52, borderRadius:'50%', background:'#ed4245', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 4px 16px rgba(237,66,69,0.4)' }} title="Encerrar chamada">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
          </button>

          <button className="btn-ctrl" onClick={toggleMinimize} style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:'none', color:'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', marginLeft:4 }} title="Minimizar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
        </div>
      )}

      {/* Minimized indicator */}
      {minimized && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:5000, background:'rgba(20,20,30,0.9)', backdropFilter:'blur(20px)', borderRadius:16, padding:'10px 16px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 8px 32px rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', animation:'slideUp 0.3s ease' }} onClick={() => { setMinimized(false); setShowCallBanner(true); }}>
          <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:16 }}>
            {[0,0.15,0.3,0.1].map((d,i) => <div key={i} style={{ width:3, background:'#23a55a', borderRadius:2, animation:`wave 1s ease-in-out ${d}s infinite`, height:4 }} />)}
          </div>
          <div style={{ width:32, height:32, borderRadius:'50%', background:getAvatarGradient(targetUser), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' }}>{getInitial(targetUser)}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{targetUser}</div>
            <div style={{ fontSize:10, color:'#23a55a' }}>{callType === 'video' ? 'Video' : 'Voz'} • {formatTime(callSeconds)}</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); endCall(); }} style={{ width:32, height:32, borderRadius:'50%', background:'#ed4245', border:'none', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', marginLeft:8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
    </>
  );
}

export default WebRTCCall;
