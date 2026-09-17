/**
 * Where the JWT pair lives between page loads.
 *
 * The access token is short lived and refreshed transparently by the axios
 * interceptor; the refresh token is the one that keeps the session alive.
 */
const ACCESS_TOKEN_KEY = 'aninfpush.access_token';
const REFRESH_TOKEN_KEY = 'aninfpush.refresh_token';

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  refresh_expires_in?: number;
  token_type?: string;
};

export const tokenStorage = {
  getAccessToken: (): string | null => {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getRefreshToken: (): string | null => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  save: (tokens: AuthTokens): void => {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    } catch {
      // Private browsing or blocked storage: the session simply lasts one page.
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      /* nothing to clean up */
    }
  },
};
