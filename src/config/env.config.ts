export const ENV_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  },
  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'aninfpush',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'aninfpush-frontend',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'AninfPush Management',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  facebookAppId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
};

