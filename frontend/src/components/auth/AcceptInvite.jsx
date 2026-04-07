import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import './AcceptInvite.css';

const AcceptInvite = () => {
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const token = searchParams.get('token');

  const [inviteInfo, setInviteInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({ name: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidationError('Token de convite não encontrado na URL.');
      setLoadingInfo(false);
      return;
    }
    fetch(`http://localhost:8000/invitations/validate?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Convite inválido.');
        setInviteInfo(data);
      })
      .catch((err) => setValidationError(err.message))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: formData.name, password: formData.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao aceitar convite.');
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 3500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="accept-invite-page">
      <div className="accept-invite-card">
        {/* Logo / Header */}
        <div className="invite-logo">
          <div className="invite-logo-mark">C</div>
        </div>

        {loadingInfo ? (
          <div className="invite-loading">
            <Loader2 size={32} className="spin" />
            <p>Verificando convite...</p>
          </div>
        ) : validationError ? (
          <div className="invite-error-state">
            <AlertCircle size={48} className="error-icon" />
            <h2>Convite Inválido</h2>
            <p>{validationError}</p>
            <a href="/login" className="invite-link-btn">Ir para o Login</a>
          </div>
        ) : success ? (
          <div className="invite-success-state">
            <CheckCircle2 size={48} className="success-icon" />
            <h2>Conta criada com sucesso! 🎉</h2>
            <p>Você já faz parte de <strong>{inviteInfo.workspace_name}</strong>. Redirecionando para o login...</p>
          </div>
        ) : (
          <>
            <div className="invite-header">
              <h1>Você foi convidado!</h1>
              <p>
                Para fazer parte de <strong>{inviteInfo?.workspace_name}</strong>,
                preencha seus dados abaixo para criar seu acesso.
              </p>
              <div className="invite-email-badge">{inviteInfo?.email}</div>
            </div>

            <form className="invite-form" onSubmit={handleSubmit}>
              <div className="invite-field">
                <label>Seu nome completo <span className="required">*</span></label>
                <input
                  type="text"
                  className="invite-input"
                  placeholder="Ex: Maria Oliveira"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="invite-field">
                <label>Crie uma senha <span className="required">*</span></label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="invite-input"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="invite-field">
                <label>Confirme a senha <span className="required">*</span></label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="invite-input"
                  placeholder="Repita a senha"
                  value={formData.confirm}
                  onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
                  required
                />
              </div>

              {error && (
                <div className="invite-error-msg">
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <button type="submit" className="invite-submit-btn" disabled={submitting}>
                {submitting ? <><Loader2 size={16} className="spin" /> Criando conta...</> : 'Aceitar Convite e Criar Conta'}
              </button>
            </form>

            <p className="invite-footer">
              Já possui uma conta? <a href="/login">Faça login</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
