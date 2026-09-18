import type { SyntheticEvent } from 'react';
import type { Business } from 'src/services/types';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { businessService } from 'src/services';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { SmsSettingsTab } from '../settings/sms-settings-tab';
import { EmailSettingsTab } from '../settings/email-settings-tab';
import { WebhookSettingsTab } from '../settings/webhook-settings-tab';
import { FacebookSettingsTab } from '../settings/facebook-settings-tab';

// ----------------------------------------------------------------------

export function BusinessDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('details');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ app_id: string; app_secret: string } | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  
  // Get user's timezone as default
  const getUserTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  };

  // Get list of common timezones
  const getTimezones = () => {
    try {
      if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
        return Intl.supportedValuesOf('timeZone').sort();
      }
    } catch {
      // Fallback
    }
    
    return [
      'UTC',
      'Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', 'Africa/Algiers',
      'Africa/Asmara', 'Africa/Bamako', 'Africa/Bangui', 'Africa/Banjul',
      'Africa/Bissau', 'Africa/Blantyre', 'Africa/Brazzaville', 'Africa/Bujumbura',
      'Africa/Cairo', 'Africa/Casablanca', 'Africa/Ceuta', 'Africa/Conakry',
      'Africa/Dakar', 'Africa/Dar_es_Salaam', 'Africa/Djibouti', 'Africa/Douala',
      'Africa/El_Aaiun', 'Africa/Freetown', 'Africa/Gaborone', 'Africa/Harare',
      'Africa/Johannesburg', 'Africa/Juba', 'Africa/Kampala', 'Africa/Khartoum',
      'Africa/Kigali', 'Africa/Kinshasa', 'Africa/Lagos', 'Africa/Libreville',
      'Africa/Lome', 'Africa/Luanda', 'Africa/Lubumbashi', 'Africa/Lusaka',
      'Africa/Malabo', 'Africa/Maputo', 'Africa/Maseru', 'Africa/Mbabane',
      'Africa/Mogadishu', 'Africa/Monrovia', 'Africa/Nairobi', 'Africa/Ndjamena',
      'Africa/Niamey', 'Africa/Nouakchott', 'Africa/Ouagadougou', 'Africa/Porto-Novo',
      'Africa/Sao_Tome', 'Africa/Tripoli', 'Africa/Tunis', 'Africa/Windhoek',
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Toronto', 'America/Mexico_City', 'America/Sao_Paulo', 'America/Buenos_Aires',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome',
      'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna',
      'Europe/Stockholm', 'Europe/Warsaw', 'Europe/Athens', 'Europe/Istanbul',
      'Europe/Moscow', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata',
      'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Hong_Kong',
      'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney',
      'Australia/Melbourne', 'Pacific/Auckland',
    ].sort();
  };

  const [timezones] = useState<string[]>(getTimezones());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    website: '',
    description: '',
    timezone: getUserTimezone(),
    status: 'active' as 'active' | 'inactive' | 'suspended',
  });

  useEffect(() => {
    if (id) {
      loadBusiness();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      const response = await businessService.getById(Number(id));
      const businessData = response.data;
      setBusiness(businessData);
      
      // Populate form data
      setFormData({
        name: businessData.name || '',
        email: businessData.email || '',
        phone_number: businessData.phone_number || '',
        website: businessData.website || '',
        description: businessData.description || '',
        timezone: businessData.timezone || getUserTimezone(),
        status: businessData.status || 'active',
      });
    } catch (error) {
      console.error('Failed to load business:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusiness = async () => {
    try {
      setSaving(true);
      await businessService.update(Number(id), formData);
      setEditDialogOpen(false);
      loadBusiness(); // Reload to get updated data
    } catch (error) {
      console.error('Failed to update business:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCredentials = async () => {
    if (!window.confirm('Are you sure you want to regenerate app credentials? The old credentials will no longer work.')) {
      return;
    }

    try {
      setRegenerating(true);
      const response = await businessService.regenerateCredentials(Number(id));
      setNewCredentials(response.data);
      setCredentialsDialogOpen(true);
      loadBusiness(); // Reload to get updated app_id
    } catch (error) {
      console.error('Failed to regenerate credentials:', error);
      alert('Failed to regenerate credentials. Please try again.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleTabChange = (_event: SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (!business) {
    return (
      <DashboardContent>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <Typography variant="h4" gutterBottom>
            Business not found
          </Typography>
          <Button variant="contained" onClick={() => navigate('/businesses')}>
            Back to Businesses
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          variant="text"
          startIcon={<Iconify icon="solar:arrow-left-outline" />}
          onClick={() => navigate('/businesses')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Box flexGrow={1}>
          <Typography variant="h4">{business.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {business.email}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:pen-bold" />}
          onClick={() => setEditDialogOpen(true)}
        >
          Edit Business
        </Button>
      </Box>

      <Card>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{
            px: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tab
            value="details"
            label="Details"
            icon={<Iconify icon="solar:user-bold" width={20} />}
            iconPosition="start"
          />
          <Tab
            value="email"
            label="Email Settings"
            icon={<Iconify icon="solar:letter-bold" width={20} />}
            iconPosition="start"
          />
          <Tab
            value="sms"
            label="SMS Settings"
            icon={<Iconify icon="solar:chat-round-bold" width={20} />}
            iconPosition="start"
          />
          <Tab
            value="facebook"
            label="Facebook / WhatsApp"
            icon={<Iconify icon="solar:chat-round-call-bold" width={20} />}
            iconPosition="start"
          />
          <Tab
            value="webhook"
            label="Webhooks"
            icon={<Iconify icon="solar:link-bold" width={20} />}
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {currentTab === 'details' && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Business Name
                </Typography>
                <Typography variant="body1">{business.name}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Email
                </Typography>
                <Typography variant="body1">{business.email}</Typography>
              </Box>
              {business.phone_number && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Phone Number
                  </Typography>
                  <Typography variant="body1">{business.phone_number}</Typography>
                </Box>
              )}
              {business.website && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Website
                  </Typography>
                  <Typography variant="body1">
                    <a href={business.website} target="_blank" rel="noopener noreferrer">
                      {business.website}
                    </a>
                  </Typography>
                </Box>
              )}
              {business.description && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1">{business.description}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Timezone
                </Typography>
                <Typography variant="body1">{business.timezone || 'Not set'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {business.status}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Created At
                </Typography>
                <Typography variant="body1">
                  {new Date(business.created_at).toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">App Credentials</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Iconify icon="solar:refresh-outline" />}
                    onClick={handleRegenerateCredentials}
                    disabled={regenerating}
                  >
                    {regenerating ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                </Box>

                <Stack spacing={2}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2" color="text.secondary">
                        App ID
                      </Typography>
                      {business.app_id && (
                        <Button
                          size="small"
                          startIcon={<Iconify icon="solar:copy-bold" width={16} />}
                          onClick={() => handleCopyToClipboard(business.app_id || '')}
                        >
                          Copy
                        </Button>
                      )}
                    </Box>
                    {business.app_id ? (
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: 'monospace',
                          bgcolor: 'background.neutral',
                          p: 1,
                          borderRadius: 1,
                          wordBreak: 'break-all',
                        }}
                      >
                        {business.app_id}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No app ID generated yet. Click &quot;Regenerate&quot; to create credentials.
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2" color="text.secondary">
                        App Secret
                      </Typography>
                      {business.app_secret && (
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            startIcon={
                              <Iconify
                                icon={showSecret ? 'solar:eye-closed-bold' : 'solar:eye-bold'}
                                width={16}
                              />
                            }
                            onClick={() => setShowSecret(!showSecret)}
                          >
                            {showSecret ? 'Hide' : 'Show'}
                          </Button>
                          <Button
                            size="small"
                            startIcon={<Iconify icon="solar:copy-bold" width={16} />}
                            onClick={() => handleCopyToClipboard(business.app_secret || '')}
                          >
                            Copy
                          </Button>
                        </Box>
                      )}
                    </Box>
                    {business.app_secret ? (
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: 'monospace',
                          bgcolor: 'background.neutral',
                          p: 1,
                          borderRadius: 1,
                          wordBreak: 'break-all',
                        }}
                      >
                        {showSecret ? business.app_secret : '••••••••••••••••••••••••••••••••'}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No app secret generated yet. Click &quot;Regenerate&quot; to create credentials.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            </Stack>
          )}
          {currentTab === 'email' && <EmailSettingsTab businessId={Number(id)} />}
          {currentTab === 'sms' && <SmsSettingsTab businessId={Number(id)} />}
          {currentTab === 'facebook' && <FacebookSettingsTab businessId={Number(id)} />}
          {currentTab === 'webhook' && <WebhookSettingsTab businessId={Number(id)} />}
        </Box>
      </Card>

      {/* Edit Business Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Business</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Business Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
            <TextField
              fullWidth
              label="Website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={formData.timezone}
                label="Timezone"
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                {timezones.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveBusiness} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Credentials Dialog - Show once after regeneration */}
      <Dialog
        open={credentialsDialogOpen}
        onClose={() => {
          setCredentialsDialogOpen(false);
          setNewCredentials(null);
          setShowSecret(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New App Credentials Generated</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Important</AlertTitle>
            <Typography variant="body2">
              Please save the App Secret now. It will not be shown again after you close this dialog.
            </Typography>
          </Alert>

          {newCredentials && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    App ID
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Iconify icon="solar:copy-bold" width={16} />}
                    onClick={() => handleCopyToClipboard(newCredentials.app_id)}
                  >
                    Copy
                  </Button>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'monospace',
                    bgcolor: 'background.neutral',
                    p: 1.5,
                    borderRadius: 1,
                    wordBreak: 'break-all',
                  }}
                >
                  {newCredentials.app_id}
                </Typography>
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    App Secret
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      startIcon={
                        <Iconify
                          icon={showSecret ? 'solar:eye-closed-bold' : 'solar:eye-bold'}
                          width={16}
                        />
                      }
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? 'Hide' : 'Show'}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Iconify icon="solar:copy-bold" width={16} />}
                      onClick={() => handleCopyToClipboard(newCredentials.app_secret)}
                    >
                      Copy
                    </Button>
                  </Box>
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: 'monospace',
                    bgcolor: 'background.neutral',
                    p: 1.5,
                    borderRadius: 1,
                    wordBreak: 'break-all',
                    color: 'error.main',
                    fontWeight: 'bold',
                  }}
                >
                  {showSecret ? newCredentials.app_secret : '••••••••••••••••••••••••••••••••'}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCredentialsDialogOpen(false);
              setNewCredentials(null);
              setShowSecret(false);
            }}
            variant="contained"
          >
            I&apos;ve Saved the Credentials
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

