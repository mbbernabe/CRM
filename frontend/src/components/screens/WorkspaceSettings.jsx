import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    Layout, 
    Palette, 
    Image as ImageIcon, 
    Save, 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle,
    Building2,
    RotateCcw,
    Shield,
    Eye,
    Mail,
    X
} from 'lucide-react';
import './WorkspaceSettings.css';

const WorkspaceSettings = () => {
    const { workspace, fetchWithAuth, refreshWorkspace } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logo_url: '',
        primary_color: '#0091ae',
        accent_color: '#ff7a59',
        invitation_expiry_days: 7,
        invitation_message: ''
    });
    
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (workspace) {
            setFormData({
                name: workspace.name || '',
                description: workspace.description || '',
                logo_url: workspace.logo_url || '',
                primary_color: workspace.primary_color || '#0091ae',
                accent_color: workspace.accent_color || '#ff7a59',
                invitation_expiry_days: workspace.invitation_expiry_days || 7,
                invitation_message: workspace.invitation_message || ''
            });
        }
    }, [workspace]);

    if (!workspace) {
        return (
            <div className="settings-page loading-state">
                <RefreshCw className="spinner" size={32} />
                <p>Carregando configurações da área de trabalho...</p>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetchWithAuth(`http://localhost:8000/workspaces/${workspace.id}`, {
                method: 'PATCH',
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Erro ao atualizar configurações');
            }

            await refreshWorkspace();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm('Tem certeza que deseja restaurar o logotipo e as cores originais aos padrões do sistema?')) return;
        
        const defaultData = {
            name: formData.name, 
            description: formData.description,
            logo_url: '',
            primary_color: '#0091ae',
            accent_color: '#ff7a59'
        };

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetchWithAuth(`http://localhost:8000/workspaces/${workspace.id}`, {
                method: 'PATCH',
                body: JSON.stringify(defaultData)
            });

            if (!res.ok) throw new Error('Erro ao restaurar padrões');

            await refreshWorkspace();
            setFormData(prev => ({ ...prev, ...defaultData }));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-page animate-in">
            <div className="settings-card">
                    <div className="card-header">
                        <Layout className="header-icon" />
                        <div>
                            <h2>Personalização da Área de Trabalho</h2>
                            <p>Configure a identidade visual da sua empresa no CRM.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="settings-form">
                        <section className="form-section">
                            <div className="section-title">
                                <Building2 size={18} />
                                <h3>Informações Gerais</h3>
                            </div>
                            <div className="hs-form-group">
                                <label className="hs-label">Nome da Empresa / Área de Trabalho</label>
                                <input 
                                    type="text" 
                                    className="hs-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Ex: Minha Empresa SaaS"
                                    required
                                />
                            </div>
                            <div className="hs-form-group">
                                <label className="hs-label">Descrição</label>
                                <textarea 
                                    className="hs-input"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Breve descrição da sua empresa..."
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        </section>

                    <section className="form-section">
                        <div className="section-title">
                            <ImageIcon size={18} />
                            <h3>Identidade Visual (Logo)</h3>
                        </div>
                        <div className="hs-form-group">
                            <label className="hs-label">URL do Logotipo</label>
                            <input 
                                type="url" 
                                className="hs-input"
                                value={formData.logo_url}
                                onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                                placeholder="https://exemplo.com/logo.png"
                            />
                            <p className="input-hint">Insira o link direto para a imagem do seu logo (PNG, JPG ou SVG).</p>
                        </div>
                        
                        {formData.logo_url && (
                            <div className="logo-preview">
                                <span>Preview do Logo:</span>
                                <div className="preview-box">
                                    <img src={formData.logo_url} alt="Logo Preview" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="form-section">
                        <div className="section-title">
                            <Palette size={18} />
                            <h3>Esquema de Cores</h3>
                        </div>
                        <div className="color-grid">
                            <div className="hs-form-group">
                                <label className="hs-label">Cor Primária (Links e Botões Secundários)</label>
                                <div className="color-input-wrapper">
                                    <input 
                                        type="color" 
                                        value={formData.primary_color}
                                        onChange={(e) => setFormData({...formData, primary_color: e.target.value})}
                                    />
                                    <code>{formData.primary_color}</code>
                                </div>
                            </div>
                            <div className="hs-form-group">
                                <label className="hs-label">Cor de Destaque (Botões Principais e Alertas)</label>
                                <div className="color-input-wrapper">
                                    <input 
                                        type="color" 
                                        value={formData.accent_color}
                                        onChange={(e) => setFormData({...formData, accent_color: e.target.value})}
                                    />
                                    <code>{formData.accent_color}</code>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="section-title">
                            <Shield size={18} />
                            <h3>Segurança & Convites</h3>
                        </div>
                        <div className="hs-form-group">
                            <label className="hs-label">Validade dos Convites (dias)</label>
                            <input
                                type="number"
                                className="hs-input"
                                min="1"
                                max="90"
                                value={formData.invitation_expiry_days}
                                onChange={(e) => setFormData({...formData, invitation_expiry_days: Number(e.target.value)})}
                                style={{ maxWidth: '180px' }}
                            />
                            <p className="input-hint">
                                Por padrão os convites expiram em 7 dias. Você pode configurar entre 1 e 90 dias.
                            </p>
                        </div>

                        <div className="hs-form-group" style={{ marginTop: '20px' }}>
                            <label className="hs-label">Mensagem de Convite Personalizada</label>
                            <textarea 
                                className="hs-input"
                                rows="5"
                                value={formData.invitation_message}
                                onChange={(e) => setFormData({...formData, invitation_message: e.target.value})}
                                placeholder="Ex: Seja bem-vindo à nossa equipe no CRM! Estamos ansiosos para trabalhar com você."
                                style={{ resize: 'vertical' }}
                            />
                            <p className="input-hint">
                                Esta mensagem substituirá o texto padrão no corpo do e-mail de convite. Deixe em branco para usar o padrão.
                            </p>
                            
                            <button 
                                type="button" 
                                className="hs-button-secondary preview-btn" 
                                style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                onClick={() => setShowPreview(true)}
                            >
                                <Eye size={16} />
                                Visualizar E-mail de Convite
                            </button>
                        </div>
                    </section>

                    <div className="form-actions">
                        {error && <div className="error-message"><AlertCircle size={16} /> {error}</div>}
                        {success && <div className="success-message"><CheckCircle2 size={16} /> Configurações salvas com sucesso!</div>}
                        
                        <div className="button-group">
                            <button 
                                type="button" 
                                className="hs-button-secondary" 
                                onClick={handleReset}
                                disabled={loading}
                            >
                                <RotateCcw size={18} />
                                Restaurar Padrões
                            </button>
                            <button type="submit" className="hs-button-primary" disabled={loading}>
                                {loading ? <RefreshCw className="spinner" size={18} /> : <Save size={18} />}
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {showPreview && (
                <div className="email-preview-overlay animate-in" onClick={() => setShowPreview(false)}>
                    <div className="email-preview-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="header-title">
                                <Mail size={20} className="header-icon" />
                                <h3>Visualização do E-mail de Convite</h3>
                            </div>
                            <button className="close-btn" onClick={() => setShowPreview(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="email-container">
                            <div className="email-content">
                                <div className="email-header">
                                    <h2 style={{ color: '#0091ae', margin: 0 }}>Você foi convidado! 🎉</h2>
                                </div>
                                
                                <div className="email-body">
                                    <p>Olá,</p>
                                    <div className="email-message-text">
                                        {formData.invitation_message ? (
                                            formData.invitation_message.split('\n').map((line, i) => (
                                                <React.Fragment key={i}>
                                                    {line}<br/>
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            <><strong>{useAuth().user?.name || 'Administrador'}</strong> convidou você para fazer parte da área de trabalho <strong>{workspace.name}</strong> no sistema CRM.</>
                                        )}
                                    </div>
                                    
                                    <p style={{ marginTop: '20px' }}>Clique no botão abaixo para aceitar o convite e definir sua senha (este link é válido por {formData.invitation_expiry_days} dias):</p>
                                    
                                    <div className="email-action">
                                        <button className="email-button" style={{ backgroundColor: '#ff7a59' }}>
                                            Aceitar Convite
                                        </button>
                                    </div>
                                    
                                    <p className="email-link-text">Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:</p>
                                    <p className="email-link-url">http://localhost:5173/accept-invite?token=0000-0000...</p>
                                    
                                    <hr className="email-divider" />
                                    <p className="email-footer-text">Se você não esperava este convite, pode ignorar este e-mail com segurança.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <p className="preview-note">As cores e o logotipo visualizados acima podem variar de acordo com as configurações da área de trabalho.</p>
                            <button className="hs-button-primary" onClick={() => setShowPreview(false)}>
                                Fechar Visualização
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkspaceSettings;
