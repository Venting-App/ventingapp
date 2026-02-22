import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.accessToken;
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 and 413 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("error", error)
    if (error.response?.status === 413) {
      message.error('File is too large. Please upload a smaller file.');
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const authStore = useAuthStore();
    
    // If the error status is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = authStore.refreshToken;
        
        if (!refreshToken) {
          // No refresh token available, log the user out
          await authStore.logout();
          return Promise.reject(error);
        }
        
        // Make request to refresh the token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/account/refresh/`,
          { refresh: refreshToken }
        );
        
        const { access } = response.data;
        
        // Update the stored tokens
        authStore.setAccessToken(access);
        
        // Update the original request with the new token
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        
        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log the user out
        console.error('Token refresh failed:', refreshError);
        await authStore.logout();
        return Promise.reject(refreshError);
      }
    }
    
    // For other errors, just reject with the error
    return Promise.reject(error);
  }
);

export default api;
