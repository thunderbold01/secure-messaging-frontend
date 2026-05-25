import React, { useState } from 'react';
import { authService } from '../services/api';

function Login({ onLogin, onSwitchToRegister }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Tentando login com:', username);
            const response = await authService.login({ username, password });
            console.log('Login response:', response.data);
            
            // Salva token e usuário
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.usuario));
            
            onLogin(response.data.usuario, response.data.token);
        } catch (err) {
            console.error('Erro no login:', err);
            setError(err.response?.data?.erro || 'Usuário ou senha inválidos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>🔐 Mensageiro Seguro</h2>
                <p className="subtitle">Login com criptografia ponta-a-ponta</p>
                
                {error && <div className="alert alert-danger">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            className="form-control"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Senha</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
                
                <p className="switch-text">
                    Não tem conta?{' '}
                    <button className="btn-link" onClick={onSwitchToRegister}>
                        Registre-se
                    </button>
                </p>
                
                <div className="crypto-footer">
                    <span className="badge bg-success">🔒 RSA-1024</span>
                    <span className="badge bg-success">🔐 AES-256</span>
                </div>
            </div>
        </div>
    );
}

export default Login;