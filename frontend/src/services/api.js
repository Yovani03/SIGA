import axios from 'axios';

const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.hostname.startsWith('192.168.');
const api = axios.create({
    baseURL: isLocal ? `http://${window.location.hostname}:8000/api/` : '/api/',
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
