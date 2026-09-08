import axios from 'axios';
import { API_BASE } from '../config';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000,
    withCredentials: false,
});

function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>'"&]/g, function(c) {
        return {'<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;','&':'&amp;'}[c];
    });
}

function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

function isTokenValid(token) {
    if (!token || typeof token !== 'string') return false;
    if (token.length < 10 || token.length > 200) return false;
    if (!/^[a-f0-9]+$/.test(token)) return false;
    return true;
}

function isUserValid(user) {
    if (!user || typeof user !== 'object') return false;
    if (!user.username || typeof user.username !== 'string') return false;
    if (user.username.length < 3 || user.username.length > 30) return false;
    return true;
}

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && isTokenValid(token)) {
            config.headers.Authorization = `Token ${token}`;
        }

        if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
            config.data = sanitizeObject(config.data);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.code === 'ECONNABORTED' || !error.response) {
            window.dispatchEvent(new CustomEvent('api-offline', {
                detail: { message: 'Servidor offline. Tentando reconectar...' }
            }));
        }

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.replace('/login.html');
        }

        if (error.response?.status === 403) {
            console.warn('[API] Acesso negado');
        }

        if (error.response?.status === 429) {
            console.warn('[API] Rate limit excedido');
        }

        return Promise.reject(error);
    }
);

export const authService = {
    register: (userData) => api.post('/registro/', userData),
    login: (credentials) => api.post('/login/', credentials),
    logout: () => api.post('/logout/'),
    getProfile: () => api.get('/perfil/'),
};

export const userService = {
    searchByPhone: (phone) => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 9 || cleanPhone.length > 15) {
            return Promise.reject(new Error('Telefone invalido'));
        }
        return api.get('/buscar/', { params: { telefone: cleanPhone } });
    },
    getFriendRequests: () => api.get('/solicitacoes/'),
    sendFriendRequest: (phone, message) => {
        const cleanPhone = phone.replace(/\D/g, '');
        return api.post('/solicitacoes/enviar/', {
            telefone: cleanPhone,
            mensagem: sanitizeString(message || 'Ola! Gostaria de adicionar voce.')
        });
    },
    respondToRequest: (requestId, action) => {
        if (!requestId || !['ACEITAR', 'RECUSAR'].includes(action)) {
            return Promise.reject(new Error('Parametros invalidos'));
        }
        return api.post(`/solicitacoes/${requestId}/responder/`, { acao: action });
    },
    getFriends: () => api.get('/amigos/'),
};

export const chatService = {
    getConversations: () => api.get('/conversas/'),
    getMessages: (conversationId) => {
        if (!conversationId) return Promise.reject(new Error('ID da conversa invalido'));
        return api.get(`/conversas/${conversationId}/mensagens/`);
    },
    sendMessage: (conversationId, content) => {
        if (!conversationId) return Promise.reject(new Error('ID da conversa invalido'));
        if (!content || content.length > 5000) {
            return Promise.reject(new Error('Mensagem invalida'));
        }
        return api.post(`/conversas/${conversationId}/enviar/`, {
            conteudo: content,
            tipo: 'TEXTO'
        });
    },
    sendFile: (conversationId, arquivoBase64, tipo, nomeArquivo, mimeType) => {
        if (!conversationId) return Promise.reject(new Error('ID da conversa invalido'));
        if (!['IMAGEM', 'VIDEO', 'AUDIO', 'ARQUIVO'].includes(tipo)) {
            return Promise.reject(new Error('Tipo de arquivo invalido'));
        }
        const allowedMimes = {
            'IMAGEM': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            'VIDEO': ['video/mp4', 'video/webm', 'video/ogg'],
            'AUDIO': ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/wav'],
            'ARQUIVO': ['application/pdf', 'text/plain', 'application/zip',
                       'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        };
        if (mimeType && allowedMimes[tipo] && !allowedMimes[tipo].includes(mimeType)) {
            return Promise.reject(new Error('Tipo de MIME nao permitido'));
        }
        return api.post(`/conversas/${conversationId}/enviar-arquivo/`, {
            arquivo_base64: arquivoBase64,
            tipo: tipo,
            nome_arquivo: sanitizeString(nomeArquivo),
            mime_type: mimeType || 'application/octet-stream'
        });
    },
    downloadFile: (mensagemId) => {
        if (!mensagemId) return Promise.reject(new Error('ID da mensagem invalido'));
        return api.get(`/mensagens/${mensagemId}/baixar-arquivo/`);
    },
};

export const cryptoService = {
    testCrypto: () => api.get('/crypto/demo/'),
    gerarChavesRSA: () => api.post('/crypto/gerar-chaves/'),
    obterChavePublica: (usuarioId) => {
        if (!usuarioId || isNaN(usuarioId)) {
            return Promise.reject(new Error('ID do usuario invalido'));
        }
        return api.get(`/crypto/chave-publica/${parseInt(usuarioId)}/`);
    },
    verificarChaves: () => api.get('/crypto/verificar-chaves/'),
    revogarChaves: () => api.post('/crypto/revogar-chaves/'),
    infoCriptografia: () => api.get('/info/criptografia/'),
};

export const adminService = {
    getStats: () => api.get('/admin/stats/'),
    getUsuarios: () => api.get('/admin/usuarios/'),
    getMensagens: () => api.get('/admin/mensagens/'),
    getChaves: () => api.get('/admin/chaves/'),
    getLogs: () => api.get('/admin/logs/'),
    getEstatisticas: () => api.get('/admin/estatisticas/'),
    forcarLogout: (userId) => {
        if (!userId || isNaN(userId)) {
            return Promise.reject(new Error('ID do usuario invalido'));
        }
        return api.post(`/admin/forcar-logout/${parseInt(userId)}/`);
    },
};

export default api;
