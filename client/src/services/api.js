import axios from 'axios';
import useAuthStore from '../store/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  // Read from Zustand persisted storage
  const stored = localStorage.getItem('labco-auth');
  if (stored) {
    const { state } = JSON.parse(stored);
    if (state?.accessToken) {
      config.headers.Authorization = `Bearer ${state.accessToken}`;
    }
  }
  // Let FormData set its own Content-Type (preserves multipart boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// On 401 → try to refresh token, then retry
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // Skip token refresh logic for login/register/refresh endpoints themselves
    if (original.url.includes('/auth/login') || original.url.includes('/auth/register') || original.url.includes('/auth/refresh') || original.url.includes('/auth/verify-email') || original.url.includes('/auth/google')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch(Promise.reject.bind(Promise));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.accessToken;

        // Update in-memory Zustand store immediately
        try {
          useAuthStore.getState().updateToken(newToken);
        } catch {}

        // Update persisted store
        const stored = localStorage.getItem('labco-auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.state.accessToken = newToken;
          localStorage.setItem('labco-auth', JSON.stringify(parsed));
        }

        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        // Clear auth and redirect to login
        localStorage.removeItem('labco-auth');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
