import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, Mail, Globe, Server, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import './SystemSettings.css';

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
        </div>
    );
};

export default SystemSettings;
