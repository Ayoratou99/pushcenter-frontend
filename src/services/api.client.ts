import type { AxiosError, AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { getKeycloak } from '../config/keycloak.config';
import { ENV_CONFIG } from '../config/env.config';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: ENV_CONFIG.api.baseUrl,
  timeout: ENV_CONFIG.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    try {
      const keycloak = getKeycloak();
      if (keycloak?.token) {
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      }
    } catch (error) {
      console.warn('Failed to get Keycloak token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const keycloak = getKeycloak();
        if (!keycloak) {
          throw new Error('Keycloak not initialized');
        }

        await keycloak.updateToken(30);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login if token refresh fails
        const keycloak = getKeycloak();
        if (keycloak?.login) {
          keycloak.login();
        } else {
          // Fallback: redirect to home page
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Helper functions
export const get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
  apiClient.get<T>(url, config);

export const post = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => apiClient.post<T>(url, data, config);

export const put = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => apiClient.put<T>(url, data, config);

export const patch = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => apiClient.patch<T>(url, data, config);

export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
  apiClient.delete<T>(url, config);

