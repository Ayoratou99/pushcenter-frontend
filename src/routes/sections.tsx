import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { Outlet, Navigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

import { useAuthContext } from 'src/auth/auth-context';
import { AuthGuard, RoleGuard, GuestGuard } from 'src/auth/auth-guard';

// ----------------------------------------------------------------------

export const LandingPage = lazy(() => import('src/pages/landing'));
export const DashboardPage = lazy(() => import('src/pages/dashboard'));
export const MessagesPage = lazy(() => import('src/pages/messages'));
export const TemplatesPage = lazy(() => import('src/pages/templates'));
export const TemplateCreatePage = lazy(() => import('src/pages/template-create'));
export const TemplateViewPage = lazy(() => import('src/pages/template-view'));
export const TemplateEditPage = lazy(() => import('src/pages/template-edit'));
export const BusinessesPage = lazy(() => import('src/pages/businesses'));
export const BusinessDetailPage = lazy(() => import('src/pages/business-detail'));
export const UsersPage = lazy(() => import('src/pages/users'));
export const ProfilePage = lazy(() => import('src/pages/profile'));
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const TwoFactorSetupPage = lazy(() => import('src/pages/two-factor-setup'));
export const FacebookCallbackPage = lazy(() => import('src/pages/facebook-callback'));
export const ConnectFacebookPage = lazy(() => import('src/pages/connect-facebook'));
export const ConnectFacebookCallbackPage = lazy(() => import('src/pages/connect-facebook-callback'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

/**
 * `/` stays a single entry point: visitors get the landing page, signed-in users
 * are sent to the dashboard. Existing links to `/` therefore keep working.
 */
function RootRoute() {
  const { loading, isAuthenticated, needsTwoFactorSetup } = useAuthContext();

  if (loading) {
    return renderFallback();
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={renderFallback()}>
        <LandingPage />
      </Suspense>
    );
  }

  return <Navigate to={needsTwoFactorSetup ? '/two-factor-setup' : '/dashboard'} replace />;
}

export const routesSection: RouteObject[] = [
  {
    index: true,
    element: <RootRoute />,
  },
  /* -------------------------------- Public ------------------------------- */
  {
    path: 'sign-in',
    element: (
      <GuestGuard>
        <AuthLayout>
          <Suspense fallback={renderFallback()}>
            <SignInPage />
          </Suspense>
        </AuthLayout>
      </GuestGuard>
    ),
  },
  {
    // Reached right after a first sign-in: the user is authenticated but has
    // to finish the mandatory Google Authenticator enrolment.
    path: 'two-factor-setup',
    element: (
      <AuthLayout cssVars={{ '--layout-auth-content-width': '680px' }}>
        <Suspense fallback={renderFallback()}>
          <TwoFactorSetupPage />
        </Suspense>
      </AuthLayout>
    ),
  },
  // Facebook OAuth callback (no layout required)
  {
    path: 'facebook-callback',
    element: <FacebookCallbackPage />,
  },
  // Public Facebook connection pages (no authentication required)
  {
    path: 'connect-facebook/:businessId',
    element: <ConnectFacebookPage />,
  },
  {
    path: 'connect-facebook-callback/:businessId',
    element: <ConnectFacebookCallbackPage />,
  },

  /* ------------------------------ Dashboard ------------------------------ */
  {
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'messages', element: <MessagesPage /> },
      { path: 'template-create', element: <TemplateCreatePage /> },
      { path: 'templates/:type/:id/view', element: <TemplateViewPage /> },
      { path: 'templates/:type/:id/edit', element: <TemplateEditPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'businesses', element: <BusinessesPage /> },
      { path: 'business/:id', element: <BusinessDetailPage /> },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'users',
        element: (
          <RoleGuard roles={['admin']}>
            <UsersPage />
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: '404',
    element: <Page404 />,
  },
  { path: '*', element: <Page404 /> },
];
