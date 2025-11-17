import Keycloak from 'keycloak-js';

import { ENV_CONFIG } from './env.config';

const keycloakConfig = {
  url: ENV_CONFIG.keycloak.url,
  realm: ENV_CONFIG.keycloak.realm,
  clientId: ENV_CONFIG.keycloak.clientId,
};

// Global keycloak instance that will be set by the KeycloakProvider
let keycloakInstance: Keycloak | null = null;

// Getter function to access the current instance
export const getKeycloak = (): Keycloak | null => keycloakInstance;

// Setter function to be called by KeycloakProvider when instance is created
export const setKeycloak = (instance: Keycloak): void => {
  keycloakInstance = instance;
};

// Create initial instance for backward compatibility
keycloakInstance = new Keycloak(keycloakConfig);

// Export singleton for backward compatibility
export default keycloakInstance;

