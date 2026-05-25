import axios from 'axios';

/**
 * ============================================================
 * API BASE URL - CONFIGURAÇÃO INTELIGENTE PARA TODOS OS CASOS
 * ============================================================
 */

// Lista de possíveis URLs de backend em ordem de preferência
const BACKEND_URLS = {
    // URLs de produção (Render)
    production: [
        'https://secure-messaging-api-1.onrender.com/api',  // Novo backend
        'https://secure-messaging-api.onrender.com/api',     // Backend antigo (fallback)
    ],
    // URLs de desenvolvimento local
    development: [
        'http://127.0.0.1:8000/api',
        'http://localhost:8000/api',
    ]
};

// Detecta ambiente
const isProduction = window.location.hostname !== 'localhost' 
                    && window.location.hostname !== '127.0.0.1'
                    && !window.location.hostname.includes('192.168.')
                    && !window.location.hostname.includes('10.0.');

// Função para testar se uma URL está acessível
async function testUrl(url, timeout = 3000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(`${url}/health/`, {
            method: 'HEAD',
            signal: controller.signal,
            mode: 'cors'
        });
        clearTimeout(timeoutId);
        return response.ok || response.status === 404; // 404 é aceitável (rota pode não existir)
    } catch (error) {
        clearTimeout(timeoutId);
        return false;
    }
}

// Seleciona a melhor URL disponível (síncrono para primeiro carregamento)
let API_URL = '';

if (isProduction) {
    // Em produção, tenta a primeira URL da lista (mais recente)
    // Como não podemos fazer async no carregamento do módulo, usamos a primeira
    // As URLs alternativas serão tentadas em runtime se a primeira falhar
    API_URL = BACKEND_URLS.production[0];
    console.log(`🌐 Modo PRODUÇÃO detectado`);
    console.log(`📍 URL principal: ${API_URL}`);
    console.log(`📌 Fallback: ${BACKEND_URLS.production[1]}`);
} else {
    API_URL = BACKEND_URLS.development[0];
    console.log(`💻 Modo DESENVOLVIMENTO LOCAL detectado`);
    console.log(`📍 URL: ${API_URL}`);
}

// Função para obter a URL atual (pode ser alterada em runtime)
let currentApiUrl = API_URL;
let urlFailed = false;

export function getCurrentApiUrl() {
    return currentApiUrl;
}

export function switchToFallbackUrl() {
    if (!urlFailed && isProduction && BACKEND_URLS.production[1]) {
        console.warn(`⚠️ Trocando para URL fallback: ${BACKEND_URLS.production[1]}`);
        currentApiUrl = BACKEND_URLS.production[1];
        urlFailed = true;
        // Atualiza a instância do axios
        api.defaults.baseURL = currentApiUrl;
        return true;
    }
    return false;
}

console.log(`🔗 API URL configurada: ${currentApiUrl}`);

/**
 * ============================================================
 * INSTÂNCIA PRINCIPAL DO AXIOS
 * ============================================================
 */
const api = axios.create({
    baseURL: currentApiUrl,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000, // 30 segundos de timeout global
});

/**
 * ============================================================
 * REQUEST INTERCEPTOR
 * ============================================================
 */
api.interceptors.request.use(
    (config) => {
        // Adiciona token se disponível
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        
        // Log para debug (apenas em desenvolvimento ou com parâmetro)
        const isDebug = localStorage.getItem('debug_api') === 'true' || !isProduction;
        if (isDebug) {
            console.log(`📤 [${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`);
            if (config.data) {
                console.log(`   Body:`, typeof config.data === 'object' ? JSON.stringify(config.data).substring(0, 200) : config.data);
            }
        }
        
        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

/**
 * ============================================================
 * RESPONSE INTERCEPTOR
 * ============================================================
 */
api.interceptors.response.use(
    (response) => {
        const isDebug = localStorage.getItem('debug_api') === 'true' || !isProduction;
        if (isDebug) {
            console.log(`📥 [${response.status}] ${response.config.url}`);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Log do erro
        console.error(`❌ Erro na requisição:`, {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
        });
        
        // Tratamento de erro 401 (não autorizado)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redireciona para login se não estiver já lá
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                window.location.href = '/';
            }
            return Promise.reject(error);
        }
        
        // Tratamento de erro de conexão (tenta fallback)
        if ((error.code === 'ERR_NETWORK' || error.message === 'Network Error') && !originalRequest._fallbackAttempted) {
            originalRequest._fallbackAttempted = true;
            
            if (switchToFallbackUrl()) {
                console.log('🔄 Tentando novamente com URL fallback...');
                originalRequest.baseURL = currentApiUrl;
                return api(originalRequest);
            }
        }
        
        // Tratamento de timeout
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
            console.error('⏰ Timeout na requisição');
            return Promise.reject({
                ...error,
                userMessage: 'O servidor demorou muito para responder. Tente novamente.'
            });
        }
        
        // Tratamento de erro de CORS
        if (error.message?.includes('CORS')) {
            console.error('🔒 Erro de CORS - Verifique as configurações do backend');
        }
        
        return Promise.reject(error);
    }
);

