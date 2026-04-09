import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useToast } from '../common/Toast';
import './Register.css';

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    workspace_name: ''
  });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const { addToast } = useToast();

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
      const msg = err.message || 'Erro de conexão com o servidor. Verifique se o backend está rodando.';
      setError(msg);
      addToast(msg, 'error');
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

    </div>
  );
};

export default Register;
