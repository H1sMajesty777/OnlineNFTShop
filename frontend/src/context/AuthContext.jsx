import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API = 'http://localhost:3000/api';

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

    const apiClient = axios.create({ baseURL: API });

    // Интерсептор для добавления токена
    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Интерсептор для обновления токена
    apiClient.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    try {
                        const res = await axios.post(`${API}/auth/refresh`, { refreshToken });
                        localStorage.setItem('accessToken', res.data.accessToken);
                        localStorage.setItem('refreshToken', res.data.refreshToken);
                        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
                        return apiClient(originalRequest);
                    } catch (err) {
                        logout();
                    }
                } else {
                    logout();
                }
            }
            return Promise.reject(error);
        }
    );

    const login = async (email, password) => {
        const res = await apiClient.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        setAccessToken(res.data.accessToken);
        await loadUser();
        return res.data;
    };

    const register = async (email, password, first_name, last_name) => {
        const res = await apiClient.post('/auth/register', { email, password, first_name, last_name });
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setAccessToken(null);
        setUser(null);
    };

    const loadUser = async () => {
        try {
            const res = await apiClient.get('/auth/me');
            setUser(res.data);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accessToken) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, [accessToken]);

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        apiClient,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}