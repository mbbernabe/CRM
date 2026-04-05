import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

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
                <style jsx>{`
                    .auth-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; width: 100vw; position: fixed; top: 0; left: 0; background: #f5f8fa; z-index: 9999; }
                    .auth-card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(45, 62, 80, 0.12); max-width: 400px; width: 100%; text-align: center; }
                    .success-icon { color: #22c55e; margin-bottom: 20px; }
                    h2 { color: #2d3e50; margin-bottom: 12px; font-weight: 700; }
                    p { color: #516f90; margin-bottom: 24px; font-size: 14px; line-height: 1.5; }
                    .full-width { width: 100%; }
                `}</style>
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

            <style jsx>{`
                .auth-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--hs-bg-main); padding: 20px; }
                .auth-card { background: white; padding: 40px; border-radius: 8px; box-shadow: var(--hs-shadow-lg); max-width: 440px; width: 100%; }
                .auth-header { text-align: center; margin-bottom: 32px; }
                .icon-circle { width: 56px; height: 56px; background: #fef3c7; color: #d97706; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
                h2 { color: var(--hs-text-primary); font-size: 24px; font-weight: 700; margin-bottom: 8px; }
                p { color: var(--hs-text-secondary); font-size: 14px; line-height: 1.5; }
                .form-group { margin-bottom: 24px; }
                label { display: block; font-size: 13px; font-weight: 600; color: var(--hs-text-primary); margin-bottom: 8px; }
                .input-wrapper { position: relative; }
                .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--hs-text-secondary); }
                input { width: 100%; padding: 10px 40px 10px 40px; border: 1px solid var(--hs-border); border-radius: 4px; font-size: 14px; outline: none; transition: border-color 0.2s; }
                input:focus { border-color: var(--hs-blue); box-shadow: 0 0 0 2px rgba(0, 145, 174, 0.1); }
                .toggle-password { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--hs-text-secondary); cursor: pointer; padding: 4px; }
                .error-message { background: #fef2f2; color: #dc2626; padding: 12px; border-radius: 4px; font-size: 13px; margin-bottom: 20px; border: 1px solid #fee2e2; }
                .error-card { text-align: center; padding: 20px; }
                .error-icon { color: #dc2626; margin-bottom: 16px; }
                .full-width { width: 100%; display: flex; align-items: center; justify-content: center; }
            `}</style>
        </div>
    );
};

export default ResetPassword;
