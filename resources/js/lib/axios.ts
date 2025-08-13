import axios from 'axios';

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}`,
    withCredentials: true, // 🔑 send Laravel's session cookie
});

// Optional: automatically handle 401 by redirecting to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Redirect to login page
            window.location.href = '/customer-login';
        }
        return Promise.reject(error);
    },
);

export default api;