/**
 * ============================================================
 * FUNÇÃO PARA TESTAR CONEXÃO COM BACKEND
 * ============================================================
 */
export async function testBackendConnection() {
    const urlsToTest = isProduction ? BACKEND_URLS.production : BACKEND_URLS.development;
    
    console.log(`🔍 Testando conexão com backend...`);
    
    for (const url of urlsToTest) {
        try {
            const healthUrl = `${url}/health/`;
            console.log(`   Testando: ${healthUrl}`);
            
            const response = await fetch(healthUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                mode: 'cors'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Backend conectado: ${url}`, data);
                
                if (currentApiUrl !== url) {
                    currentApiUrl = url;
                    api.defaults.baseURL = currentApiUrl;
                    console.log(`📍 URL atualizada para: ${currentApiUrl}`);
                }
                return { success: true, url, data };
            }
        } catch (error) {
            console.log(`   ❌ Falha: ${url} - ${error.message}`);
        }
    }
    
    console.error(`❌ Nenhum backend disponível`);
    return { success: false, urls: urlsToTest };
}

/**
 * ============================================================
 * SERVICES
 * ============================================================
 */

export const authService = {
    register: (userData) => api.post('/registro/', userData),
    login: (credentials) => api.post('/login/', credentials),
    logout: () => api.post('/logout/'),
    getProfile: () => api.get('/perfil/'),
};

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
    markAsRead: (conversationId) => api.post(`/conversas/${conversationId}/marcar-lidas/`),
};

export const cryptoService = {
    testCrypto: () => api.get('/crypto/demo/'),
    gerarChavesRSA: () => api.post('/crypto/gerar-chaves/'),
    obterChavePublica: (usuarioId) => api.get(`/crypto/chave-publica/${usuarioId}/`),
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
    forcarLogout: (userId) => api.post(`/admin/forcar-logout/${userId}/`),
    getCertificados: () => api.get('/admin/certificados/'),
};

export const notificationService = {
    saveSubscription: (subscription) => api.post('/push/save-subscription/', subscription),
    removeSubscription: (endpoint) => api.post('/push/remove-subscription/', { endpoint }),
    getNotifications: () => api.get('/push/notifications/'),
    markAsRead: (notificationId) => api.post(`/push/notifications/${notificationId}/read/`),
};

export const aiService = {
    chat: (message) => api.post('/ai/chat/', { mensagem: message }),
    getStatus: () => api.get('/ai/status/'),
    clearHistory: () => api.post('/ai/clear/'),
};

// Utilitário para ativar/desativar logs de debug
export function setApiDebug(enabled) {
    if (enabled) {
        localStorage.setItem('debug_api', 'true');
        console.log('🐛 Modo debug da API ativado');
    } else {
        localStorage.removeItem('debug_api');
        console.log('🔇 Modo debug da API desativado');
    }
}

// Exporta também a instância raw para casos especiais
export default api;

// Inicialização: testa conexão em segundo plano
if (isProduction) {
    // Atraso para não bloquear o carregamento inicial
    setTimeout(() => {
        testBackendConnection().then(result => {
            if (!result.success) {
                console.warn('⚠️ Nenhum backend disponível. Verifique sua conexão ou o status do servidor.');
            }
        });
    }, 2000);
}