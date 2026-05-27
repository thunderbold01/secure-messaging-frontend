import axios from 'axios';

/**
 * =========================
 * API BASE URL - AUTOMÁTICO
 * =========================
 */
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

const API_URL = isProduction 
    ? ''https://secure-messaging-api-1.onrender.com/api';
    : 'http://127.0.0.1:8000/api';

console.log(`🌐 API Mode: ${isProduction ? 'PRODUCTION' : 'LOCAL'}`);
console.log(`🔗 API URL: ${API_URL}`);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

/**
 * =========================
 * REQUEST INTERCEPTOR
 * =========================
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * =========================
 * RESPONSE INTERCEPTOR
 * =========================
 */
api.interceptors.response.use(
    (response) => {
        console.log(`📥 ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error(`❌ ${error.response?.status} ${error.config?.url}`, error.response?.data);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

/**
 * =========================
 * AUTH SERVICE
 * =========================
 */
export const authService = {
    register: (userData) => api.post('/registro/', userData),
    login: (credentials) => api.post('/login/', credentials),
    logout: () => api.post('/logout/'),
    getProfile: () => api.get('/perfil/'),
};

/**
 * =========================
 * USER SERVICE
 * =========================
 */
export const userService = {
    searchByPhone: (phone) => api.get(`/buscar/?telefone=${encodeURIComponent(phone)}`),
    getFriendRequests: () => api.get('/solicitacoes/'),
    sendFriendRequest: (phone, message) => api.post('/solicitacoes/enviar/', {
        telefone: phone,
        mensagem: message || 'Olá! Gostaria de adicionar você.'
    }),
    respondToRequest: (requestId, action) => api.post(`/solicitacoes/${requestId}/responder/`, {
        acao: action
    }),
    getFriends: () => api.get('/amigos/'),
};

/**
 * =========================
 * CHAT SERVICE
 * =========================
 */
export const chatService = {
    getConversations: () => api.get('/conversas/'),
    getMessages: (conversationId) => api.get(`/conversas/${conversationId}/mensagens/`),
    sendMessage: (conversationId, content) => api.post(`/conversas/${conversationId}/enviar/`, {
        conteudo: content,
        tipo: 'TEXTO'
    }),
    sendFile: (conversationId, arquivoBase64, tipo, nomeArquivo) => 
        api.post(`/conversas/${conversationId}/enviar-arquivo/`, {
            arquivo_base64: arquivoBase64,
            tipo: tipo,
            nome_arquivo: nomeArquivo
        }),
    downloadFile: (mensagemId) => api.get(`/mensagens/${mensagemId}/baixar-arquivo/`),
};

/**
 * =========================
 * CRYPTO SERVICE
 * =========================
 */
export const cryptoService = {
    testCrypto: () => api.get('/crypto/demo/'),
    gerarChavesRSA: () => api.post('/crypto/gerar-chaves/'),
    obterChavePublica: (usuarioId) => api.get(`/crypto/chave-publica/${usuarioId}/`),
    verificarChaves: () => api.get('/crypto/verificar-chaves/'),
    revogarChaves: () => api.post('/crypto/revogar-chaves/'),
    infoCriptografia: () => api.get('/info/criptografia/'),
};

/**
 * =========================
 * ADMIN SERVICE
 * =========================
 */
export const adminService = {
    getStats: () => api.get('/admin/stats/'),
    getUsuarios: () => api.get('/admin/usuarios/'),
    getMensagens: () => api.get('/admin/mensagens/'),
    getChaves: () => api.get('/admin/chaves/'),
    getLogs: () => api.get('/admin/logs/'),
    getEstatisticas: () => api.get('/admin/estatisticas/'),
    forcarLogout: (userId) => api.post(`/admin/forcar-logout/${userId}/`),
};

export default api;
