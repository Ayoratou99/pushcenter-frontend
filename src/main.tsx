import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router';

import App from './app';
import { routesSection } from './routes/sections';
import { ErrorBoundary } from './routes/components';
import KeycloakProvider from './contexts/KeycloakProvider';

// ----------------------------------------------------------------------

const router = createBrowserRouter([
  {
    Component: () => (
      <App>
        <Outlet />
      </App>
    ),
    errorElement: <ErrorBoundary />,
    children: routesSection,
  },
]);

const root = createRoot(document.getElementById('root')!);

// Temporarily disable StrictMode to avoid Keycloak double initialization error
// StrictMode in development mounts components twice which causes "instance can only be initialized once"
root.render(
  <KeycloakProvider>
    <RouterProvider router={router} />
  </KeycloakProvider>
);
