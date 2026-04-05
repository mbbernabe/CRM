import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';

const ForgotPassword = ({ onBackToLogin }) => {
    const { forgotPassword, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Tentativa de chamada direta para capturar o erro com detalhes se o context falhar
            const response = await fetch('http://localhost:8000/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Falha ao processar solicitação.');
            }
            
            setSubmitted(true);
        } catch (err) {
            console.error("Erro na recuperação:", err);
            setError(err.message);
        }
    };

    if (submitted) {
        return (
            <div className="auth-container animate-in">
                <div className="auth-card success-card">
                    <CheckCircle className="success-icon" size={48} />
                    <h2>E-mail Enviado!</h2>
                    <p>Se o endereço <strong>{email}</strong> estiver em nossa base, você receberá um link para redefinir sua senha em instantes.</p>
                    <button onClick={onBackToLogin} className="hs-button-primary full-width">
                        Voltar para o Login
                    </button>
                </div>
                <style jsx>{`
                    .auth-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f8fa; z-index: 9999; padding: 20px; }
                    .auth-card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(45, 62, 80, 0.12); max-width: 400px; width: 100%; text-align: center; }
                    .success-icon { color: #22c55e; margin-bottom: 20px; }
                    h2 { color: var(--hs-text-primary); margin-bottom: 12px; font-weight: 700; }
                    p { color: var(--hs-text-secondary); margin-bottom: 24px; font-size: 14px; line-height: 1.5; }
                    .full-width { width: 100%; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="auth-container animate-in">
            <div className="auth-card">
                <button onClick={onBackToLogin} className="back-button">
                    <ArrowLeft size={16} /> Voltar
                </button>
                <div className="auth-header">
                    <div className="icon-circle">
                        <Mail size={24} />
                    </div>
                    <h2>Esqueceu sua senha?</h2>
                    <p>Informe seu e-mail e enviaremos instruções para você criar uma nova senha.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>E-mail cadastrado</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={18} />
                            <input 
                                type="email" 
                                required 
                                placeholder="exemplo@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="hs-button-primary full-width" disabled={loading}>
                        {loading ? 'Processando...' : (
                            <>
                                <Send size={16} /> Enviar Link de Recuperação
                            </>
                        )}
                    </button>
                </form>
            </div>

            <style jsx>{`
                .auth-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f8fa; z-index: 9999; padding: 20px; }
                .auth-card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(45, 62, 80, 0.12); max-width: 440px; width: 100%; position: relative; }
                .back-button { position: absolute; top: 20px; left: 20px; background: none; border: none; color: var(--hs-text-secondary); display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; transition: color 0.2s; }
                .back-button:hover { color: var(--hs-blue); }
                .auth-header { text-align: center; margin-bottom: 32px; margin-top: 20px; }
                .icon-circle { width: 56px; height: 56px; background: #e0f2fe; color: var(--hs-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
                h2 { color: var(--hs-text-primary); font-size: 24px; font-weight: 700; margin-bottom: 8px; }
                p { color: var(--hs-text-secondary); font-size: 14px; line-height: 1.5; }
                .form-group { margin-bottom: 24px; }
                label { display: block; font-size: 13px; font-weight: 600; color: var(--hs-text-primary); margin-bottom: 8px; }
                .input-wrapper { position: relative; }
                .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--hs-text-secondary); }
                input { width: 100%; padding: 10px 12px 10px 40px; border: 1px solid var(--hs-border); border-radius: 4px; font-size: 14px; outline: none; transition: border-color 0.2s; }
                input:focus { border-color: var(--hs-blue); box-shadow: 0 0 0 2px rgba(0, 145, 174, 0.1); }
                .error-message { background: #fef2f2; color: #dc2626; padding: 12px; border-radius: 4px; font-size: 13px; margin-bottom: 20px; border: 1px solid #fee2e2; }
                .full-width { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; }
            `}</style>
        </div>
    );
};

export default ForgotPassword;
