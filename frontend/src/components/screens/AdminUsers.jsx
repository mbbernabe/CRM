import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Shield, Mail, Calendar, Hash, RefreshCw, AlertCircle, ExternalLink, UserCheck, UserX } from 'lucide-react';

const AdminUsers = () => {
    const { fetchWithAuth } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="animate-spin text-blue-600 mb-4" size={32} />
            <span className="text-gray-500 font-medium">Sincronizando base de usuários...</span>
        </div>
    );

    if (error) return (
        <div className="p-12 text-center bg-red-50 rounded-xl border border-red-100 mx-8 mt-8">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Falha de Autorização</h3>
            <p className="text-red-700 max-w-md mx-auto">{error}</p>
            <button onClick={fetchAllUsers} className="mt-6 hs-button-secondary bg-white">Tentar Novamente</button>
        </div>
    );

    return (
        <div className="p-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Shield className="text-blue-600" size={24} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Administração Global
                        </h1>
                    </div>
                    <p className="text-gray-500 text-sm">Controle de acesso e visibilidade total de usuários e tenants.</p>
                </div>
                
                <div className="flex gap-3">
                    <div className="bg-white px-5 py-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-gray-900 leading-none">{users.length}</span>
                            <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Total de Contas</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-[var(--hs-shadow-md)] border border-[var(--hs-border-light)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--hs-bg-main)] border-b border-[var(--hs-border-light)]">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Permissão</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Time (Tenant)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--hs-border-light)]">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-[var(--hs-sidebar-hover)] transition-all group">
                                    <td className="px-6 py-5 text-sm text-gray-400 font-mono">
                                        <span className="bg-gray-50 px-2 py-0.5 rounded">#{u.id}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{u.name}</span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                                    <Mail size={12} className="text-gray-400" /> {u.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                                u.role === 'admin' 
                                                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {u.team_id ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                                                <span className="text-sm font-medium text-gray-700">Team #{u.team_id}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs italic text-gray-400">Sem time</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-400 hover:text-blue-600 transition-all border border-transparent hover:border-gray-100" title="Ver Detalhes">
                                                <ExternalLink size={16} />
                                            </button>
                                            <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-400 hover:text-red-600 transition-all border border-transparent hover:border-gray-100" title="Desativar">
                                                <UserX size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
