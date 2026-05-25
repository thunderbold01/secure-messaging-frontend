import React, { useState } from 'react';
import { userService } from '../services/api';
import { Badge } from 'react-bootstrap';

function SearchUser({ onFriendRequestSent }) {
    const [searchPhone, setSearchPhone] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSearch = async () => {
        if (!searchPhone.trim()) {
            setError('Digite um número de telefone');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setSearchResult(null);

        try {
            console.log('Buscando telefone:', searchPhone);
            const response = await userService.searchByPhone(searchPhone);
            console.log('Resultado da busca:', response.data);
            setSearchResult(response.data);
            
            if (!response.data.encontrado) {
                setError(`Nenhum usuário encontrado com o número ${searchPhone}`);
            }
        } catch (err) {
            console.error('Erro na busca:', err);
            if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else {
                setError('Erro ao buscar usuário. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async () => {
        if (!searchResult?.usuario) return;

        setLoading(true);
        setError('');
        try {
            console.log('Enviando solicitação para:', searchResult.usuario.telefone);
            await userService.sendFriendRequest(searchResult.usuario.telefone);
            setSuccess(`Solicitação enviada para ${searchResult.usuario.username}!`);
            setSearchResult(null);
            setSearchPhone('');
            onFriendRequestSent?.();
        } catch (err) {
            console.error('Erro ao enviar:', err);
            if (err.response?.status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else {
                setError(err.response?.data?.erro || 'Erro ao enviar solicitação');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="search-container">
            <h2>🔍 Buscar Usuário</h2>
            <p className="text-muted">Encontre amigos pelo número de telefone</p>
            
            <div className="search-box">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 11110000"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                    {loading ? '...' : 'Buscar'}
                </button>
            </div>
            
            <div className="mt-2">
                <small className="text-muted">
                    💡 Números cadastrados: 11110000 (Alice), 22220000 (Bob), 33330000 (Charlie)
                </small>
            </div>
            
            {error && <div className="alert alert-warning mt-3">{error}</div>}
            {success && <div className="alert alert-success mt-3">{success}</div>}
            
            {searchResult?.encontrado && (
                <div className="search-result-card mt-3">
                    <div className="result-avatar">
                        {searchResult.usuario.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="result-info">
                        <h4>{searchResult.usuario.username}</h4>
                        <p>📱 {searchResult.usuario.telefone}</p>
                        <p>
                            <span className={`status-dot ${searchResult.usuario.online ? 'online' : 'offline'}`}></span>
                            {searchResult.usuario.online ? 'Online' : 'Offline'}
                        </p>
                        
                        {searchResult.is_amigo ? (
                            <Badge bg="success">✅ Vocês já são amigos</Badge>
                        ) : searchResult.solicitacao_enviada ? (
                            <Badge bg="warning">⏳ Solicitação já enviada</Badge>
                        ) : (
                            <button className="btn btn-success" onClick={handleSendRequest} disabled={loading}>
                                ➕ Adicionar Amigo
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchUser;