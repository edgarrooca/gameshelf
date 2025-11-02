import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { registerUser, loginUser, getProfile } from '../services/api.service';
import { clearCache } from '../services/cache.service';

// Contexto de autenticación
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

// Provider de autenticación
export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar sesión al iniciar
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');

    async function cargarUsuario() {
      if (tokenGuardado) {
        try {
          const response = await getProfile();
          const usuarioActual = response.data.usuario;

          localStorage.setItem('usuario', JSON.stringify(usuarioActual));
          setUsuario(usuarioActual);
          setToken(tokenGuardado);
        } catch (error) {
          console.error('Token inválido. Limpiando sesión.', error);
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          setToken(null);
          setUsuario(null);
        }
      }
      setCargando(false);
    }

    cargarUsuario();
  }, []);

  // Registro
  const registro = useCallback(async (username, email, password, passwordConfirm) => {
    try {
      setError(null);
      const response = await registerUser({ username, email, password, passwordConfirm });
      const { token: nuevoToken, usuario: nuevoUsuario } = response.data;

      localStorage.setItem('token', nuevoToken);
      localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
      setToken(nuevoToken);
      setUsuario(nuevoUsuario);

      return { success: true, usuario: nuevoUsuario };
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error en registro';
      setError(mensaje);
      return { success: false, error: mensaje };
    }
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    try {
      setError(null);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en login');
      }

      const { token: nuevoToken, usuario: nuevoUsuario } = data;

      // Limpiar cache si es un usuario diferente
      const usuarioActual = JSON.parse(localStorage.getItem('usuario') || 'null');
      if (usuarioActual && usuarioActual._id !== nuevoUsuario._id) {
        console.log('Usuario cambió, limpiando cache...');
        clearCache();
      }

      localStorage.setItem('token', nuevoToken);
      localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
      setToken(nuevoToken);
      setUsuario(nuevoUsuario);

      return { success: true, usuario: nuevoUsuario };
    } catch (err) {
      console.error('Login falló:', err);
      const mensaje = err.message || 'Error en login';
      setError(mensaje);
      return { success: false, error: mensaje };
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    console.log('Cerrando sesión, limpiando cache...');
    clearCache();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
    setError(null);
  }, []);

  // Obtener perfil
  const obtenerPerfil = useCallback(async () => {
    try {
      setError(null);
      const response = await getProfile();
      const nuevoUsuario = response.data.usuario;

      localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
      setUsuario(nuevoUsuario);

      return { success: true, usuario: nuevoUsuario };
    } catch (err) {
      const mensaje = err.response?.data?.message || 'Error al obtener perfil';
      setError(mensaje);
      return { success: false, error: mensaje };
    }
  }, []);

  const estaAutenticado = !!token && !!usuario;

  const value = {
    usuario,
    token,
    cargando,
    error,
    estaAutenticado,
    registro,
    login,
    logout,
    obtenerPerfil,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
