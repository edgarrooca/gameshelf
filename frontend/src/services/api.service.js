import axios from 'axios';
import { getCachedData, setCachedData } from './cache.service';

// Cliente HTTP con configuración
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Interceptor para agregar token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// Operaciones CRUD de juegos
export const getAllGames = async () => {
  const cached = getCachedData('allGames');
  if (cached) {
    return { data: cached };
  }

  const response = await apiClient.get('/games');
  setCachedData('allGames', response.data);
  return response;
};

export const getMyGames = async () => {
  const cached = getCachedData('myGames');
  if (cached) {
    return { data: cached };
  }

  const response = await apiClient.get('/games/my');
  setCachedData('myGames', response.data);
  return response;
};

export const getGame = (id) => apiClient.get(`/games/${id}`);
export const createGame = (gameData) => apiClient.post('/games', gameData);
export const updateGame = (id, gameData) => apiClient.put(`/games/${id}`, gameData);
export const deleteGame = (id) => apiClient.delete(`/games/${id}`);

export const searchRAWGGames = async (query) => {
  const cacheKey = `search_${query}`;
  const cached = getCachedData(cacheKey);
  if (cached) return { data: cached };

  const response = await apiClient.get(`/games/search/${query}`);
  setCachedData(cacheKey, response.data);
  return response;
};

export const getPopularGames = async () => {
  const cached = getCachedData('popularGames');
  if (cached) return { data: cached };

  const response = await apiClient.get('/games/popular');
  setCachedData('popularGames', response.data);
  return response;
};

export const getExploreGames = async (ordering = '-rating', pageSize = 10, page = 1) => {
  const cacheKey = `exploreGames_${ordering}_${pageSize}_${page}`;
  const cached = getCachedData(cacheKey);
  if (cached) return { data: cached };

  const response = await apiClient.get(`/games/explore?ordering=${ordering}&pageSize=${pageSize}&page=${page}`);
  setCachedData(cacheKey, response.data);
  return response;
};

// Auth functions
export const registerUser = (userData) => apiClient.post('/auth/register', userData);

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response;
};

export const getProfile = () => apiClient.get('/auth/me');
