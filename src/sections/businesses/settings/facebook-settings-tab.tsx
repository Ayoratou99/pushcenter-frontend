import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import { Chip, Divider, List, ListItem, ListItemText } from '@mui/material';

import axios from 'axios';

import { Iconify } from 'src/components/iconify';

import { ENV_CONFIG } from 'src/config/env.config';

// ----------------------------------------------------------------------

interface FacebookSetting {
  id: number;
  meta_business_id?: string;
  app_id: string;
  waba_id?: string;
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  connected_at?: string;
  last_verified_at?: string;
  token_expires_at?: string;
  granted_permissions?: string[];
  required_permissions?: string[];
  is_throttled: boolean;
  usage_percentage?: number;
  webhook_subscribed: boolean;
  last_error?: string;
  user_info?: {
    name?: string;
    email?: string;
  };
}

interface FacebookSettingsTabProps {
  businessId: number;
}

export function FacebookSettingsTab({ businessId }: FacebookSettingsTabProps) {
  const [settings, setSettings] = useState<FacebookSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadSettings();
    // Listen for OAuth callback
    window.addEventListener('message', handleOAuthCallback);
    return () => {
      window.removeEventListener('message', handleOAuthCallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${ENV_CONFIG.apiBaseUrl}/businesses/${businessId}/facebook-settings`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSettings(response.data.data || null);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to load Facebook settings:', error);
      }
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthCallback = (event: MessageEvent) => {
    // Verify origin
    if (event.origin !== window.location.origin) return;

    if (event.data?.type === 'facebook_oauth_success') {
      console.log('✅ Facebook OAuth successful:', event.data);
      setConnecting(false);
      loadSettings();
    } else if (event.data?.type === 'facebook_oauth_error') {
      console.error('❌ Facebook OAuth error:', event.data.error);
      setConnecting(false);
      alert(`Failed to connect Facebook: ${event.data.error}`);
    }
  };

  const handleConnectFacebook = () => {
    setConnecting(true);

    // Facebook OAuth URL with required permissions
    const redirectUri = `${window.location.origin}/facebook-callback`;
    const scope = 'whatsapp_business_messaging,whatsapp_business_management,business_management';
    const facebookAppId = ENV_CONFIG.facebookAppId || 'YOUR_FACEBOOK_APP_ID';

    const authUrl = 
      `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${facebookAppId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `state=${businessId}`;

    // Open OAuth in popup
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      authUrl,
      'Facebook Login',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no`
    );
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Facebook/WhatsApp?')) return;

    try {
      await axios.delete(
        `${ENV_CONFIG.apiBaseUrl}/businesses/${businessId}/facebook-settings`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSettings(null);
    } catch (error) {
      console.error('Failed to disconnect Facebook:', error);
      alert('Failed to disconnect. Please try again.');
    }
  };

  const handleRefreshToken = async () => {
    try {
      await axios.post(
        `${ENV_CONFIG.apiBaseUrl}/businesses/${businessId}/facebook-settings/refresh-token`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('Token refreshed successfully!');
      loadSettings();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      alert('Failed to refresh token. Please reconnect.');
    }
  };

  const handleTestWebhook = async () => {
    try {
      await axios.post(
        `${ENV_CONFIG.apiBaseUrl}/businesses/${businessId}/facebook-settings/test-webhook`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('Webhook test sent successfully!');
    } catch (error) {
      console.error('Failed to test webhook:', error);
      alert('Failed to test webhook. Check console for details.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'warning';
      case 'revoked':
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const hasRequiredPermissions = () => {
    if (!settings) return false;
    const required = ['whatsapp_business_messaging', 'whatsapp_business_management'];
    return required.every((perm) => settings.granted_permissions?.includes(perm));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  const getPublicConnectionLink = () => {
    return `${window.location.origin}/connect-facebook/${businessId}`;
  };

  const handleCopyLink = () => {
    const link = getPublicConnectionLink();
    navigator.clipboard.writeText(link);
    alert('Connection link copied to clipboard!');
  };

  const handleShareWhatsApp = () => {
    const link = getPublicConnectionLink();
    const message = `Connect your Facebook Business Manager to enable WhatsApp messaging: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleShareEmail = () => {
    const link = getPublicConnectionLink();
    const subject = 'Connect Facebook Business Manager';
    const body = `Please connect your Facebook Business Manager account to enable WhatsApp messaging.\n\nClick here to connect: ${link}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  if (!settings) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Facebook / WhatsApp Integration
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Share Connection Link</AlertTitle>
          <Typography variant="body2" gutterBottom>
            You can share this link with external users (business owners, partners) to allow them to
            connect their Facebook Business Manager account without needing access to this dashboard.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:copy-bold" />}
              onClick={handleCopyLink}
            >
              Copy Link
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:chat-round-bold" />}
              onClick={handleShareWhatsApp}
              sx={{ color: '#25D366', borderColor: '#25D366' }}
            >
              Share via WhatsApp
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:letter-bold" />}
              onClick={handleShareEmail}
            >
              Share via Email
            </Button>
          </Box>
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.neutral', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {getPublicConnectionLink()}
            </Typography>
          </Box>
        </Alert>

        <Card sx={{ p: 3, mb: 3 }}>
          <Stack spacing={2} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                bgcolor: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h3" sx={{ color: 'white' }}>
                W
              </Typography>
            </Box>
            <Typography variant="h6" align="center">
              Connect Your WhatsApp Business Account
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 500 }}>
              Connect your Facebook Business Manager account to send WhatsApp messages through the
              WhatsApp Business API. You will need to authorize the following permissions:
            </Typography>
            <List dense sx={{ width: '100%', maxWidth: 500 }}>
              <ListItem>
                <ListItemText
                  primary="✓ WhatsApp Business Messaging"
                  secondary="Send and receive WhatsApp messages"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="✓ WhatsApp Business Management"
                  secondary="Manage WhatsApp Business account settings"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="✓ Business Management"
                  secondary="Access business information"
                />
              </ListItem>
            </List>
            <Button
              variant="contained"
              size="large"
              startIcon={<Iconify icon="solar:user-bold" />}
              onClick={handleConnectFacebook}
              disabled={connecting}
              sx={{
                bgcolor: '#1877F2',
                '&:hover': { bgcolor: '#1565C0' },
              }}
            >
              {connecting ? 'Connecting...' : 'Connect with Facebook'}
            </Button>
          </Stack>
        </Card>

        <Alert severity="info">
          <AlertTitle>Requirements</AlertTitle>
          <Typography variant="body2">
            • You must have a Facebook Business Manager account
            <br />
            • Your WhatsApp Business Account must be set up in Meta Business Manager
            <br />
            • You need admin access to the WhatsApp Business Account
            <br />• Your Facebook App must be approved for WhatsApp Business API access
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Connected state
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Facebook / WhatsApp Integration</Typography>
        <Chip
          label={settings.status.toUpperCase()}
          color={getStatusColor(settings.status) as any}
          size="small"
        />
      </Box>

      {settings.last_error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Connection Error</AlertTitle>
          {settings.last_error}
        </Alert>
      )}

      {!hasRequiredPermissions() && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Missing Permissions</AlertTitle>
          Some required permissions are missing. Please reconnect your account to grant all necessary
          permissions.
        </Alert>
      )}

      {settings.is_throttled && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Rate Limited</AlertTitle>
          Your account is currently rate-limited by Facebook. API usage: {settings.usage_percentage}%
        </Alert>
      )}

      <Card sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Connected User
            </Typography>
            <Typography variant="body1">
              {settings.user_info?.name || 'Unknown'} ({settings.user_info?.email || 'No email'})
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              App ID
            </Typography>
            <Typography variant="body1">{settings.app_id}</Typography>
          </Box>

          {settings.waba_id && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                WhatsApp Business Account ID
              </Typography>
              <Typography variant="body1">{settings.waba_id}</Typography>
            </Box>
          )}

          {settings.meta_business_id && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Meta Business ID
              </Typography>
              <Typography variant="body1">{settings.meta_business_id}</Typography>
            </Box>
          )}

          <Divider />

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Granted Permissions
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {settings.granted_permissions && settings.granted_permissions.length > 0 ? (
                settings.granted_permissions.map((perm) => (
                  <Chip key={perm} label={perm} size="small" variant="outlined" />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No permissions granted
                </Typography>
              )}
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Connected Since
            </Typography>
            <Typography variant="body1">
              {settings.connected_at
                ? new Date(settings.connected_at).toLocaleString()
                : 'Unknown'}
            </Typography>
          </Box>

          {settings.token_expires_at && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Token Expires
              </Typography>
              <Typography variant="body1">
                {new Date(settings.token_expires_at).toLocaleString()}
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Webhook Status
            </Typography>
            <Chip
              label={settings.webhook_subscribed ? 'Active' : 'Not Configured'}
              size="small"
              color={settings.webhook_subscribed ? 'success' : 'default'}
            />
          </Box>
        </Stack>
      </Card>

      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:refresh-outline" />}
          onClick={handleRefreshToken}
        >
          Refresh Token
        </Button>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:lightning-bold" />}
          onClick={handleTestWebhook}
          disabled={!settings.webhook_subscribed}
        >
          Test Webhook
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Iconify icon="solar:close-circle-bold" />}
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </Stack>
    </Box>
  );
}

