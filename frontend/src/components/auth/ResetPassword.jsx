import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import './ResetPassword.css';

const ResetPassword = ({ onBackToLogin }) => {
    const { resetPassword, loading } = useAuth();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('Token de redefinição não encontrado ou link inválido.');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres.');
            return;
        }

        try {
            await resetPassword(token, password);
            setSubmitted(true);
            // Limpar token da URL sem recarregar a página
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
            setError(err.message);
        }
    };

    if (submitted) {
        return (
            <div className="auth-container animate-in">
                <div className="auth-card success-card">
                    <CheckCircle className="success-icon" size={48} />
                    <h2>Senha Redefinida!</h2>
                    <p>Sua senha foi atualizada com sucesso. Você já pode acessar sua conta.</p>
                    <button onClick={onBackToLogin} className="hs-button-primary full-width">
                        Ir para o Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container animate-in">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="icon-circle">
                        <Lock size={24} />
                    </div>
                    <h2>Nova Senha</h2>
                    <p>Escolha uma senha forte para proteger seu acesso ao CRM.</p>
                </div>

                {!token && error ? (
                    <div className="error-card">
                        <AlertTriangle className="error-icon" size={32} />
                        <p>{error}</p>
                        <button onClick={onBackToLogin} className="hs-button-secondary full-width">
                            Voltar para o Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nova Senha</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    placeholder="Mínimo 8 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                                <button 
                                    type="button" 
                                    className="toggle-password" 
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Confirmar Senha</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={18} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    placeholder="Repita a nova senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" className="hs-button-primary full-width" disabled={loading || !token}>
                            {loading ? 'Redefinindo...' : 'Atualizar Senha'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
