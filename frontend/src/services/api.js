import axios from 'axios';

const api = axios.create({
    baseURL: ['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:8000/api/' : '/api/',
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
