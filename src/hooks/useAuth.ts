import { useKeycloak } from '@react-keycloak/web';

export const useAuth = () => {
  const { keycloak, initialized } = useKeycloak();

  return {
    isAuthenticated: keycloak.authenticated,
    initialized,
    user: keycloak.tokenParsed,
    token: keycloak.token,
    login: () => keycloak.login(),
    logout: () => {
      console.log('🚪 Logging out...');
      keycloak.logout({ 
        redirectUri: window.location.origin 
      }).then(() => {
        console.log('✅ Logout successful');
        localStorage.clear();
        sessionStorage.clear();
      }).catch((err) => {
        console.error('❌ Logout error:', err);
      });
    },
    updateToken: (minValidity: number = 5) => keycloak.updateToken(minValidity),
    hasRole: (role: string) => keycloak.hasRealmRole(role),
    hasResourceRole: (role: string, resource: string) => keycloak.hasResourceRole(role, resource),
  };
};

