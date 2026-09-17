import type { AxiosError, AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { tokenStorage } from '../auth/tokens';
import { ENV_CONFIG } from '../config/env.config';

// ----------------------------------------------------------------------

const apiClient: AxiosInstance = axios.create({
  baseURL: ENV_CONFIG.api.baseUrl,
  timeout: ENV_CONFIG.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Called when the refresh token is rejected, so the auth provider can drop the
 * session and send the user back to the sign-in page.
 */
let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

// Attach the access token to every call.
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * A single refresh is shared by every request that got a 401 at the same time,
 * so a burst of parallel calls does not burn several refresh tokens.
 */
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // A bare axios call: the interceptors must not run on the refresh itself.
  const response = await axios.post(
    `${ENV_CONFIG.api.baseUrl}/auth/refresh`,
    { refresh_token: refreshToken },
    { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
  );

  const tokens = response.data?.data;

  if (!tokens?.access_token) {
    throw new Error('Malformed refresh response');
  }

  tokenStorage.save(tokens);

  return tokens.access_token;
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        refreshPromise = refreshPromise ?? refreshAccessToken().finally(() => {
          refreshPromise = null;
        });

        const accessToken = await refreshPromise;

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${accessToken}`,
        };

        return await apiClient(originalRequest);
      } catch (refreshError) {
        tokenStorage.clear();
        onSessionExpired?.();

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// ----------------------------------------------------------------------

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
