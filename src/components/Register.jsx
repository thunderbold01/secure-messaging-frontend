import React, { useState } from 'react';
import { authService } from '../services/api';

function Register({ onRegister, onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        telefone: '',
        email: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...registerData } = formData;
            const payload = {
                username: registerData.username,
                password: registerData.password,
                telefone: registerData.telefone,
                numero_celular: registerData.telefone, // Compatibilidade
                email: registerData.email
            };
            
            console.log('Registrando:', payload);
            const response = await authService.register(payload);
            console.log('Register response:', response.data);
            
            // Salva token e usuário
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.usuario));
            
            onRegister(response.data.usuario, response.data.token);
        } catch (err) {
            console.error('Erro no registro:', err);
            setError(err.response?.data?.erro || 'Erro ao registrar usuário');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>📝 Registro</h2>
                <p className="subtitle">Crie sua conta segura</p>
                
                {error && <div className="alert alert-danger">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            className="form-control"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Número de Celular</label>
                        <input
                            type="tel"
                            name="telefone"
                            placeholder="11110000"
                            className="form-control"
                            value={formData.telefone}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Email (opcional)</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Senha</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Confirmar Senha</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-control"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrar'}
                    </button>
                </form>
                
                <p className="switch-text">
                    Já tem conta?{' '}
                    <button className="btn-link" onClick={onSwitchToLogin}>
                        Faça login
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Register;