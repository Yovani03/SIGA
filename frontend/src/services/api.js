import axios from 'axios';

const api = axios.create({
    baseURL: window.location.hostname === 'localhost' ? 'http://localhost:8000/api/' : '/api/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token de autenticación si existe
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
