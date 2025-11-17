import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { List, ListItem, ListItemText } from '@mui/material';

import axios from 'axios';

import { Iconify } from 'src/components/iconify';

import { ENV_CONFIG } from 'src/config/env.config';

// ----------------------------------------------------------------------

export default function ConnectFacebookPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBusinessInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const loadBusinessInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${ENV_CONFIG.apiBaseUrl}/public/businesses/${businessId}`);
      setBusinessName(response.data.data.name);
    } catch (err: any) {
      console.error('Failed to load business info:', err);
      setError('Business not found or connection link is invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    setConnecting(true);

    // Facebook OAuth URL with required permissions
    const redirectUri = `${window.location.origin}/connect-facebook-callback/${businessId}`;
    const scope = 'whatsapp_business_messaging,whatsapp_business_management,business_management';
    const facebookAppId = ENV_CONFIG.facebookAppId || 'YOUR_FACEBOOK_APP_ID';

    const authUrl =
      `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${facebookAppId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `state=${businessId}`;

    // Redirect to Facebook OAuth
    window.location.href = authUrl;
  };

  if (loading) {
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
        <Typography variant="h6">Loading business information...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
        sx={{ bgcolor: 'background.default', p: 3 }}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Go to Home
        </Button>
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
        <Stack spacing={3} alignItems="center">
          {/* WhatsApp Badge */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              bgcolor: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
              W
            </Typography>
          </Box>

          <Typography variant="h4" align="center">
            Connect Facebook Business Manager
          </Typography>

          <Alert severity="info" sx={{ width: '100%' }}>
            <Typography variant="body2">
              You are about to connect your Facebook Business Manager account to <strong>{businessName}</strong> to
              enable WhatsApp messaging capabilities.
            </Typography>
          </Alert>

          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>
              What will happen:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="✓ Secure OAuth Connection"
                  secondary="Your credentials are never shared with us"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="✓ WhatsApp Business API Access"
                  secondary="Send and receive WhatsApp messages"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="✓ Business Account Management"
                  secondary="Manage WhatsApp Business settings and templates"
                />
              </ListItem>
            </List>
          </Box>

          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Required Permissions:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              <Alert severity="warning" sx={{ flex: 1, minWidth: '250px' }}>
                <Typography variant="caption">
                  • whatsapp_business_messaging
                  <br />
                  • whatsapp_business_management
                  <br />• business_management
                </Typography>
              </Alert>
            </Stack>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<Iconify icon="solar:user-bold" />}
            onClick={handleConnect}
            disabled={connecting}
            sx={{
              bgcolor: '#1877F2',
              '&:hover': { bgcolor: '#1565C0' },
              py: 1.5,
            }}
          >
            {connecting ? 'Redirecting to Facebook...' : 'Connect with Facebook'}
          </Button>

          <Typography variant="caption" color="text.secondary" align="center">
            By connecting, you authorize {businessName} to send WhatsApp messages through your Facebook Business
            Manager account.
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
}

