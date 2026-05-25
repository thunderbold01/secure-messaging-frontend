import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';

function FriendRequests({ onRequestHandled }) {
    const [requests, setRequests] = useState({ recebidas: [], enviadas: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await userService.getFriendRequests();
            console.log('Requests response:', response.data);
            setRequests(response.data);
        } catch (err) {
            console.error('Load requests error:', err);
            setError('Erro ao carregar solicitações');
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (requestId, action) => {
        setProcessingId(requestId);
        setError('');
        try {
            await userService.respondToRequest(requestId, action);
            await loadRequests();
            onRequestHandled?.();
        } catch (err) {
            console.error('Respond error:', err);
            setError(err.response?.data?.erro || 'Erro ao processar');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Carregando...</p>
            </div>
        );
    }

    return (
        <div className="requests-container">
            <h2>📨 Solicitações de Amizade</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="requests-section">
                <h3>
                    Recebidas 
                    {requests.recebidas?.length > 0 && (
                        <span className="count-badge">{requests.recebidas.length}</span>
                    )}
                </h3>
                
                {requests.recebidas?.length === 0 ? (
                    <p className="empty-message">Nenhuma solicitação recebida</p>
                ) : (
                    <div className="requests-list">
                        {requests.recebidas.map((req) => (
                            <div key={req.id} className="request-card">
                                <div className="request-avatar">
                                    {req.remetente?.[0]?.toUpperCase()}
                                </div>
                                <div className="request-info">
                                    <h4>{req.remetente}</h4>
                                    <p>📱 {req.telefone}</p>
                                    {req.mensagem && <p>💬 "{req.mensagem}"</p>}
                                </div>
                                <div className="request-actions">
                                    <button 
                                        className="accept-btn"
                                        onClick={() => handleRespond(req.id, 'ACEITAR')}
                                        disabled={processingId === req.id}
                                    >
                                        {processingId === req.id ? '...' : '✅ Aceitar'}
                                    </button>
                                    <button 
                                        className="reject-btn"
                                        onClick={() => handleRespond(req.id, 'RECUSAR')}
                                        disabled={processingId === req.id}
                                    >
                                        {processingId === req.id ? '...' : '❌ Recusar'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="requests-section">
                <h3>Enviadas</h3>
                {requests.enviadas?.length === 0 ? (
                    <p className="empty-message">Nenhuma solicitação enviada</p>
                ) : (
                    <div className="requests-list">
                        {requests.enviadas.map((req) => (
                            <div key={req.id} className="request-card sent">
                                <div className="request-avatar">
                                    {req.destinatario?.[0]?.toUpperCase()}
                                </div>
                                <div className="request-info">
                                    <h4>{req.destinatario}</h4>
                                    <p>📱 {req.telefone}</p>
                                </div>
                                <div className="request-status">
                                    <span className="pending-badge">⏳ Aguardando</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FriendRequests;