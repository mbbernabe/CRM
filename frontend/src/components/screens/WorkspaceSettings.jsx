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
    RotateCcw
} from 'lucide-react';

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
        accent_color: '#ff7a59'
    });

    useEffect(() => {
        if (workspace) {
            setFormData({
                name: workspace.name || '',
                description: workspace.description || '',
                logo_url: workspace.logo_url || '',
                primary_color: workspace.primary_color || '#0091ae',
                accent_color: workspace.accent_color || '#ff7a59'
            });
        }
    }, [workspace]);

    if (!workspace) {
        return (
            <div className="settings-page loading-state">
                <RefreshCw className="spinner" size={32} />
                <p>Carregando configurações da área de trabalho...</p>
                <style jsx>{`
                    .loading-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 60vh;
                        gap: 16px;
                        color: var(--hs-text-secondary);
                    }
                    .spinner { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
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

            <style jsx>{`
                .settings-page {
                    padding: 40px;
                    max-width: 800px;
                    margin: 0 auto;
                    width: 100%;
                    flex: 1;
                    overflow-y: auto;
                    height: 100%;
                }

                .settings-card {
                    background: white;
                    border: 1px solid var(--hs-border-light);
                    border-radius: var(--hs-radius-lg);
                    box-shadow: var(--hs-shadow-md);
                    overflow: hidden;
                }

                .card-header {
                    padding: 32px;
                    background: var(--hs-bg-main);
                    border-bottom: 1px solid var(--hs-border-light);
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .header-icon {
                    width: 48px;
                    height: 48px;
                    color: var(--hs-blue);
                    background: white;
                    padding: 10px;
                    border-radius: 12px;
                    box-shadow: var(--hs-shadow-sm);
                }

                .card-header h2 {
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--hs-text-primary);
                    margin: 0;
                }

                .card-header p {
                    font-size: 14px;
                    color: var(--hs-text-secondary);
                    margin: 4px 0 0;
                }

                .settings-form {
                    padding: 32px;
                    display: flex;
                    flex-direction: column;
                    gap: 40px;
                }

                .form-section {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: var(--hs-text-primary);
                    border-bottom: 1px solid var(--hs-border-light);
                    padding-bottom: 12px;
                }

                .section-title h3 {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                }

                .input-hint {
                    font-size: 12px;
                    color: var(--hs-text-secondary);
                    margin-top: 4px;
                    font-style: italic;
                }

                .logo-preview {
                    margin-top: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .logo-preview span {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--hs-text-secondary);
                }

                .preview-box {
                    width: 120px;
                    height: 60px;
                    border: 2px dashed var(--hs-border);
                    border-radius: var(--hs-radius);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #fafafa;
                }

                .preview-box img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                }

                .color-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .color-input-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: var(--hs-bg-main);
                    padding: 8px 12px;
                    border-radius: var(--hs-radius);
                    border: 1px solid var(--hs-border);
                }

                .color-input-wrapper input[type="color"] {
                    border: none;
                    width: 32px;
                    height: 32px;
                    cursor: pointer;
                    background: none;
                }

                .color-input-wrapper code {
                    font-size: 13px;
                    color: var(--hs-text-primary);
                    background: none;
                    padding: 0;
                }

                .form-actions {
                    padding-top: 24px;
                    border-top: 1px solid var(--hs-border-light);
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .button-group {
                    display: flex;
                    gap: 12px;
                }

                .success-message {
                    color: #059669;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 600;
                }

                .error-message {
                    color: #dc2626;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 600;
                }

                .spinner {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .animate-in {
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 640px) {
                    .color-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default WorkspaceSettings;
