import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Camera, 
  Lock, 
  Check, 
  AlertCircle,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import './Profile.css';

const Profile = () => {
  const { user, fetchWithAuth, updateUserData } = useAuth();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'security'
  const [loading, setLoading] = useState(false);
  
  // Personal Info State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    position: user?.position || '',
    avatar_url: user?.avatar_url || ''
  });

  // Security State
  const [securityData, setSecurityData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        updateUserData(updatedUser);
        addToast('Perfil atualizado com sucesso!', 'success');
      } else {
        const error = await res.json();
        addToast(error.detail || 'Erro ao atualizar perfil', 'error');
      }
    } catch (err) {
      addToast('Erro de conexão com o servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (securityData.new_password !== securityData.confirm_password) {
      addToast('As novas senhas não coincidem', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithAuth('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: securityData.current_password,
          new_password: securityData.new_password
        })
      });

      if (res.ok) {
        addToast('Senha alterada com sucesso!', 'success');
        setSecurityData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        const error = await res.json();
        addToast(error.detail || 'Erro ao alterar senha', 'error');
      }
    } catch (err) {
      addToast('Erro de conexão com o servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page animate-in">
      <div className="settings-card">
        <div className="card-header">
          <div className="profile-avatar-container">
            <div className="profile-avatar-wrapper">
              {profileData.avatar_url ? (
                <img src={profileData.avatar_url} alt="Avatar" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {profileData.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button className="avatar-edit-btn" title="Alterar Foto">
                <Camera size={14} />
              </button>
            </div>
          </div>
          <div className="header-text">
            <h2>Meu Perfil</h2>
            <p>Gerencie suas informações pessoais e configurações de segurança.</p>
          </div>
        </div>

        <div className="profile-tabs-nav">
          <button 
            className={`tab-item ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <User size={16} />
            Dados Pessoais
          </button>
          <button 
            className={`tab-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <ShieldCheck size={16} />
            Segurança
          </button>
        </div>

        <div className="settings-form-container">
          {activeTab === 'personal' ? (
            <form className="settings-form animate-in" onSubmit={saveProfile}>
              <section className="form-section">
                <div className="section-title">
                  <User size={18} />
                  <h3>Informações Básicas</h3>
                </div>
                
                <div className="form-row">
                  <div className="hs-form-group">
                    <label className="hs-label">
                      Nome Completo <span className="required-indicator">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="hs-input"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      placeholder="Seu nome"
                      required
                    />
                  </div>

                  <div className="hs-form-group">
                    <label className="hs-label">E-mail (Login)</label>
                    <input 
                      type="email" 
                      className="hs-input"
                      value={user?.email}
                      disabled
                      style={{ backgroundColor: '#f5f8fa', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="hs-form-group">
                    <label className="hs-label">WhatsApp / Telefone</label>
                    <input 
                      type="text" 
                      className="hs-input"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="hs-form-group">
                    <label className="hs-label">Cargo / Função</label>
                    <input 
                      type="text" 
                      className="hs-input"
                      name="position"
                      value={profileData.position}
                      onChange={handleProfileChange}
                      placeholder="Ex: Gerente Comercial"
                    />
                  </div>
                </div>

                <div className="hs-form-group">
                  <label className="hs-label">URL da Foto de Perfil (Avatar)</label>
                  <input 
                    type="text" 
                    className="hs-input"
                    name="avatar_url"
                    value={profileData.avatar_url}
                    onChange={handleProfileChange}
                    placeholder="https://exemplo.com/suafoto.jpg"
                  />
                  <p className="input-hint">Insira o link de uma imagem quadrada para melhores resultados.</p>
                </div>
              </section>

              <div className="form-actions">
                <button type="submit" className="hs-button-primary" disabled={loading}>
                  {loading ? <Loader2 className="spinner" size={18} /> : <Check size={18} />}
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          ) : (
            <form className="settings-form animate-in" onSubmit={changePassword}>
              <section className="form-section">
                <div className="section-title">
                  <Lock size={18} />
                  <h3>Segurança da Conta</h3>
                </div>
                <p className="section-description">
                  Recomendamos trocar sua senha periodicamente para manter sua conta segura.
                </p>

                <div className="hs-form-group">
                  <label className="hs-label">
                    Senha Atual <span className="required-indicator">*</span>
                  </label>
                  <input 
                    type="password" 
                    className="hs-input"
                    name="current_password"
                    value={securityData.current_password}
                    onChange={handleSecurityChange}
                    placeholder="Digite sua senha atual"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="hs-form-group">
                    <label className="hs-label">
                      Nova Senha <span className="required-indicator">*</span>
                    </label>
                    <input 
                      type="password" 
                      className="hs-input"
                      name="new_password"
                      value={securityData.new_password}
                      onChange={handleSecurityChange}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="hs-form-group">
                    <label className="hs-label">
                      Confirmar Nova Senha <span className="required-indicator">*</span>
                    </label>
                    <input 
                      type="password" 
                      className="hs-input"
                      name="confirm_password"
                      value={securityData.confirm_password}
                      onChange={handleSecurityChange}
                      placeholder="Repita a nova senha"
                      required
                    />
                  </div>
                </div>
              </section>

              <div className="form-actions">
                <button type="submit" className="hs-button-primary" disabled={loading} style={{ backgroundColor: 'var(--hs-blue)', borderColor: 'var(--hs-blue)' }}>
                  {loading ? <Loader2 className="spinner" size={18} /> : <ShieldCheck size={18} />}
                  {loading ? 'Atualizando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
