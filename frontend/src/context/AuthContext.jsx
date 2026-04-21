import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('crm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeMembershipId, setActiveMembershipId] = useState(() => {
    return localStorage.getItem('crm_active_membership_id') || null;
  });

  const [workspace, setWorkspace] = useState(() => {
    const savedWorkspace = localStorage.getItem('crm_workspace');
    return savedWorkspace ? JSON.parse(savedWorkspace) : null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Sincronizar usuário com o backend ao carregar
    if (user && !loading) {
      refreshUser();
    }
  }, []);

  useEffect(() => {
    // Se não houver membership ativo mas houver usuário, tenta definir um default
    if (user && !activeMembershipId && user.memberships?.length > 0) {
      const defaultId = user.last_active_membership_id || user.memberships[0].id;
      setActiveMembershipId(defaultId.toString());
      localStorage.setItem('crm_active_membership_id', defaultId.toString());
    }
  }, [user, activeMembershipId]);

  useEffect(() => {
    // Aplicar cores dinâmicas se houver workspace
    if (workspace) {
      document.documentElement.style.setProperty('--hs-blue', workspace.primary_color || '#0091ae');
      document.documentElement.style.setProperty('--hs-orange', workspace.accent_color || '#ff7a59');
    }
  }, [workspace]);

  const refreshWorkspace = async (workspaceId) => {
    const id = workspaceId || (workspace ? workspace.id : null);
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/workspaces/${id}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
        localStorage.setItem('crm_workspace', JSON.stringify(data));
      }
    } catch (e) {
      console.error('Erro ao atualizar workspace branding:', e);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await fetchWithAuth('/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem('crm_user', JSON.stringify(data));
      }
    } catch (e) {
      console.error('Erro ao atualizar dados do usuário:', e);
    }
  };

  const switchMembership = async (membershipId) => {
    if (!user) return;
    setLoading(true);
    try {
      const membership = user.memberships?.find(m => m.id === parseInt(membershipId));
      if (!membership) return;

      // 1. Atualizar Membership no Frontend
      setActiveMembershipId(membershipId.toString());
      localStorage.setItem('crm_active_membership_id', membershipId.toString());

      // 2. Buscar e Atualizar o Workspace correspondente
      const res = await fetch(`${API_BASE_URL}/workspaces/${membership.workspace_id}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
        localStorage.setItem('crm_workspace', JSON.stringify(data));
      }
      
      // 3. Notificar o backend sobre a troca para atualizar last_active_membership_id
      await fetchWithAuth(`/auth/switch-context/${membership.id}`, { method: 'POST' });
      
      // 4. Atualizar o objeto usuário
      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = async (workspaceId) => {
    // Mantido por compatibilidade: pega a primeira membership desse workspace
    const m = user.memberships?.find(m => m.workspace_id === parseInt(workspaceId));
    if (m) await switchMembership(m.id);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Falha ao processar resposta do servidor.');
      }
      
      if (!res.ok) {
        const errorDetail = data.detail;
        const error = new Error(typeof errorDetail === 'string' ? errorDetail : (errorDetail.message || 'Erro ao fazer login'));
        error.detail = errorDetail;
        throw error;
      }
      
      setUser(data.user);
      setWorkspace(data.workspace);
      localStorage.setItem('crm_user', JSON.stringify(data.user));
      if (data.workspace) {
        localStorage.setItem('crm_workspace', JSON.stringify(data.workspace));
      }
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Falha no cadastro.');
      }
      
      if (!res.ok) {
        const errorDetail = data.detail;
        const errorMessage = typeof errorDetail === 'string' 
          ? errorDetail 
          : (Array.isArray(errorDetail) ? errorDetail[0]?.msg : JSON.stringify(errorDetail));
        throw new Error(errorMessage || 'Erro ao registrar');
      }
      
      setUser(data.user);
      setWorkspace(data.workspace);
      localStorage.setItem('crm_user', JSON.stringify(data.user));
      localStorage.setItem('crm_workspace', JSON.stringify(data.workspace));
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao processar solicitação');
      return data;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, new_password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Erro ao redefinir senha');
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setWorkspace(null);
    localStorage.removeItem('crm_user');
    localStorage.removeItem('crm_workspace');
  };

  const fetchWithAuth = async (url, options = {}) => {
    const headers = { 
        ...options.headers,
        'Content-Type': 'application/json'
    };
    
    // Identifica o Usuário e seu papel no workspace ativo via Membership
    if (user && user.id) {
      headers['X-User-ID'] = user.id.toString();
      
      // Busca a membership ativa pelo ID
      const membership = user.memberships?.find(m => m.id.toString() === activeMembershipId?.toString());
      
      if (membership) {
        headers['X-Workspace-ID'] = membership.workspace_id.toString();
        headers['X-User-Role'] = membership.role;
        if (membership.team_id) {
          headers['X-Team-ID'] = membership.team_id.toString();
        }
      } else if (workspace && workspace.id) {
         // Fallback se não houver membership ativo mas houver workspace (alfa)
         headers['X-Workspace-ID'] = workspace.id.toString();
      }
    }

    let finalUrl = url;
    if (url.startsWith('http://localhost:8000')) {
      finalUrl = url.replace('http://localhost:8000', API_BASE_URL);
    } else if (url.startsWith('/')) {
      finalUrl = `${API_BASE_URL}${url}`;
    }

    const response = await fetch(finalUrl, { ...options, headers });
    return response;
  };

  return (
    <AuthContext.Provider value={{ 
        user, workspace, activeMembershipId, login, register, logout, loading, 
        forgotPassword, resetPassword, refreshWorkspace, switchWorkspace, switchMembership, refreshUser,
        isAuthenticated: !!user,
        fetchWithAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
