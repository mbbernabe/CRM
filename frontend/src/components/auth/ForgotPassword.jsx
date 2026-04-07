import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import './ForgotPassword.css';

const ForgotPassword = ({ onBackToLogin }) => {
    const { forgotPassword, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
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
        </div>
    );
};

export default ForgotPassword;
