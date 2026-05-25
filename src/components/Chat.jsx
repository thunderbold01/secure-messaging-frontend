import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/api';
import { Form, Button, Badge } from 'react-bootstrap';

function Chat({ user, friend, onMessageSent }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (friend) {
            loadMessages();
            inputRef.current?.focus();
        }
    }, [friend]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        if (!friend?.conversa_id) {
            // Mensagens de exemplo se não houver conversa_id
            setMessages([
                {
                    id: 1,
                    remetente: friend.username,
                    conteudo: '👋 Olá! Como você está?',
                    enviada_em: new Date(Date.now() - 3600000).toISOString(),
                    enviada: false
                },
                {
                    id: 2,
                    remetente: user.username,
                    conteudo: 'Tudo bem! E você?',
                    enviada_em: new Date(Date.now() - 1800000).toISOString(),
                    enviada: true
                }
            ]);
            return;
        }
        
        setLoading(true);
        try {
            const response = await chatService.getMessages(friend.conversa_id);
            setMessages(response.data.mensagens || []);
        } catch (err) {
            console.error('Erro ao carregar mensagens:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        const content = newMessage.trim();
        setNewMessage('');
        setSending(true);

        // Adiciona mensagem localmente (otimista)
        const tempMessage = {
            id: Date.now(),
            remetente: user.username,
            conteudo: content,
            enviada_em: new Date().toISOString(),
            enviada: true,
            temp: true
        };
        setMessages(prev => [...prev, tempMessage]);

        try {
            if (friend?.conversa_id) {
                await chatService.sendMessage(friend.conversa_id, content);
            }
            // Atualiza mensagem como confirmada
            setMessages(prev => prev.map(msg => 
                msg.id === tempMessage.id ? { ...msg, temp: false } : msg
            ));
            onMessageSent?.();
        } catch (err) {
            console.error('Erro ao enviar:', err);
            // Marca mensagem como erro
            setMessages(prev => prev.map(msg => 
                msg.id === tempMessage.id ? { ...msg, error: true } : msg
            ));
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    // Se não tem amigo selecionado
    if (!friend) {
        return (
            <div className="chat-container empty-chat">
                <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <h3>Selecione um amigo</h3>
                    <p>Escolha um amigo na lista lateral para começar a conversar</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            {/* Cabeçalho do Chat */}
            <div className="chat-header">
                <div className="chat-friend-info">
                    <div className="friend-avatar-large">
                        {friend.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="friend-details">
                        <h3>{friend.username}</h3>
                        <p className="friend-phone">📱 {friend.telefone}</p>
                        <p className={`friend-status ${friend.online ? 'online' : 'offline'}`}>
                            <span className={`status-dot ${friend.online ? 'online' : 'offline'}`}></span>
                            {friend.online ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>
                
                {friend.canal_seguro && (
                    <Badge bg="success" className="secure-channel-badge">
                        🔐 Canal Seguro (RSA+AES)
                    </Badge>
                )}
            </div>
            
            {/* Área de Mensagens */}
            <div className="chat-messages">
                {loading ? (
                    <div className="loading-messages">
                        <div className="spinner-small"></div>
                        <p>Carregando mensagens...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-messages">
                        <div className="empty-icon">💭</div>
                        <p>Nenhuma mensagem ainda</p>
                        <p className="hint">Envie uma mensagem para começar a conversa!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isSent = msg.remetente === user.username;
                        return (
                            <div 
                                key={msg.id} 
                                className={`message ${isSent ? 'sent' : 'received'} ${msg.temp ? 'temp' : ''} ${msg.error ? 'error' : ''}`}
                            >
                                {!isSent && (
                                    <div className="message-avatar">
                                        {msg.remetente?.[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div className="message-content">
                                    <div className="message-bubble">
                                        {!isSent && (
                                            <div className="message-sender">{msg.remetente}</div>
                                        )}
                                        <div className="message-text">{msg.conteudo}</div>
                                        <div className="message-time">
                                            {formatTime(msg.enviada_em)}
                                            {isSent && (
                                                <span className="message-status">
                                                    {msg.temp ? '⏳' : msg.error ? '❌' : '✓✓'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            
            {/* Input de Mensagem */}
            <Form onSubmit={handleSendMessage} className="chat-input-form">
                <div className="chat-input-container">
                    <Form.Control
                        ref={inputRef}
                        type="text"
                        className="chat-input"
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sending}
                    />
                    <Button 
                        type="submit" 
                        className="send-btn"
                        disabled={!newMessage.trim() || sending}
                    >
                        {sending ? '📨' : '📤'}
                    </Button>
                </div>
            </Form>
        </div>
    );
}

export default Chat;