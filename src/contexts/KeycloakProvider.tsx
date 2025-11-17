import type { ReactNode } from 'react';

import Keycloak from 'keycloak-js';
import { useState, useEffect, useMemo } from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';

import { setKeycloak } from '../config/keycloak.config';
import { ENV_CONFIG } from '../config/env.config';

interface KeycloakProviderProps {
  children: ReactNode;
}

const KeycloakProvider = ({ children }: KeycloakProviderProps) => {
  // Create a new Keycloak instance for each mount to avoid "already initialized" error
  const keycloak = useMemo(() => {
    console.log('🔧 Creating new Keycloak instance');
    const instance = new Keycloak({
      url: ENV_CONFIG.keycloak.url,
      realm: ENV_CONFIG.keycloak.realm,
      clientId: ENV_CONFIG.keycloak.clientId,
    });
    // Set the global instance so api.client.ts can use it
    setKeycloak(instance);
    return instance;
  }, []);

  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initTimeout, setInitTimeout] = useState(false);

  const initOptions = {
    onLoad: 'check-sso' as const,
    checkLoginIframe: false,
    pkceMethod: 'S256' as const,
  };

  // Set timeout for initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        console.error('⏱️ Keycloak initialization timeout (10s)');
        setInitTimeout(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [isInitialized]);

  const handleTokens = (tokens: any) => {
    if (tokens.token) {
      console.log('✅ Keycloak token received');
      localStorage.setItem('keycloak-token', tokens.token);
    }
  };

  const handleEvent = (event: string, error?: any) => {
    console.log('🔐 Keycloak event:', event);
    
    if (event === 'onReady') {
      setIsInitialized(true);
      setInitError(null);
      console.log('✅ Keycloak initialized, authenticated:', keycloak.authenticated);
    }
    
    if (event === 'onAuthSuccess') {
      console.log('✅ Authentication successful');
      setIsInitialized(true);
      setInitError(null);
    }
    
    if (event === 'onAuthError') {
      console.error('❌ Authentication error:', error);
      setInitError(error?.error_description || 'Authentication failed');
    }

    if (event === 'onInitError') {
      console.error('❌ Keycloak initialization error:', error);
      setInitError('Failed to connect to Keycloak server');
      setIsInitialized(true); // Set to true to stop loading
    }

    if (event === 'onAuthLogout') {
      console.log('👋 Logged out');
      localStorage.removeItem('keycloak-token');
    }
  };

  // Trigger login if not authenticated after initialization
  useEffect(() => {
    if (isInitialized && !keycloak.authenticated && !initError) {
      console.log('🔓 Not authenticated, redirecting to login...');
      keycloak.login({
        redirectUri: window.location.origin,
      }).catch((err) => {
        console.error('❌ Login failed:', err);
        setInitError('Login failed: ' + err.message);
      });
    }
  }, [isInitialized, initError]);

  // Show error screen if initialization failed
  if (initError || initTimeout) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          padding: '2rem',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ fontSize: '3rem' }}>❌</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d32f2f' }}>
          Keycloak Connection Failed
        </div>
        <div style={{ fontSize: '1rem', color: '#666', maxWidth: '600px' }}>
          {initError || 'Connection timeout. Keycloak server might be unreachable.'}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#999', marginTop: '1rem' }}>
          <strong>Check:</strong>
          <ul style={{ textAlign: 'left', marginTop: '0.5rem' }}>
            <li>Is Keycloak running? (http://localhost:8080)</li>
            <li>Check VITE_KEYCLOAK_URL in .env file</li>
            <li>Check VITE_KEYCLOAK_REALM and VITE_KEYCLOAK_CLIENT_ID</li>
            <li>Check browser console (F12) for errors</li>
          </ul>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Retry Connection
        </button>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/test-simple';
          }}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Go to Test Page (No Auth)
        </button>
      </div>
    );
  }

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={initOptions}
      onTokens={handleTokens}
      onEvent={handleEvent}
      LoadingComponent={
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '1.5rem',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '3rem' }}>🔐</div>
          <div>Initializing authentication...</div>
          <div style={{ fontSize: '1rem', color: '#666' }}>
            {isInitialized ? 'Checking login status...' : 'Connecting to Keycloak...'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '1rem' }}>
            If this takes more than 10 seconds, check Keycloak is running
          </div>
        </div>
      }
    >
      {children}
    </ReactKeycloakProvider>
  );
};

export default KeycloakProvider;

