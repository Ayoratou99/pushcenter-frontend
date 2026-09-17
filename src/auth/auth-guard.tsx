import type { ReactNode } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuthContext } from './auth-context';

// ----------------------------------------------------------------------

function FullPageLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

/**
 * Everything behind the dashboard requires a signed-in user whose Google
 * Authenticator enrolment is complete.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated, needsTwoFactorSetup } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  if (needsTwoFactorSetup) {
    return <Navigate to="/two-factor-setup" replace />;
  }

  return <>{children}</>;
}

/**
 * Sign-in pages: send an already authenticated user back to the dashboard.
 */
export function GuestGuard({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated, needsTwoFactorSetup } = useAuthContext();

  if (loading) {
    return <FullPageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to={needsTwoFactorSetup ? '/two-factor-setup' : '/'} replace />;
  }

  return <>{children}</>;
}

/**
 * Admin-only areas (user management).
 */
export function RoleGuard({ children, roles }: { children: ReactNode; roles: string[] }) {
  const { loading, user } = useAuthContext();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
