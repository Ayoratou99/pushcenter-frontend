import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

export const DashboardPage = lazy(() => import('src/pages/dashboard'));
export const MessagesPage = lazy(() => import('src/pages/messages'));
export const TemplatesPage = lazy(() => import('src/pages/templates'));
export const TemplateCreatePage = lazy(() => import('src/pages/template-create'));
export const TemplateViewPage = lazy(() => import('src/pages/template-view'));
export const TemplateEditPage = lazy(() => import('src/pages/template-edit'));
export const BusinessesPage = lazy(() => import('src/pages/businesses'));
export const BusinessDetailPage = lazy(() => import('src/pages/business-detail'));
export const FacebookCallbackPage = lazy(() => import('src/pages/facebook-callback'));
export const ConnectFacebookPage = lazy(() => import('src/pages/connect-facebook'));
export const ConnectFacebookCallbackPage = lazy(() => import('src/pages/connect-facebook-callback'));
export const TestSimplePage = lazy(() => import('src/pages/test-simple'));
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

export const routesSection: RouteObject[] = [
  // Test pages (no layout required)
  {
    path: 'test-simple',
    element: <TestSimplePage />,
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
  {
    element: (
      <DashboardLayout>
        <Suspense fallback={renderFallback()}>
          <Outlet />
        </Suspense>
      </DashboardLayout>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'messages', element: <MessagesPage /> },
      { path: 'template-create', element: <TemplateCreatePage /> },
      { path: 'templates/:type/:id/view', element: <TemplateViewPage /> },
      { path: 'templates/:type/:id/edit', element: <TemplateEditPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'businesses', element: <BusinessesPage /> },
      { path: 'business/:id', element: <BusinessDetailPage /> },
    ],
  },
  {
    path: '404',
    element: <Page404 />,
  },
  { path: '*', element: <Page404 /> },
];
