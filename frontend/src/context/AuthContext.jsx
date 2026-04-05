import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('crm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

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
      localStorage.setItem('crm_user', JSON.stringify(data.user));
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
      localStorage.setItem('crm_user', JSON.stringify(data.user));
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
    localStorage.removeItem('crm_user');
  };

  const fetchWithAuth = async (url, options = {}) => {
    const headers = { 
        ...options.headers,
        'Content-Type': 'application/json'
    };
    
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
        user, login, register, logout, loading, 
        forgotPassword, resetPassword,
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
