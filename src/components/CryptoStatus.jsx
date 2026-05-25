import React, { useState, useEffect } from 'react';
import { cryptoService } from '../services/api';

function CryptoStatus() {
    const [cryptoStatus, setCryptoStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        testCrypto();
    }, []);

    const testCrypto = async () => {
        try {
            const response = await cryptoService.testCrypto();
            setCryptoStatus(response.data);
        } catch (err) {
            console.error('Erro ao testar criptografia:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="crypto-status loading">
                <span>🔐 Verificando criptografia...</span>
            </div>
        );
    }

    return (
        <div className="crypto-status">
            <div className="crypto-header">
                <span className="crypto-icon">🔐</span>
                <span>Criptografia</span>
            </div>
            
            <div className="crypto-badges">
                <span className={`crypto-badge ${cryptoStatus?.crypto_disponivel ? 'active' : 'inactive'}`}>
                    RSA-1024
                </span>
                <span className="crypto-badge active">AES-256</span>
                <span className="crypto-badge active">SHA-256</span>
            </div>
            
            {cryptoStatus?.testes_passaram !== undefined && (
                <div className="crypto-tests">
                    <p>Testes: {cryptoStatus.testes_passaram}/{cryptoStatus.total_testes} passaram</p>
                </div>
            )}
            
            <div className="crypto-footer">
                <span className="secure-indicator">🛡️ Ponta-a-Ponta</span>
            </div>
        </div>
    );
}

export default CryptoStatus;