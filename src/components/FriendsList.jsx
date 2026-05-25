import React from 'react';
import { Badge } from 'react-bootstrap';

function FriendsList({ friends, selectedFriend, onSelectFriend, onRefresh }) {
    if (friends.length === 0) {
        return (
            <div className="friends-list">
                <div className="friends-header">
                    <h3>👥 Amigos (0)</h3>
                    <button className="refresh-btn" onClick={onRefresh} title="Atualizar">
                        🔄
                    </button>
                </div>
                <div className="empty-friends">
                    <p className="text-muted">Nenhum amigo ainda</p>
                    <p className="hint">Use a aba "Buscar" para encontrar amigos</p>
                </div>
            </div>
        );
    }

    return (
        <div className="friends-list">
            <div className="friends-header">
                <h3>👥 Amigos ({friends.length})</h3>
                <button className="refresh-btn" onClick={onRefresh} title="Atualizar">
                    🔄
                </button>
            </div>
            
            <div className="friends-items">
                {friends.map((friend) => (
                    <div
                        key={friend.amizade_id || friend.id}
                        className={`friend-item ${selectedFriend?.id === friend.id ? 'active' : ''}`}
                        onClick={() => onSelectFriend(friend)}
                    >
                        <div className="friend-avatar">
                            {friend.username?.[0]?.toUpperCase()}
                        </div>
                        
                        <div className="friend-info">
                            <div className="friend-name">
                                {friend.username}
                                {friend.canal_seguro && (
                                    <span className="secure-icon" title="Canal Seguro">🔒</span>
                                )}
                            </div>
                            <div className={`friend-status ${friend.online ? 'online' : 'offline'}`}>
                                <span className={`status-dot ${friend.online ? 'online' : 'offline'}`}></span>
                                {friend.online ? 'Online' : 'Offline'}
                            </div>
                        </div>
                        
                        {friend.canal_seguro && (
                            <Badge bg="success" className="secure-badge">🔐</Badge>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="friends-tip">
                <small className="text-muted">
                    👆 Clique em um amigo para conversar
                </small>
            </div>
        </div>
    );
}

export default FriendsList;