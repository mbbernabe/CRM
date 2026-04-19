import React, { useState } from 'react';
import { API_BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';
import './Login.css';

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

    // Credenciais do dev (usado após reset ou fluxo normal)
    const devCredentials = [
      { email: 'admin@crm.com', password: 'admin' },
      { email: 'mbbernabe@gmail.com', password: 'admin1234' },
    ];

    // Tentar logar com cada conjunto de credenciais existentes
    for (const creds of devCredentials) {
      try {
        await login(creds.email, creds.password);
        return; // Sucesso — sair do loop
      } catch (err) {
        // Continuar tentando com as próximas credenciais
        if (!err.message.includes("incorretos") && !err.message.includes("401")) {
          setError('Erro no Acesso Rápido: ' + err.message);
          return;
        }
      }
    }

    // Nenhuma credencial funcionou — banco vazio, criar o primeiro superadmin
    try {
      const registerRes = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Marcelo Bernabe (Dev)',
          email: 'mbbernabe@gmail.com',
          password: 'admin1234',
          workspace_name: 'Minha Empresa Dev'
        })
      });

      if (registerRes.ok) {
        await login('mbbernabe@gmail.com', 'admin1234');
      } else {
        const data = await registerRes.json();
        setError('Falha ao criar superadmin: ' + (data.detail || 'Erro desconhecido'));
      }
    } catch (regErr) {
      setError('Não foi possível inicializar o sistema. Cadastre-se manualmente.');
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

    </div>
  );
};

export default Login;
