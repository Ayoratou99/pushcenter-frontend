import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import axios from 'axios';

import { Iconify } from 'src/components/iconify';

import { ENV_CONFIG } from 'src/config/env.config';

// ----------------------------------------------------------------------

export default function ConnectFacebookCallbackPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      const errorMsg = errorDescription || error;
      console.error('Facebook OAuth error:', errorMsg);
      setStatus('error');
      setMessage(errorMsg);
      return;
    }

    if (!code || !businessId) {
      console.error('Missing code or businessId parameter');
      setStatus('error');
      setMessage('Missing authorization code or business ID');
      return;
    }

    try {
      // Exchange code for access token via backend (public endpoint)
      await axios.post(
        `${ENV_CONFIG.apiBaseUrl}/public/businesses/${businessId}/facebook-settings/connect`,
        { code }
      );

      setStatus('success');
      setMessage('Your Facebook Business Manager account has been successfully connected!');
    } catch (err: any) {
      console.error('Failed to connect Facebook account:', err);
      const errorMsg = err.response?.data?.message || 'Failed to connect Facebook account';
      setStatus('error');
      setMessage(errorMsg);
    }
  };

  if (status === 'loading') {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
        sx={{ bgcolor: 'background.default' }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6">Connecting to Facebook...</Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we complete the connection
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: 'background.default', p: 3 }}
    >
      <Card sx={{ maxWidth: 600, width: '100%', p: 4 }}>
        {status === 'success' ? (
          <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'success.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="solar:check-circle-bold" width={48} sx={{ color: 'white' }} />
            </Box>

            <Typography variant="h4" align="center">
              Connection Successful!
            </Typography>

            <Alert severity="success" sx={{ width: '100%' }}>
              <AlertTitle>Facebook Business Manager Connected</AlertTitle>
              {message}
            </Alert>

            <Typography variant="body2" color="text.secondary" align="center">
              Your Facebook Business Manager account is now connected. You can now send and receive WhatsApp messages
              through our platform.
            </Typography>

            <Button variant="contained" size="large" onClick={() => navigate('/')} fullWidth>
              Go to Home
            </Button>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="solar:close-circle-bold" width={48} sx={{ color: 'white' }} />
            </Box>

            <Typography variant="h4" align="center">
              Connection Failed
            </Typography>

            <Alert severity="error" sx={{ width: '100%' }}>
              <AlertTitle>Error</AlertTitle>
              {message}
            </Alert>

            <Typography variant="body2" color="text.secondary" align="center">
              Please try again or contact support if the problem persists.
            </Typography>

            <Box display="flex" gap={2} width="100%">
              <Button variant="outlined" onClick={() => navigate('/')} fullWidth>
                Go to Home
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate(`/connect-facebook/${businessId}`)}
                fullWidth
              >
                Try Again
              </Button>
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
}

