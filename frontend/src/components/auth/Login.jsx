import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

const Login = ({ onSwitchToRegister, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickAccess = async () => {
    setError('');
    try {
      await login('mbbernabe@gmail.com', 'mbb1223');
    } catch (err) {
      setError('Erro no Acesso Rápido: ' + err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <LogIn size={24} />
          </div>
          <h1>Bem-vindo de volta</h1>
          <p>Acesse sua conta para gerenciar seu CRM</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>E-mail <span className="required-indicator">*</span></label>
            <input 
              type="email" 
              className="hs-input" 
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="label-row">
                <label>Senha <span className="required-indicator">*</span></label>
                <button type="button" onClick={onForgotPassword} className="hs-link-small">Esqueci minha senha</button>
            </div>
            <input 
              type="password" 
              className="hs-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="hs-button-primary auth-submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="dev-separator">
            <span>OU</span>
          </div>

          <button 
            type="button" 
            className="hs-button-secondary dev-button" 
            onClick={handleQuickAccess}
            disabled={loading}
          >
            Acesso Rápido (SuperAdmin)
          </button>
        </form>

        <div className="auth-footer">
          <p>Não tem uma conta? <button onClick={onSwitchToRegister} className="hs-link">Cadastre-se</button></p>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f8fa;
          z-index: 9999;
          padding: 20px;
        }

        .auth-card {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(45, 62, 80, 0.12);
          width: 100%;
          max-width: 440px;
          text-align: center;
        }

        .auth-icon-circle {
          width: 60px;
          height: 60px;
          background: #eaf0f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: #0091ae;
        }

        .auth-header h1 {
          font-size: 24px;
          color: #2d3e50;
          margin: 0 0 8px;
        }

        .auth-header p {
          color: #516f90;
          margin-bottom: 32px;
        }

        .auth-form {
          text-align: left;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #2d3e50;
          margin-bottom: 8px;
        }

        .auth-submit {
          width: 100%;
          margin-top: 12px;
          height: 48px;
          font-size: 16px;
        }

        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fffafa;
          border: 1px solid #ff4b4b;
          color: #ff4b4b;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 24px;
          font-size: 14px;
        }

        .auth-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #eaf0f6;
          font-size: 14px;
          color: #516f90;
        }

        .hs-link {
          background: none;
          border: none;
          color: #0091ae;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-left: 4px;
          text-decoration: underline;
        }

        .hs-link:hover {
          color: #006b80;
        }

        .label-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .label-row label {
            margin-bottom: 0 !important;
        }

        .hs-link-small {
            background: none;
            border: none;
            color: #0091ae;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            padding: 0;
            text-decoration: none;
        }

        .hs-link-small:hover {
            text-decoration: underline;
        }

        .dev-separator {
            display: flex;
            align-items: center;
            text-align: center;
            margin: 20px 0;
            color: #cbd5e0;
            font-size: 12px;
            font-weight: 600;
        }

        .dev-separator::before, .dev-separator::after {
            content: "";
            flex: 1;
            border-bottom: 1px solid #e2e8f0;
        }

        .dev-separator span {
            padding: 0 10px;
        }

        .dev-button {
            width: 100%;
            height: 44px;
            border: 1px dashed #0091ae;
            color: #0091ae;
            background: #f0f9ff;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .dev-button:hover {
            background: #e0f2fe;
            border-style: solid;
        }
      `}</style>
    </div>
  );
};

export default Login;
