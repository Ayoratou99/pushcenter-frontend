import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import axios from 'axios';

import { ENV_CONFIG } from 'src/config/env.config';

// ----------------------------------------------------------------------

export default function FacebookCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // businessId
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      const errorMsg = errorDescription || error;
      console.error('Facebook OAuth error:', errorMsg);
      
      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'facebook_oauth_error',
            error: errorMsg,
          },
          window.location.origin
        );
        window.close();
      } else {
        alert(`Facebook connection failed: ${errorMsg}`);
        navigate('/businesses');
      }
      return;
    }

    if (!code || !state) {
      console.error('Missing code or state parameter');
      
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'facebook_oauth_error',
            error: 'Missing authorization code or business ID',
          },
          window.location.origin
        );
        window.close();
      } else {
        navigate('/businesses');
      }
      return;
    }

    try {
      // Exchange code for access token via backend
      await axios.post(
        `${ENV_CONFIG.apiBaseUrl}/businesses/${state}/facebook-settings/connect`,
        { code },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // Send success message to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'facebook_oauth_success',
            businessId: state,
          },
          window.location.origin
        );
        window.close();
      } else {
        navigate(`/business/${state}`);
      }
    } catch (err: any) {
      console.error('Failed to connect Facebook account:', err);
      const errorMsg = err.response?.data?.message || 'Failed to connect Facebook account';

      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'facebook_oauth_error',
            error: errorMsg,
          },
          window.location.origin
        );
        window.close();
      } else {
        alert(errorMsg);
        navigate('/businesses');
      }
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress size={60} />
      <Typography variant="h6">Connecting to Facebook...</Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we complete the connection
      </Typography>
    </Box>
  );
}

