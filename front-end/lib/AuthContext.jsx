import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoadingAuth(true);
        const token = localStorage.getItem('flora_token');
        const storedUser = localStorage.getItem('flora_user');

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setSession({ token, user: parsedUser });
          setIsAuthenticated(true);

          // Valida no backend de forma transparente
          fetch('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => {
            if (!res.ok) {
              logout();
            }
          }).catch(() => {});
        } else {
          setUser(null);
          setSession(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Erro ao verificar sessão local:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const loginWithPassword = async (email, password) => {
    try {
      setAuthError(null);
      setIsLoadingAuth(true);

      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao realizar login');
      }

      localStorage.setItem('flora_token', data.token);
      localStorage.setItem('flora_user', JSON.stringify(data.user));

      setUser(data.user);
      setSession({ token: data.token, user: data.user });
      setIsAuthenticated(true);

      return { success: true, data };
    } catch (error) {
      setAuthError({
        type: 'login_failed',
        message: error.message || 'Falha ao realizar login'
      });
      return { success: false, error };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    try {
      setAuthError(null);
      setIsLoadingAuth(true);

      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: metadata.nome || 'Usuário Flora',
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao registrar usuário');
      }

      return { success: true, data };
    } catch (error) {
      setAuthError({
        type: 'signup_failed',
        message: error.message || 'Falha ao registrar usuário'
      });
      return { success: false, error };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoadingAuth(true);
      localStorage.removeItem('flora_token');
      localStorage.removeItem('flora_user');
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        isLoadingAuth,
        authError,
        loginWithPassword,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
