import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Badge } from 'react-bootstrap';
import FriendsList from './FriendsList';
import SearchUser from './SearchUser';
import FriendRequests from './FriendRequests';
import Chat from './Chat';
import CryptoStatus from './CryptoStatus';
import { userService, authService } from '../services/api';

function Dashboard({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        loadFriends();
        loadPendingRequests();
        
        const interval = setInterval(() => {
            loadFriends();
        }, 10000);
        
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    const loadFriends = async () => {
        try {
            const response = await userService.getFriends();
            setFriends(response.data.amigos || []);
        } catch (err) {
            console.error('Erro ao carregar amigos:', err);
        }
    };

    const loadPendingRequests = async () => {
        try {
            const response = await userService.getFriendRequests();
            setPendingRequests(response.data.recebidas?.length || 0);
        } catch (err) {
            console.error('Erro ao carregar solicitações:', err);
        }
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleSelectFriend = (friend) => {
        setSelectedFriend(friend);
        setActiveTab('chat');
    };

    const handleLogoutClick = async () => {
        try {
            await authService.logout();
        } catch (err) {
            console.error('Erro ao fazer logout:', err);
        }
        onLogout();
    };

    return (
        <div className="dashboard">
            <nav className="navbar">
                <div className="navbar-brand">
                    <span>🔐</span>
                    <span>Mensageiro Seguro</span>
                </div>
                
                <div className="navbar-menu">
                    <button 
                        className={`nav-btn ${activeTab === 'friends' ? 'active' : ''}`}
                        onClick={() => setActiveTab('friends')}
                    >
                        💬 Conversas
                    </button>
                    <button 
                        className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
                        onClick={() => setActiveTab('search')}
                    >
                        🔍 Buscar
                    </button>
                    <button 
                        className={`nav-btn ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        👥 Solicitações
                        {pendingRequests > 0 && (
                            <Badge bg="danger" className="ms-2">{pendingRequests}</Badge>
                        )}
                    </button>
                </div>
                
                <div className="navbar-user">
                    <span>👤 {user?.username}</span>
                    <button className="logout-btn" onClick={handleLogoutClick}>
                        Sair
                    </button>
                </div>
            </nav>

            <Container fluid className="main-container">
                <Row className="g-0 h-100">
                    <Col md={3} className="sidebar">
                        <FriendsList 
                            friends={friends}
                            selectedFriend={selectedFriend}
                            onSelectFriend={handleSelectFriend}
                            onRefresh={handleRefresh}
                        />
                        <CryptoStatus />
                    </Col>
                    
                    <Col md={9} className="content-area">
                        {activeTab === 'friends' && !selectedFriend && (
                            <div className="empty-state">
                                <div className="empty-icon">💬</div>
                                <h3>Selecione um amigo</h3>
                                <p>Escolha um amigo na lista para começar a conversar</p>
                            </div>
                        )}
                        
                        {activeTab === 'friends' && selectedFriend && (
                            <Chat 
                                user={user}
                                friend={selectedFriend}
                                onMessageSent={handleRefresh}
                            />
                        )}
                        
                        {activeTab === 'search' && (
                            <SearchUser onFriendRequestSent={handleRefresh} />
                        )}
                        
                        {activeTab === 'requests' && (
                            <FriendRequests onRequestHandled={handleRefresh} />
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Dashboard;