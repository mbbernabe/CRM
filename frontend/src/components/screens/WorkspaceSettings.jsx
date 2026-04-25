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
    X,
    Server,
    Key,
    Globe,
    UserCheck,
    Code,
    Cpu,
    Copy,
    ExternalLink,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import './WorkspaceSettings.css';

const WorkspaceSettings = () => {
    const { user, workspace, fetchWithAuth, refreshWorkspace, refreshUser, switchWorkspace } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        logo_url: '',
        primary_color: '#0091ae',
        accent_color: '#ff7a59',
        invitation_expiry_days: 7,
        invitation_message: '',
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
        smtp_sender_email: '',
        smtp_sender_name: '',
        smtp_security: 'STARTTLS',
        lead_api_key: '',
        lead_pipeline_id: '',
        lead_stage_id: '',
        lead_type_id: ''
    });
    
    const [showPreview, setShowPreview] = useState(false);
    const [pipelines, setPipelines] = useState([]);
    const [types, setTypes] = useState([]);
    const [selectedPipelineStages, setSelectedPipelineStages] = useState([]);

    useEffect(() => {
        if (workspace) {
            setFormData({
                name: workspace.name || '',
                description: workspace.description || '',
                logo_url: workspace.logo_url || '',
                primary_color: workspace.primary_color || '#0091ae',
                accent_color: workspace.accent_color || '#ff7a59',
                invitation_expiry_days: workspace.invitation_expiry_days || 7,
                invitation_message: workspace.invitation_message || '',
                smtp_host: workspace.smtp_host || '',
                smtp_port: workspace.smtp_port || 587,
                smtp_user: workspace.smtp_user || '',
                smtp_password: workspace.smtp_password || '',
                smtp_sender_email: workspace.smtp_sender_email || '',
                smtp_sender_name: workspace.smtp_sender_name || '',
                smtp_security: workspace.smtp_security || 'STARTTLS',
                lead_api_key: workspace.lead_api_key || '',
                lead_pipeline_id: workspace.lead_pipeline_id || '',
                lead_stage_id: workspace.lead_stage_id || '',
                lead_type_id: workspace.lead_type_id || ''
            });
        }
    }, [workspace]);

    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [pipesRes, typesRes] = await Promise.all([
                    fetchWithAuth('/pipelines/'),
                    fetchWithAuth('/workitems/types')
                ]);
                
                if (pipesRes.ok) setPipelines(await pipesRes.json());
                if (typesRes.ok) setTypes(await typesRes.json());
            } catch (err) {
                console.error('Erro ao carregar metadados:', err);
            }
        };
        loadMetadata();
    }, []);

    useEffect(() => {
        if (formData.lead_pipeline_id) {
            const pipe = pipelines.find(p => p.id === Number(formData.lead_pipeline_id));
            if (pipe) {
                setSelectedPipelineStages(pipe.stages || []);
            }
        } else {
            setSelectedPipelineStages([]);
        }
    }, [formData.lead_pipeline_id, pipelines]);

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
            // Sanitização de campos inteiros: converter "" para null
            const cleanedData = { ...formData };
            const intFields = ['lead_pipeline_id', 'lead_stage_id', 'lead_type_id', 'smtp_port', 'invitation_expiry_days'];
            
            intFields.forEach(field => {
                if (cleanedData[field] === '' || cleanedData[field] === undefined) {
                    cleanedData[field] = null;
                } else {
                    cleanedData[field] = Number(cleanedData[field]);
                }
            });

            const res = await fetchWithAuth(`http://localhost:8000/workspaces/${workspace.id}`, {
                method: 'PATCH',
                body: JSON.stringify(cleanedData)
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

    const handleGenerateKey = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = 'crm_';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, lead_api_key: key });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copiado para a área de transferência!');
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

    const handleDeleteWorkspace = () => {
        if (user?.memberships?.length <= 1) {
            alert('Você não pode excluir sua única área de trabalho.');
            return;
        }
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (deleteConfirmName !== workspace.name) {
            alert('O nome digitado não coincide.');
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            const res = await fetchWithAuth(`http://localhost:8000/workspaces/${workspace.id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Erro ao excluir área de trabalho');
            }

            const data = await res.json();
            
            // 1. Atualizar a lista de memberships do usuário
            await refreshUser();
            
            // 2. Redirecionar/Trocar de contexto
            if (data.next_workspace_id) {
                await switchWorkspace(data.next_workspace_id);
            }
            
            window.location.href = '/';
        } catch (err) {
            setError(err.message);
            setIsDeleting(false);
            setShowDeleteModal(false);
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

                    <section className="form-section">
                        <div className="section-title">
                            <Server size={18} />
                            <h3>Configuração de E-mail (SMTP)</h3>
                        </div>
                        <p className="section-description">
                            Configure o servidor de e-mail da sua empresa para que os convites e notificações sejam enviados com o seu domínio. 
                            Deixe em branco para usar o servidor padrão do sistema.
                        </p>
                        
                        <div className="hs-form-group">
                            <label className="hs-label">Servidor SMTP (Host)</label>
                            <div className="input-with-icon-wrapper">
                                <Globe size={16} className="input-icon" />
                                <input 
                                    type="text" 
                                    className="hs-input"
                                    value={formData.smtp_host}
                                    onChange={(e) => setFormData({...formData, smtp_host: e.target.value})}
                                    placeholder="smtp.exemplo.com"
                                />
                            </div>
                        </div>

                        <div className="form-grid-3">
                            <div className="hs-form-group">
                                <label className="hs-label">Porta</label>
                                <input 
                                    type="number" 
                                    className="hs-input"
                                    value={formData.smtp_port}
                                    onChange={(e) => setFormData({...formData, smtp_port: Number(e.target.value)})}
                                    placeholder="587"
                                />
                            </div>
                            <div className="hs-form-group">
                                <label className="hs-label">Segurança</label>
                                <select 
                                    className="hs-select"
                                    value={formData.smtp_security}
                                    onChange={(e) => setFormData({...formData, smtp_security: e.target.value})}
                                >
                                    <option value="STARTTLS">STARTTLS (Recomendado)</option>
                                    <option value="SSL">SSL/TLS (Porta 465)</option>
                                    <option value="NONE">Nenhuma</option>
                                </select>
                            </div>
                        </div>

                        <div className="color-grid">
                            <div className="hs-form-group">
                                <label className="hs-label">Usuário SMTP</label>
                                <div className="input-with-icon-wrapper">
                                    <UserCheck size={16} className="input-icon" />
                                    <input 
                                        type="text" 
                                        className="hs-input"
                                        value={formData.smtp_user}
                                        onChange={(e) => setFormData({...formData, smtp_user: e.target.value})}
                                        placeholder="usuario@dominio.com"
                                    />
                                </div>
                            </div>
                            <div className="hs-form-group">
                                <label className="hs-label">Senha SMTP</label>
                                <div className="input-with-icon-wrapper">
                                    <Key size={16} className="input-icon" />
                                    <input 
                                        type="password" 
                                        className="hs-input"
                                        value={formData.smtp_password}
                                        onChange={(e) => setFormData({...formData, smtp_password: e.target.value})}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="color-grid">
                            <div className="hs-form-group">
                                <label className="hs-label">E-mail do Remetente</label>
                                <div className="input-with-icon-wrapper">
                                    <Mail size={16} className="input-icon" />
                                    <input 
                                        type="email" 
                                        className="hs-input"
                                        value={formData.smtp_sender_email}
                                        onChange={(e) => setFormData({...formData, smtp_sender_email: e.target.value})}
                                        placeholder="no-reply@suaempresa.com"
                                    />
                                </div>
                            </div>
                            <div className="hs-form-group">
                                <label className="hs-label">Nome do Remetente</label>
                                <input 
                                    type="text" 
                                    className="hs-input"
                                    value={formData.smtp_sender_name}
                                    onChange={(e) => setFormData({...formData, smtp_sender_name: e.target.value})}
                                    placeholder="Ex: Equipe de Vendas"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <div className="section-title">
                            <Cpu size={18} />
                            <h3>API de Leads (Integração Externa)</h3>
                        </div>
                        <p className="section-description">
                            Use esta API para receber leads de formulários do seu site, landing pages ou sistemas externos diretamente no seu pipeline.
                        </p>

                        <div className="hs-form-group">
                            <label className="hs-label">Chave da API Pública (X-API-Key)</label>
                            <div className="api-key-wrapper">
                                <div className="input-with-icon-wrapper" style={{ flex: 1 }}>
                                    <Key size={16} className="input-icon" />
                                    <input 
                                        type="text" 
                                        className="hs-input"
                                        value={formData.lead_api_key}
                                        readOnly
                                        placeholder="Gere uma chave para começar..."
                                        style={{ backgroundColor: '#f9fafb', cursor: 'default' }}
                                    />
                                </div>
                                <button 
                                    type="button" 
                                    className="hs-button-secondary"
                                    onClick={handleGenerateKey}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    {formData.lead_api_key ? 'Regerar Chave' : 'Gerar Chave'}
                                </button>
                                {formData.lead_api_key && (
                                    <button 
                                        type="button" 
                                        className="hs-button-secondary"
                                        onClick={() => copyToClipboard(formData.lead_api_key)}
                                        title="Copiar Chave"
                                        style={{ padding: '8px' }}
                                    >
                                        <Copy size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="hs-form-group">
                            <label className="hs-label">Destino dos Leads</label>
                            <div className="form-grid-3">
                                <div>
                                    <label className="input-hint">Pipeline</label>
                                    <select 
                                        className="hs-select"
                                        style={{ width: '100%' }}
                                        value={formData.lead_pipeline_id}
                                        onChange={(e) => setFormData({...formData, lead_pipeline_id: e.target.value, lead_stage_id: ''})}
                                    >
                                        <option value="">Selecione...</option>
                                        {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-hint">Estágio Inicial</label>
                                    <select 
                                        className="hs-select"
                                        style={{ width: '100%' }}
                                        value={formData.lead_stage_id}
                                        onChange={(e) => setFormData({...formData, lead_stage_id: e.target.value})}
                                        disabled={!formData.lead_pipeline_id}
                                    >
                                        <option value="">Selecione...</option>
                                        {selectedPipelineStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-hint">Tipo de Objeto</label>
                                    <select 
                                        className="hs-select"
                                        style={{ width: '100%' }}
                                        value={formData.lead_type_id}
                                        onChange={(e) => setFormData({...formData, lead_type_id: e.target.value})}
                                    >
                                        <option value="">Selecione...</option>
                                        {types.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {formData.lead_api_key && (
                            <div className="integration-instructions animate-in">
                                <div className="instruction-header">
                                    <Code size={16} />
                                    <span>Instruções de Integração</span>
                                </div>
                                <div className="code-block">
                                    <pre>
{`POST http://localhost:8000/public/leads
Headers:
  X-API-Key: ${formData.lead_api_key}
  Content-Type: application/json

Body:
{
  "title": "João Silva",
  "email": "joao@exemplo.com",
  "message": "Tenho interesse..."
}`}
                                    </pre>
                                </div>
                                <p className="input-hint" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ExternalLink size={12} /> Todos os campos extras enviados no JSON serão salvos automaticamente.
                                </p>
                            </div>
                        )}
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

            <div className="settings-card danger-section animate-in" style={{ marginTop: '30px', borderTop: '4px solid #ff4d4d' }}>
                <div className="card-header">
                    <AlertTriangle className="header-icon danger-icon" style={{ color: '#ff4d4d' }} />
                    <div>
                        <h2 style={{ color: '#ff4d4d' }}>Zona de Perigo</h2>
                        <p>Ações irreversíveis que afetam permanentemente sua conta.</p>
                    </div>
                </div>
                
                <div className="danger-content">
                    <div className="danger-item">
                        <div className="danger-info">
                            <h4>Excluir esta Área de Trabalho</h4>
                            <p>Ao excluir uma área de trabalho, todos os dados, configurações e membros associados serão removidos permanentemente. Esta ação não pode ser desfeita.</p>
                        </div>
                        <button 
                            className={`hs-button-danger ${user?.memberships?.length <= 1 ? 'disabled' : ''}`}
                            onClick={handleDeleteWorkspace}
                            disabled={loading || user?.memberships?.length <= 1}
                        >
                            <Trash2 size={18} />
                            Excluir Área de Trabalho
                        </button>
                    </div>
                    
                    {user?.memberships?.length <= 1 && (
                        <div className="danger-warning">
                            <AlertCircle size={14} />
                            <span>Esta é sua única área de trabalho e não pode ser excluída.</span>
                        </div>
                    )}
                </div>
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

            {showDeleteModal && (
                <div className="email-preview-overlay animate-in" onClick={() => setShowDeleteModal(false)}>
                    <div className="email-preview-modal delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="header-title">
                                <AlertTriangle size={24} style={{ color: '#ff4d4d' }} />
                                <h3 style={{ color: '#ff4d4d' }}>Excluir Área de Trabalho</h3>
                            </div>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="modal-body" style={{ padding: '32px' }}>
                            <div className="warning-box" style={{ 
                                backgroundColor: '#fff5f5', 
                                borderLeft: '4px solid #ff4d4d', 
                                padding: '16px', 
                                borderRadius: '4px',
                                marginBottom: '24px'
                            }}>
                                <p style={{ color: '#c53030', fontWeight: '600', margin: '0 0 8px 0', fontSize: '15px' }}>
                                    ESTA AÇÃO É PERMANENTE E IRREVERSÍVEL.
                                </p>
                                <p style={{ color: '#742a2a', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                                    Todos os dados associados à área <strong>"{workspace.name}"</strong>, incluindo tarefas, 
                                    leads, pipelines e membros da equipe serão excluídos definitivamente.
                                </p>
                            </div>

                            <div className="hs-form-group">
                                <label className="hs-label" style={{ fontWeight: '600' }}>
                                    Para confirmar, digite o nome da área de trabalho abaixo:
                                </label>
                                <input 
                                    type="text" 
                                    className="hs-input"
                                    placeholder={workspace.name}
                                    value={deleteConfirmName}
                                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <p style={{ marginTop: '20px', fontSize: '13px', color: 'var(--hs-text-secondary)' }}>
                                <AlertCircle size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                Após a exclusão, você será automaticamente redirecionado para outra de suas áreas de trabalho.
                            </p>
                        </div>

                        <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '12px' }}>
                            <button 
                                className="hs-button-secondary" 
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="hs-button-danger" 
                                onClick={confirmDelete}
                                disabled={isDeleting || deleteConfirmName !== workspace.name}
                            >
                                {isDeleting ? <RefreshCw className="spinner" size={18} /> : <Trash2 size={18} />}
                                {isDeleting ? 'Excluindo...' : 'Entendo o risco, excluir permanentemente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkspaceSettings;
