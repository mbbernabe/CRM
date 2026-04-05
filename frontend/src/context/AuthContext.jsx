import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('crm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [workspace, setWorkspace] = useState(() => {
    const savedWorkspace = localStorage.getItem('crm_workspace');
    return savedWorkspace ? JSON.parse(savedWorkspace) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Aplicar cores dinâmicas se houver workspace
    if (workspace) {
      document.documentElement.style.setProperty('--hs-blue', workspace.primary_color || '#0091ae');
      document.documentElement.style.setProperty('--hs-orange', workspace.accent_color || '#ff7a59');
    } else if (user && !loading) {
      // Se temos usuário mas não temos os dados do workspace (ex: refresh), buscamos
      refreshWorkspace();
    }
  }, [workspace, user]);

  const refreshWorkspace = async () => {
    if (!user || !user.workspace_id) return;
    try {
      const res = await fetch(`http://localhost:8000/workspaces/${user.workspace_id}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
        localStorage.setItem('crm_workspace', JSON.stringify(data));
      }
    } catch (e) {
      console.error('Erro ao atualizar workspace branding:', e);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Falha ao processar resposta do servidor. Verifique se o backend está ativo.');
      }
      
      if (!res.ok) throw new Error(data.detail || 'Erro ao fazer login');
      
      setUser(data.user);
      setWorkspace(data.workspace);
      localStorage.setItem('crm_user', JSON.stringify(data.user));
      localStorage.setItem('crm_workspace', JSON.stringify(data.workspace));
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Falha no cadastro: Servidor indisponível ou erro inesperado.');
      }
      
      if (!res.ok) throw new Error(data.detail || 'Erro ao registrar');
      
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
      const res = await fetch('http://localhost:8000/auth/forgot-password', {
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
      const res = await fetch('http://localhost:8000/auth/reset-password', {
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
    
    if (user && user.workspace_id) {
      headers['X-Workspace-ID'] = user.workspace_id.toString();
    }

    if (user && user.team_id) {
      headers['X-Team-ID'] = user.team_id.toString();
    }
    
    if (user && user.role) {
      headers['X-User-Role'] = user.role;
    }

    const response = await fetch(url, { ...options, headers });
    return response;
  };

  return (
    <AuthContext.Provider value={{ 
        user, workspace, login, register, logout, loading, 
        forgotPassword, resetPassword, refreshWorkspace,
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
