import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    Users, 
    Shield, 
    Mail, 
    RefreshCw, 
    AlertCircle, 
    ExternalLink, 
    UserX, 
    MoreHorizontal,
    Search,
    Filter,
    Globe,
    Building2
} from 'lucide-react';
import './AdminUsers.css';

const AdminUsers = () => {
    const { fetchWithAuth } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState(null);

    const fetchAllUsers = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth('http://localhost:8000/admin/users');
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Erro ao carregar usuários');
            }
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            if (err.message === 'Failed to fetch') {
                setError('Não foi possível conectar ao servidor. Verifique se o backend está ativo.');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const filteredUsers = users.filter(u => {
        const searchLower = searchTerm.toLowerCase();
        const workspaceName = (u.workspace_name || `Workspace #${u.workspace_id}`).toLowerCase();
        
        return (
            u.name.toLowerCase().includes(searchLower) || 
            u.email.toLowerCase().includes(searchLower) ||
            workspaceName.includes(searchLower)
        );
    });

    if (loading) return (
        <div className="loading-container">
            <RefreshCw className="spinner" size={40} />
            <p>Sincronizando base global de usuários...</p>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <AlertCircle size={48} />
            <h3>Falha de Autorização</h3>
            <p>{error}</p>
            <button onClick={fetchAllUsers} className="hs-button-secondary">Tentar Novamente</button>
        </div>
    );

    return (
        <div className="admin-container animate-in">
            <header className="page-header">
                <div className="header-title">
                    <div className="title-row">
                        <div className="type-badge">
                            <Globe size={14} />
                            <span>Global</span>
                        </div>
                        <h1>Administração Global</h1>
                    </div>
                    <p className="subtitle">Controle central de acesso e governança de tenants e usuários.</p>
                </div>
                <div className="header-stats">
                    <div className="stat-card">
                        <span className="stat-value">{users.length}</span>
                        <span className="stat-label">Usuários Ativos</span>
                    </div>
                </div>
            </header>

            <div className="table-actions">
                <div className="search-bar">
                    <Search size={16} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por nome ou e-mail..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="hs-button-secondary">
                    <Filter size={16} />
                    Filtros Avançados
                </button>
            </div>

            <div className="table-wrapper">
                <table className="hs-table">
                    <thead>
                        <tr>
                            <th>IDENTIFICADOR</th>
                            <th>USUÁRIO</th>
                            <th>PERMISSÃO</th>
                            <th>ÁREA DE TRABALHO</th>
                            <th>TIME (TENANT)</th>
                            <th className="actions-header">AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((u) => (
                            <tr key={u.id}>
                                <td className="id-cell">
                                    <code>#{u.id}</code>
                                </td>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar" style={{ background: u.role === 'admin' ? 'linear-gradient(135deg, #aa3bff, #7a1fff)' : 'linear-gradient(135deg, #0091ae, #007a90)' }}>
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="user-info">
                                            <span className="user-name">{u.name}</span>
                                            <span className="user-email"><Mail size={12} /> {u.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`role-badge ${u.role}`}>
                                        {u.role === 'admin' ? <Shield size={10} /> : null}
                                        {u.role}
                                    </span>
                                </td>
                                <td>
                                    <div className="workspace-indicator">
                                        <Building2 size={14} />
                                        <span>{u.workspace_name || `Workspace #${u.workspace_id}`}</span>
                                    </div>
                                </td>
                                <td>
                                    {u.team_id ? (
                                        <div className="team-indicator">
                                            <div className="pulse-dot"></div>
                                            <span>Team #{u.team_id}</span>
                                        </div>
                                    ) : (
                                        <span className="no-team">Órfão (Sem time)</span>
                                    )}
                                </td>
                                <td className="actions-cell">
                                    <div className="actions-wrapper">
                                        <button 
                                            className="icon-button"
                                            onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)}
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>
                                        {activeMenu === u.id && (
                                            <div className="dropdown-menu">
                                                <button onClick={() => {}}>
                                                    <ExternalLink size={14} /> Ver Detalhes
                                                </button>
                                                <button onClick={() => {}} className="danger">
                                                    <UserX size={14} /> Desativar Conta
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
