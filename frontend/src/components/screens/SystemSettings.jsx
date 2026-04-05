import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, Mail, Globe, Server, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

const SystemSettings = () => {
    const { fetchWithAuth } = useAuth();
    const [settings, setSettings] = useState({
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: '',
        smtp_from: '',
        smtp_security: 'STARTTLS',
        reset_link_base_url: 'http://localhost:5173'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth('http://localhost:8000/admin/settings');
            if (res.ok) {
                const data = await res.json();
                const newSettings = { ...settings };
                data.forEach(s => {
                    newSettings[s.key] = s.value;
                });
                setSettings(newSettings);
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro ao carregar configurações.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await fetchWithAuth('http://localhost:8000/admin/settings', {
                method: 'POST',
                body: JSON.stringify({ settings })
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
            } else {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Falha ao salvar.');
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="loading-container">
            <RefreshCw className="spinner" size={32} />
            <p>Carregando configurações globais...</p>
            <style jsx>{`
                .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 12px; color: var(--hs-text-secondary); }
                .spinner { animation: spin 1s linear infinite; color: var(--hs-blue); }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );

    return (
        <div className="settings-page animate-in">
            <div className="settings-header">
                <div className="header-info">
                    <h2>Configurações Globais do Sistema</h2>
                    <p>Gerencie as diretrizes de comunicação, segurança e endereçamento do CRM.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="settings-form">
                <div className="settings-grid">
                    {/* SMTP Section */}
                    <div className="settings-section">
                        <div className="section-title">
                            <Mail size={20} />
                            <h3>Servidor de E-mail (SMTP)</h3>
                        </div>
                        <div className="section-content">
                            <div className="form-group">
                                <label>Host SMTP</label>
                                <input name="smtp_host" value={settings.smtp_host} onChange={handleChange} placeholder="smtp.exemplo.com" />
                            </div>
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Porta</label>
                                    <input name="smtp_port" value={settings.smtp_port} onChange={handleChange} placeholder="587" />
                                </div>
                                <div className="form-group half">
                                    <label>Segurança</label>
                                    <select name="smtp_security" value={settings.smtp_security} onChange={handleChange}>
                                        <option value="NONE">Nenhuma</option>
                                        <option value="STARTTLS">STARTTLS (Recomendado para 587)</option>
                                        <option value="SSL">SSL/TLS (Recomendado para 465)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Usuário / E-mail</label>
                                <input name="smtp_user" value={settings.smtp_user} onChange={handleChange} placeholder="contato@empresa.com" />
                            </div>
                            <div className="form-group">
                                <label>Senha SMTP</label>
                                <input name="smtp_password" type="password" value={settings.smtp_password} onChange={handleChange} placeholder="••••••••" />
                            </div>
                            <div className="form-group">
                                <label>E-mail do Remetente</label>
                                <input name="smtp_from" value={settings.smtp_from} onChange={handleChange} placeholder="no-reply@empresa.com" />
                            </div>
                        </div>
                    </div>

                    {/* App Config Section */}
                    <div className="settings-section">
                        <div className="section-title">
                            <Globe size={20} />
                            <h3>Configurações de Endereçamento</h3>
                        </div>
                        <div className="section-content">
                            <div className="form-group">
                                <label>URL Base para Redefinição de Senha</label>
                                <p className="field-hint">O link enviado por e-mail começará com este endereço.</p>
                                <input name="reset_link_base_url" value={settings.reset_link_base_url} onChange={handleChange} placeholder="http://localhost:5173" />
                            </div>
                            
                            <div className="info-box">
                                <AlertCircle size={16} />
                                <span>Certifique-se de que a URL informada seja acessível pelos usuários externos (não use localhost em produção).</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settings-footer">
                    {message.text && (
                        <div className={`status-msg ${message.type}`}>
                            {message.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                            {message.text}
                        </div>
                    )}
                    <button type="submit" className="hs-button-primary" disabled={saving}>
                        {saving ? 'Salvando...' : (
                            <>
                                <Save size={18} /> Salvar Configurações
                            </>
                        )}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .settings-page { 
                    padding: 32px; 
                    max-width: 1000px; 
                    margin: 0 auto;
                    flex: 1;
                    overflow-y: auto;
                    height: 100%;
                }
                .settings-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--hs-border-light); }
                .settings-header h2 { font-size: 24px; font-weight: 700; color: #2d3e50; margin-bottom: 8px; }
                .settings-header p { color: var(--hs-text-secondary); font-size: 14px; }
                
                .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
                .settings-section { background: white; border: 1px solid var(--hs-border-light); border-radius: 8px; box-shadow: var(--hs-shadow-sm); display: flex; flex-direction: column; }
                .section-title { padding: 16px 20px; border-bottom: 1px solid var(--hs-border-light); display: flex; align-items: center; gap: 12px; color: var(--hs-blue); }
                .section-title h3 { font-size: 16px; font-weight: 700; color: #2d3e50; margin: 0; }
                .section-content { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
                
                .form-group { display: flex; flex-direction: column; gap: 6px; }
                .form-row { display: flex; gap: 16px; }
                .half { flex: 1; }
                label { font-size: 13px; font-weight: 600; color: #2d3e50; }
                input, select { padding: 10px 12px; border: 1px solid var(--hs-border); border-radius: 4px; font-size: 14px; outline: none; }
                input:focus { border-color: var(--hs-blue); box-shadow: 0 0 0 2px rgba(0,145,174,0.1); }
                
                .field-hint { font-size: 12px; color: var(--hs-text-secondary); margin: -2px 0 2px; }
                .info-box { display: flex; gap: 8px; background: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; border-radius: 4px; font-size: 12px; color: #0369a1; line-height: 1.4; margin-top: 10px; }
                
                .settings-footer { margin-top: 32px; display: flex; justify-content: flex-end; align-items: center; gap: 20px; padding-top: 24px; border-top: 1px solid var(--hs-border-light); }
                .status-msg { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
                .status-msg.success { color: #22c55e; }
                .status-msg.error { color: #dc2626; }
                
                .hs-button-primary { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 24px; }
                @media (max-width: 850px) { .settings-grid { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
};

export default SystemSettings;
