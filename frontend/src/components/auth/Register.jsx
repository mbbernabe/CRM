import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    workspace_name: ''
  });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(formData);
    } catch (err) {
      console.error('Erro no registro:', err);
      // Garante que o erro seja uma string para exibição na UI
      setError(err.message || 'Erro de conexão com o servidor. Verifique se o backend está rodando.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <UserPlus size={24} />
          </div>
          <h1>Crie sua conta</h1>
          <p>Comece a gerenciar sua empresa de forma modular</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>Nome Completo <span className="required-indicator">*</span></label>
            <input 
              name="name"
              type="text" 
              className="hs-input" 
              placeholder="Seu nome"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>E-mail Corporativo <span className="required-indicator">*</span></label>
            <input 
              name="email"
              type="email" 
              className="hs-input" 
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Senha <span className="required-indicator">*</span></label>
            <input 
              name="password"
              type="password" 
              className="hs-input" 
              placeholder="Pelos menos 8 caracteres"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group team-section">
            <label>Nome da Empresa / Área de Trabalho <span className="required-indicator">*</span></label>
            <input 
              name="workspace_name"
              type="text" 
              className="hs-input" 
              placeholder="Ex: Minha Empresa, Consultoria ABC..."
              value={formData.workspace_name}
              onChange={handleChange}
              required
            />
            <p className="field-hint">Você será o administrador desta área de trabalho.</p>
          </div>

          <button type="submit" className="hs-button-primary auth-submit" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar Conta e Área de Trabalho'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Já tem uma conta? <button onClick={onSwitchToLogin} className="hs-link">Fazer Login</button></p>
        </div>
      </div>

      <style jsx>{`
        .auth-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f8fa; z-index: 9999; padding: 20px; }

        .auth-card {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(45, 62, 80, 0.12);
          width: 100%;
          max-width: 480px;
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
          color: #ff7a59;
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
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #2d3e50;
          margin-bottom: 6px;
        }

        .team-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #eaf0f6;
        }

        .field-hint {
          font-size: 11px;
          color: #7c98b6;
          margin-top: 6px;
          font-style: italic;
        }

        .auth-submit {
          width: 100%;
          margin-top: 20px;
          height: 48px;
          font-size: 16px;
          background: #ff7a59;
          border: 1px solid #ff7a59;
        }
        
        .auth-submit:hover {
            background: #ff8f73;
            border-color: #ff8f73;
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
          margin-bottom: 20px;
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
      `}</style>
    </div>
  );
};

export default Register;
