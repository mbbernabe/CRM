import React, { useState, useEffect, useMemo } from 'react';
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
    Building2,
    Settings2,
    ArrowUp,
    ArrowDown,
    Trash2,
    Plus,
    Clock
} from 'lucide-react';
import Modal from '../common/Modal';
import { useToast } from '../common/Toast';
import './AdminUsers.css';
import './WorkItemTypeSettings.css'; // Reutilizar estilos de tabela avançada
import { API_BASE_URL } from '../../config';

const AdminUsers = () => {
    const { fetchWithAuth } = useAuth();
    const { addToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Advanced Table States
    const [visibleColumns, setVisibleColumns] = useState(['user', 'status', 'deactivated', 'connection', 'role', 'workspace', 'actions']);
    const [columnWidths, setColumnWidths] = useState({
        checkbox: 50,
        id: 80,
        user: 250,
        status: 120,
        deactivated: 150,
        connection: 120,
        role: 140,
        workspace: 180,
        team: 150,
        actions: 100
    });
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isResizing, setIsResizing] = useState(null);

    const fetchAllUsers = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/users`);
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

    const filteredAndSortedUsers = useMemo(() => {
        let result = [...users];

        // Search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter(u => {
                const workspaceNames = (u.memberships || []).map(m => m.workspace_name || `Workspace #${m.workspace_id}`).join(' ').toLowerCase();
                return (
                    u.name.toLowerCase().includes(searchLower) || 
                    u.email.toLowerCase().includes(searchLower) ||
                    workspaceNames.includes(searchLower)
                );
            });
        }

        // Sort
        const { key, direction } = sortConfig;
        result.sort((a, b) => {
            let valA = a[key] || '';
            let valB = b[key] || '';
            
            // Tratamento especial para colunas complexas
            if (key === 'user') { valA = a.name; valB = b.name; }
            if (key === 'workspace') { 
                valA = a.memberships?.[0]?.workspace_name || ''; 
                valB = b.memberships?.[0]?.workspace_name || ''; 
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [users, searchTerm, sortConfig]);

    // Resizing Logic
    const startResize = (e, column) => {
        e.preventDefault();
        setIsResizing({
            column,
            startX: e.pageX,
            startWidth: columnWidths[column]
        });
    };

    useEffect(() => {
        if (!isResizing) return;

        const doResize = (e) => {
            const diff = e.pageX - isResizing.startX;
            setColumnWidths(prev => ({
                ...prev,
                [isResizing.column]: Math.max(50, isResizing.startWidth + diff)
            }));
        };

        const stopResize = () => setIsResizing(null);

        window.addEventListener('mousemove', doResize);
        window.addEventListener('mouseup', stopResize);
        return () => {
            window.removeEventListener('mousemove', doResize);
            window.removeEventListener('mouseup', stopResize);
        };
    }, [isResizing]);

    const handleToggleStatus = async (userId) => {
        try {
            const res = await fetchWithAuth(`${API_BASE_URL}/admin/users/${userId}/toggle-status`, { method: 'POST' });
            if (res.ok) {
                addToast("Status do usuário atualizado", "success");
                fetchAllUsers();
            } else {
                addToast("Erro ao atualizar status", "error");
            }
        } catch (err) {
            addToast(err.message, "error");
        }
    };

    const calculateDaysInactive = (dateStr) => {
        if (!dateStr) return '-';
        const deactivatedAt = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now - deactivatedAt);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 1 ? '1 dia' : `${diffDays} dias`;
    };

    const isOnline = (lastActivity) => {
        if (!lastActivity) return false;
        const lastSeen = new Date(lastActivity);
        const now = new Date();
        const diffMinutes = (now - lastSeen) / 1000 / 60;
        return diffMinutes < 5; // Considera online se teve atividade nos últimos 5 min
    };


    const handleBulkDelete = async () => {
        setIsDeleting(true);
        try {
            const results = await Promise.all(
                selectedIds.map(id => fetchWithAuth(`${API_BASE_URL}/admin/users/${id}`, { method: 'DELETE' }))
            );
            const successes = results.filter(r => r.ok).length;
            if (successes > 0) {
                addToast(`${successes} usuários removidos com sucesso`, 'success');
                fetchAllUsers();
                setSelectedIds([]);
                setIsBulkDeleteModalOpen(false);
            } else {
                addToast("Erro ao excluir usuários selecionados", "error");
            }
        } catch (err) {
            addToast(err.message, "error");
        } finally {
            setIsDeleting(false);
        }
    };

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
                
                <div className="action-buttons">
                    {selectedIds.length > 0 && (
                        <button className="hs-button-danger" onClick={() => setIsBulkDeleteModalOpen(true)}>
                            <Trash2 size={16} /> Excluir ({selectedIds.length})
                        </button>
                    )}

                    <div className="column-picker-wrapper">
                        <button 
                            className={`hs-button-secondary ${isColumnPickerOpen ? 'active' : ''}`}
                            onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
                        >
                            <Settings2 size={16} /> Colunas
                        </button>
                        {isColumnPickerOpen && (
                            <div className="column-picker-dropdown">
                                <div className="picker-header">Exibir Colunas</div>
                                <div className="picker-options">
                                    <label className="column-picker-item">
                                        <input 
                                            type="checkbox" 
                                            checked={visibleColumns.includes('checkbox')} 
                                            onChange={() => setVisibleColumns(prev => prev.includes('checkbox') ? prev.filter(c => c !== 'checkbox') : [...prev, 'checkbox'])}
                                        />
                                        Seleção
                                    </label>
                                    <label className="column-picker-item">
                                        <input 
                                            type="checkbox" 
                                            checked={visibleColumns.includes('id')} 
                                            onChange={() => setVisibleColumns(prev => prev.includes('id') ? prev.filter(c => c !== 'id') : [...prev, 'id'])}
                                        />
                                        Identificador
                                    </label>
                                    <label className="column-picker-item">
                                        <input 
                                            type="checkbox" 
                                            checked={visibleColumns.includes('user')} 
                                            onChange={() => setVisibleColumns(prev => prev.includes('user') ? prev.filter(c => c !== 'user') : [...prev, 'user'])}
                                        />
                                        Usuário
                                    </label>
                                    <label className="column-picker-item">
                                        <input 
                                            type="checkbox" 
                                            checked={visibleColumns.includes('status')} 
                                            onChange={() => setVisibleColumns(prev => prev.includes('status') ? prev.filter(c => c !== 'status') : [...prev, 'status'])}
                                        />
                                        Conta
                                    </label>
                                    <label className="column-picker-item">
                                        <input 
                                            type="checkbox" 
                                            checked={visibleColumns.includes('deactivated')} 
                                            onChange={() => setVisibleColumns(prev => prev.includes('deactivated') ? prev.filter(c => c !== 'deactivated') : [...prev, 'deactivated'])}
                                        />
                                        Dias Inativo
                                    </label>
                                    <label className="column-picker-item">
                                        <input 
                                            type="checkbox" 
                                            checked={visibleColumns.includes('connection')} 
                                            onChange={() => setVisibleColumns(prev => prev.includes('connection') ? prev.filter(c => c !== 'connection') : [...prev, 'connection'])}
                                        />
                                        Conexão
                                    </label>
                                    <label className="column-picker-item">
                                        <input 
                                            type="checkbox" 
                                            checked={visibleColumns.includes('role')} 
                                            onChange={() => setVisibleColumns(prev => prev.includes('role') ? prev.filter(c => c !== 'role') : [...prev, 'role'])}
                                        />
                                        Permissão
                                    </label>
                                    <label className="column-picker-item">
                                        <input 
                                            type="checkbox" 
                                            checked={visibleColumns.includes('workspace')} 
                                            onChange={() => setVisibleColumns(prev => prev.includes('workspace') ? prev.filter(c => c !== 'workspace') : [...prev, 'workspace'])}
                                        />
                                        Área de Trabalho
                                    </label>
                                    <label className="column-picker-item">
                                        <input 
                                            type="checkbox" 
                                            checked={visibleColumns.includes('team')} 
                                            onChange={() => setVisibleColumns(prev => prev.includes('team') ? prev.filter(c => c !== 'team') : [...prev, 'team'])}
                                        />
                                        Time
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="hs-table" style={{ tableLayout: 'fixed', width: 'fit-content', minWidth: '100%' }}>
                    <thead>
                        <tr>
                            {visibleColumns.includes('checkbox') && (
                                <th style={{ width: columnWidths.checkbox }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.length === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds(filteredAndSortedUsers.map(u => u.id));
                                            else setSelectedIds([]);
                                        }}
                                    />
                                </th>
                            )}
                            {visibleColumns.includes('id') && (
                                <th style={{ width: columnWidths.id }}>
                                    <div className="th-content" onClick={() => setSortConfig({ key: 'id', direction: sortConfig.key === 'id' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </div>
                                    <div className="resizer" onMouseDown={e => startResize(e, 'id')} />
                                </th>
                            )}
                            {visibleColumns.includes('user') && (
                                <th style={{ width: columnWidths.user }}>
                                    <div className="th-content" onClick={() => setSortConfig({ key: 'user', direction: sortConfig.key === 'user' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        USUÁRIO {sortConfig.key === 'user' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </div>
                                    <div className="resizer" onMouseDown={e => startResize(e, 'user')} />
                                </th>
                            )}
                            {visibleColumns.includes('status') && (
                                <th style={{ width: columnWidths.status }}>
                                    <div className="th-content" onClick={() => setSortConfig({ key: 'is_active', direction: sortConfig.key === 'is_active' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        CONTA {sortConfig.key === 'is_active' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </div>
                                    <div className="resizer" onMouseDown={e => startResize(e, 'status')} />
                                </th>
                            )}
                            {visibleColumns.includes('deactivated') && (
                                <th style={{ width: columnWidths.deactivated }}>
                                    <div className="th-content" onClick={() => setSortConfig({ key: 'deactivated_at', direction: sortConfig.key === 'deactivated_at' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        DIAS INATIVO {sortConfig.key === 'deactivated_at' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </div>
                                    <div className="resizer" onMouseDown={e => startResize(e, 'deactivated')} />
                                </th>
                            )}
                            {visibleColumns.includes('connection') && (
                                <th style={{ width: columnWidths.connection }}>
                                    <div className="th-content">
                                        CONEXÃO
                                    </div>
                                    <div className="resizer" onMouseDown={e => startResize(e, 'connection')} />
                                </th>
                            )}
                            {visibleColumns.includes('role') && (
                                <th style={{ width: columnWidths.role }}>
                                    <div className="th-content" onClick={() => setSortConfig({ key: 'role', direction: sortConfig.key === 'role' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        PERMISSÃO {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </div>
                                    <div className="resizer" onMouseDown={e => startResize(e, 'role')} />
                                </th>
                            )}
                            {visibleColumns.includes('workspace') && (
                                <th style={{ width: columnWidths.workspace }}>
                                    <div className="th-content" onClick={() => setSortConfig({ key: 'workspace', direction: sortConfig.key === 'workspace' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        ÁREA DE TRABALHO {sortConfig.key === 'workspace' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </div>
                                    <div className="resizer" onMouseDown={e => startResize(e, 'workspace')} />
                                </th>
                            )}
                            {visibleColumns.includes('team') && (
                                <th style={{ width: columnWidths.team }}>
                                    <div className="th-content" onClick={() => setSortConfig({ key: 'team', direction: sortConfig.key === 'team' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        TIME {sortConfig.key === 'team' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                    </div>
                                    <div className="resizer" onMouseDown={e => startResize(e, 'team')} />
                                </th>
                            )}
                            {visibleColumns.includes('actions') && (
                                <th className="actions-header" style={{ width: columnWidths.actions }}>AÇÕES</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedUsers.map((u) => (
                            <tr key={u.id} className={selectedIds.includes(u.id) ? 'selected' : ''}>
                                {visibleColumns.includes('checkbox') && (
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(u.id)}
                                            onChange={() => setSelectedIds(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                                        />
                                    </td>
                                )}
                                {visibleColumns.includes('id') && (
                                    <td className="id-cell">
                                        <code>#{u.id}</code>
                                    </td>
                                )}
                                {visibleColumns.includes('user') && (
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
                                )}
                                {visibleColumns.includes('status') && (
                                    <td>
                                        <span className={`status-pill ${u.is_active ? 'active' : 'inactive'}`}>
                                            {u.is_active ? 'Ativa' : 'Desativada'}
                                        </span>
                                    </td>
                                )}
                                {visibleColumns.includes('deactivated') && (
                                    <td>
                                        <div className="deactivated-cell">
                                            {u.is_active ? (
                                                <span className="text-muted">-</span>
                                            ) : (
                                                <span className="inactive-duration">
                                                    <Clock size={12} />
                                                    {calculateDaysInactive(u.deactivated_at)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                )}
                                {visibleColumns.includes('connection') && (
                                    <td>
                                        <div className="connection-status">
                                            <div className={`status-dot ${isOnline(u.last_activity) ? 'online' : 'offline'}`}></div>
                                            <span>{isOnline(u.last_activity) ? 'Online' : 'Offline'}</span>
                                        </div>
                                    </td>
                                )}
                                {visibleColumns.includes('role') && (
                                    <td>
                                        <span className={`role-badge ${u.role}`}>
                                            {u.role === 'admin' ? <Shield size={10} /> : null}
                                            {u.role}
                                        </span>
                                    </td>
                                )}
                                {visibleColumns.includes('workspace') && (
                                    <td>
                                        <div className="memberships-list">
                                            {(u.memberships || []).map(m => (
                                                <div key={m.id} className="membership-tag">
                                                    <Building2 size={12} title="Workspace" />
                                                    <span className="ws-name">{m.workspace_name || `WS #${m.workspace_id}`}</span>
                                                    
                                                    {m.team_name && (
                                                        <div className="tag-team">
                                                            <Users size={10} />
                                                            <span>{m.team_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {(!u.memberships || u.memberships.length === 0) && (
                                                <span className="no-memberships text-muted">Sem área de trabalho</span>
                                            )}
                                        </div>
                                    </td>
                                )}
                                {visibleColumns.includes('team') && (
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
                                )}
                                {visibleColumns.includes('actions') && (
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
                                                    <button onClick={() => handleToggleStatus(u.id)} className={u.is_active ? 'danger' : 'success-action'}>
                                                        {u.is_active ? <UserX size={14} /> : <Shield size={14} />}
                                                        {u.is_active ? 'Desativar Conta' : 'Ativar Conta'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} title="Excluir Usuários em Massa">
                <div className="delete-confirm">
                    <AlertCircle size={48} className="danger-icon" />
                    <p>Tem certeza que deseja excluir <strong>{selectedIds.length}</strong> usuários selecionados?</p>
                    <p className="subtext">Esta ação removerá o acesso destes usuários a todas as áreas de trabalho.</p>
                    <div className="actions">
                        <button className="hs-button-secondary" onClick={() => setIsBulkDeleteModalOpen(false)}>Cancelar</button>
                        <button className="hs-button-danger" onClick={handleBulkDelete} disabled={isDeleting}>
                            {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão em Massa'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminUsers;
