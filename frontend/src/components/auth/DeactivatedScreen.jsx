import React from 'react';
import { UserX, MessageSquare, Phone, ArrowLeft, ShieldAlert } from 'lucide-react';
import './DeactivatedScreen.css';

const DeactivatedScreen = ({ inactiveInfo, onBackToLogin }) => {
  const calculateDaysInactive = (dateStr) => {
    if (!dateStr) return 'algum tempo';
    const deactivatedAt = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - deactivatedAt);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 dia' : `${diffDays} dias`;
  };

  return (
    <div className="deactivated-container">
      <div className="deactivated-content-card">
        <div className="deactivated-header">
          <div className="alert-badge">
            <ShieldAlert size={16} />
            <span>Segurança do Sistema</span>
          </div>
          <div className="icon-main-container">
            <div className="pulse-ring"></div>
            <UserX size={48} className="deactivated-icon" />
          </div>
          <h1>Conta Suspensa</h1>
          <div className="inactive-badge">
            Inativa há {calculateDaysInactive(inactiveInfo?.deactivated_at)}
          </div>
          <p className="deactivated-description">
            Detectamos que sua conta está inativa. Por políticas de segurança do workspace, 
            o acesso foi temporariamente suspenso. Seus dados estão preservados e seguros.
          </p>
        </div>

        <div className="contact-grid">
          <button className="contact-card">
            <div className="contact-icon-wrapper chat">
              <MessageSquare size={24} />
            </div>
            <div className="contact-info">
              <strong>Suporte via Chat</strong>
              <span>Atendimento prioritário</span>
            </div>
          </button>

          <button className="contact-card">
            <div className="contact-icon-wrapper phone">
              <Phone size={24} />
            </div>
            <div className="contact-info">
              <strong>0800 123 4567</strong>
              <span>Central de Ativação</span>
            </div>
          </button>
        </div>

        <div className="deactivated-footer">
          <button onClick={onBackToLogin} className="back-link">
            <ArrowLeft size={16} />
            Voltar para o login
          </button>
        </div>
      </div>
      
      <div className="deactivated-bg-elements">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
    </div>
  );
};

export default DeactivatedScreen;
