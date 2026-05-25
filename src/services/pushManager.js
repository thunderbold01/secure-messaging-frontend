/**
 * Push Notification Manager
 * Gerencia notificações push do navegador
 */

class PushNotificationManager {
    constructor() {
        this.swRegistration = null;
        this.vapidPublicKey = 'BEl62iUYgUivxIkv69yViUyTaJTtxJlEhWtxNqKkN6Lx9zV5s0YsPpDMvGqJh0YBKlSMxNVqRk8uE8sGzPxIiMA';
        this.isSubscribed = false;
    }
    
    async init() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('⚠️ Push não suportado');
            return false;
        }
        
        try {
            // Registrar Service Worker
            this.swRegistration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ SW Registrado');
            
            // Verificar subscription existente
            const subscription = await this.swRegistration.pushManager.getSubscription();
            this.isSubscribed = !!subscription;
            
            if (this.isSubscribed) {
                console.log('📱 Já inscrito em push');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erro SW:', error);
            return false;
        }
    }
    
    async requestPermission() {
        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                const subscription = await this.subscribeUser();
                return { success: true, subscription };
            }
            
            return { success: false, reason: 'denied' };
        } catch (error) {
            return { success: false, reason: 'error' };
        }
    }
    
    async subscribeUser() {
        try {
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });
            
            // Salvar no backend
            await this.sendSubscriptionToServer(subscription);
            
            this.isSubscribed = true;
            console.log('✅ Inscrito em push notifications');
            return subscription;
        } catch (error) {
            console.error('❌ Erro subscription:', error);
            return null;
        }
    }
    
    async sendSubscriptionToServer(subscription) {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const apiUrl = window.location.hostname === 'localhost'
                ? 'http://127.0.0.1:8000/api'
                : 'https://secure-messaging-api.onrender.com/api';
            
            await fetch(`${apiUrl}/push/save-subscription/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(subscription)
            });
            
            console.log('✅ Subscription salva no servidor');
        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
        }
    }
    
    async unsubscribe() {
        if (!this.swRegistration) return;
        
        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                
                const token = localStorage.getItem('token');
                if (token) {
                    const apiUrl = window.location.hostname === 'localhost'
                        ? 'http://127.0.0.1:8000/api'
                        : 'https://secure-messaging-api.onrender.com/api';
                    
                    await fetch(`${apiUrl}/push/remove-subscription/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${token}`
                        },
                        body: JSON.stringify({ endpoint: subscription.endpoint })
                    });
                }
            }
            
            this.isSubscribed = false;
            console.log('🔕 Desinscrito de push');
        } catch (error) {
            console.error('❌ Erro ao desinscrever:', error);
        }
    }
    
    async checkSubscription() {
        if (!this.swRegistration) return false;
        const subscription = await this.swRegistration.pushManager.getSubscription();
        this.isSubscribed = !!subscription;
        return this.isSubscribed;
    }
    
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

const pushManager = new PushNotificationManager();
export default pushManager;