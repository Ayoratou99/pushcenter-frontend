import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';

import { ENV_CONFIG } from 'src/config/env.config';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * The backend's Swagger UI, embedded in the console.
 *
 * The API and the console are served from different origins, so the backend
 * allows this one to frame the documentation (Content-Security-Policy
 * frame-ancestors, driven by FRONTEND_URL on the API side).
 */
export function DocumentationView() {
  const docsUrl = ENV_CONFIG.apiDocsUrl;
  const frameRef = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleReload = useCallback(() => {
    setLoading(true);

    if (frameRef.current) {
      // Reassigning src reloads it without touching the parent history.
      frameRef.current.src = docsUrl;
    }
  }, [docsUrl]);

  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(ENV_CONFIG.apiBaseUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  if (!docsUrl) {
    return (
      <DashboardContent>
        <Typography variant="h4" sx={{ mb: 3 }}>
          API documentation
        </Typography>

        <Alert severity="warning">
          <AlertTitle>Documentation URL not configured</AlertTitle>
          Set <code>VITE_API_DOCS_URL</code> (or a valid <code>VITE_API_BASE_URL</code>, from which
          it is derived) and restart the console.
        </Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth={false} sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">API documentation</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Served by the API itself, so it always matches the deployed version.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title={copied ? 'Copied' : `Copy the API base URL (${ENV_CONFIG.apiBaseUrl})`}>
            <IconButton onClick={handleCopy}>
              <Iconify icon={copied ? 'solar:check-circle-bold' : 'solar:copy-bold'} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reload">
            <IconButton onClick={handleReload}>
              <Iconify icon="solar:restart-bold" />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<Iconify icon="solar:square-top-down-bold" />}
          >
            Open in a new tab
          </Button>
        </Stack>
      </Box>

      <Card sx={{ position: 'relative', flex: 1, minHeight: 640, overflow: 'hidden' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              bgcolor: 'background.paper',
              zIndex: 1,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Loading the documentation…
            </Typography>
          </Box>
        )}

        <Box
          ref={frameRef}
          component="iframe"
          src={docsUrl}
          title="API documentation"
          onLoad={() => setLoading(false)}
          sx={{ width: 1, height: 1, minHeight: 640, border: 0, display: 'block' }}
        />
      </Card>

      <Alert severity="info" sx={{ mt: 2 }}>
        Nothing shows up? The API must allow this console to embed it: set{' '}
        <code>FRONTEND_URL</code> in the backend environment, then restart it. The{' '}
        <strong>Open in a new tab</strong> button always works.
      </Alert>
    </DashboardContent>
  );
}
