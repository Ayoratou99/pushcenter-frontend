import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import { Chip, Table, Paper, TableRow, TableBody, TableCell, TableHead, TableContainer } from '@mui/material';

import apiClient from 'src/services/api.client';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface SmtpSetting {
  id: number;
  name: string;
  description?: string;
  host: string;
  port: number;
  encryption: 'tls' | 'ssl' | 'none';
  username: string;
  from_email: string;
  from_name: string;
  reply_to_email?: string | null;
  reply_to_name?: string | null;
  is_active: boolean;
  is_default: boolean;
  test_status?: 'not_tested' | 'success' | 'failed';
  messages_sent?: number;
  second_limit?: number;
  hourly_limit?: number;
  daily_limit?: number;
}

interface BaseSmtpConfig {
  id: number;
  name: string;
  host: string;
  port: number;
  encryption: 'tls' | 'ssl' | 'none';
  username: string;
}

interface EmailSettingsTabProps {
  businessId: number;
}

export function EmailSettingsTab({ businessId }: EmailSettingsTabProps) {
  const [settings, setSettings] = useState<SmtpSetting[]>([]);
  const [baseConfigs, setBaseConfigs] = useState<BaseSmtpConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBaseConfigs, setLoadingBaseConfigs] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testingSmtpId, setTestingSmtpId] = useState<number | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [useExistingBase, setUseExistingBase] = useState(false);
  const [formData, setFormData] = useState({
    base_smtp_id: '',
    name: '',
    description: '',
    host: '',
    port: 587,
    encryption: 'tls' as 'tls' | 'ssl' | 'none',
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    reply_to_email: '',
    reply_to_name: '',
    is_active: true,
    is_default: false,
    second_limit: '',
    hourly_limit: '',
    daily_limit: '',
  });

  useEffect(() => {
    loadSettings();
    loadBaseConfigurations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/businesses/${businessId}/smtp-settings`
      );
      setSettings(response.data.data || []);
    } catch (error) {
      console.error('Failed to load SMTP settings:', error);
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBaseConfigurations = async () => {
    try {
      setLoadingBaseConfigs(true);
      const response = await apiClient.get(`/smtp-settings/base`);
      setBaseConfigs(response.data.data || []);
    } catch (error) {
      console.error('Failed to load base SMTP configurations:', error);
      setBaseConfigs([]);
    } finally {
      setLoadingBaseConfigs(false);
    }
  };

  const handleOpenDialog = (setting?: SmtpSetting) => {
    if (setting) {
      setEditingId(setting.id);
      setUseExistingBase(false);
      setFormData({
        base_smtp_id: '',
        name: setting.name,
        description: setting.description || '',
        host: setting.host,
        port: setting.port,
        encryption: setting.encryption,
        username: setting.username,
        password: '', // Don't populate password
        from_email: setting.from_email,
        from_name: setting.from_name,
        reply_to_email: setting.reply_to_email || '',
        reply_to_name: setting.reply_to_name || '',
        is_active: setting.is_active,
        is_default: setting.is_default,
        second_limit: setting.second_limit?.toString() || '',
        hourly_limit: setting.hourly_limit?.toString() || '',
        daily_limit: setting.daily_limit?.toString() || '',
      });
    } else {
      setEditingId(null);
      setUseExistingBase(false);
      setFormData({
        base_smtp_id: '',
        name: '',
        description: '',
        host: '',
        port: 587,
        encryption: 'tls',
        username: '',
        password: '',
        from_email: '',
        from_name: '',
        reply_to_email: '',
        reply_to_name: '',
        is_active: true,
        is_default: false,
        second_limit: '',
        hourly_limit: '',
        daily_limit: '',
      });
    }
    setDialogOpen(true);
  };

  const handleBaseConfigChange = (baseSmtpId: string) => {
    if (!baseSmtpId) {
      setUseExistingBase(false);
      return;
    }

    const baseConfig = baseConfigs.find((c) => c.id === Number(baseSmtpId));
    if (baseConfig) {
      setUseExistingBase(true);
      setFormData({
        ...formData,
        base_smtp_id: baseSmtpId,
        host: baseConfig.host,
        port: baseConfig.port,
        encryption: baseConfig.encryption,
        username: baseConfig.username,
        password: '', // Don't copy password, it's encrypted
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        ...formData,
        second_limit: formData.second_limit ? Number(formData.second_limit) : null,
        hourly_limit: formData.hourly_limit ? Number(formData.hourly_limit) : null,
        daily_limit: formData.daily_limit ? Number(formData.daily_limit) : null,
      };

      // If using existing base, only send base_smtp_id and from_email/from_name
      if (useExistingBase && formData.base_smtp_id && !editingId) {
        payload.base_smtp_id = Number(formData.base_smtp_id);
        // Remove base config fields, they'll be copied from base
        delete payload.host;
        delete payload.port;
        delete payload.encryption;
        delete payload.username;
        delete payload.password;
      } else if (!useExistingBase) {
        // Remove base_smtp_id if not using existing base
        delete payload.base_smtp_id;
      }

      // Remove empty password on update
      if (editingId && !payload.password) {
        delete payload.password;
      }

      if (editingId) {
        await apiClient.put(
          `/businesses/${businessId}/smtp-settings/${editingId}`,
          payload
        );
      } else {
        await apiClient.post(
          `/businesses/${businessId}/smtp-settings`,
          payload
        );
      }
      handleCloseDialog();
      loadSettings();
    } catch (error) {
      console.error('Failed to save SMTP settings:', error);
      alert('Failed to save SMTP settings. Please check the form and try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this SMTP setting?')) return;
    
    try {
      await apiClient.delete(
        `/businesses/${businessId}/smtp-settings/${id}`
      );
      loadSettings();
    } catch (error) {
      console.error('Failed to delete SMTP settings:', error);
      alert('Failed to delete SMTP setting. Please try again.');
    }
  };

  const handleTestClick = (id: number) => {
    setTestingSmtpId(id);
    setTestEmail('');
    setTestDialogOpen(true);
  };

  const handleTest = async () => {
    if (!testingSmtpId || !testEmail) {
      alert('Please enter a recipient email address');
      return;
    }

    try {
      setTesting(true);
      await apiClient.post(
        `/businesses/${businessId}/smtp-settings/${testingSmtpId}/test`,
        { recipient_email: testEmail }
      );
      alert('Test email sent successfully!');
      setTestDialogOpen(false);
      setTestEmail('');
      setTestingSmtpId(null);
      loadSettings();
    } catch (error: any) {
      console.error('Failed to test SMTP settings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send test email. Check console for details.';
      alert(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">SMTP / Email Settings</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => handleOpenDialog()}
        >
          Add SMTP Config
        </Button>
      </Box>

      {settings.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No SMTP settings configured yet.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Add an SMTP configuration to start sending emails.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Host</TableCell>
                <TableCell>From Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Test Status</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {settings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">{setting.name}</Typography>
                      {setting.is_default && (
                        <Chip label="Default" size="small" color="primary" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{setting.host}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Port: {setting.port} | {setting.encryption.toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{setting.from_email}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {setting.from_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={setting.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={setting.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={setting.test_status || 'Not tested'}
                      size="small"
                      color={
                        setting.test_status === 'success'
                          ? 'success'
                          : setting.test_status === 'failed'
                            ? 'error'
                            : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>{setting.messages_sent || 0}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleTestClick(setting.id)} title="Test">
                      <Iconify icon="solar:lightning-bold" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(setting)} title="Edit">
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(setting.id)}
                      color="error"
                      title="Delete"
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit SMTP Settings' : 'Add SMTP Settings'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!editingId && (
              <>
                <Autocomplete
                  options={[
                    { id: 0, name: 'Create New Configuration', host: '', port: 0, encryption: 'tls' as const, username: '' },
                    ...baseConfigs
                  ]}
                  getOptionLabel={(option) => 
                    option.id === 0 
                      ? option.name 
                      : `${option.name} - ${option.host}:${option.port} (${option.encryption.toUpperCase()})`
                  }
                  value={
                    formData.base_smtp_id 
                      ? baseConfigs.find((c) => c.id.toString() === formData.base_smtp_id) || null
                      : { id: 0, name: 'Create New Configuration', host: '', port: 0, encryption: 'tls' as const, username: '' }
                  }
                  onChange={(_, newValue) => handleBaseConfigChange(newValue?.id ? newValue.id.toString() : '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Use Existing SMTP Base Configuration (Optional)"
                      placeholder="Search SMTP configurations..."
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText="No SMTP configurations found"
                  loading={loadingBaseConfigs}
                />
                {useExistingBase && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Using existing base configuration. You only need to set From Email and From Name.
                  </Typography>
                )}
              </>
            )}
            <TextField
              fullWidth
              label="Configuration Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
            {!useExistingBase && (
              <>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  required
                />
            <Box display="flex" gap={2}>
              <TextField
                label="Port"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                sx={{ width: '30%' }}
                required
              />
              <FormControl sx={{ width: '70%' }}>
                <InputLabel>Encryption</InputLabel>
                <Select
                  value={formData.encryption}
                  label="Encryption"
                  onChange={(e) => setFormData({ ...formData, encryption: e.target.value as any })}
                >
                  <MenuItem value="tls">TLS</MenuItem>
                  <MenuItem value="ssl">SSL</MenuItem>
                  <MenuItem value="none">None</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required={!useExistingBase}
              disabled={useExistingBase}
            />
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText={editingId ? 'Leave blank to keep current password' : (useExistingBase ? 'Password from base configuration will be used' : '')}
              required={!editingId && !useExistingBase}
              disabled={useExistingBase}
            />
              </>
            )}
            <TextField
              fullWidth
              label="From Email"
              value={formData.from_email}
              onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
              type="email"
              required
            />
            <TextField
              fullWidth
              label="From Name"
              value={formData.from_name}
              onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
              required
            />
            <Box display="flex" gap={2}>
              <TextField
                label="Second Limit"
                type="number"
                value={formData.second_limit}
                onChange={(e) => setFormData({ ...formData, second_limit: e.target.value })}
                placeholder="Optional"
                fullWidth
                helperText="Max emails per second"
              />
              <TextField
                label="Hourly Limit"
                type="number"
                value={formData.hourly_limit}
                onChange={(e) => setFormData({ ...formData, hourly_limit: e.target.value })}
                placeholder="Optional"
                fullWidth
                helperText="Max emails per hour"
              />
              <TextField
                label="Daily Limit"
                type="number"
                value={formData.daily_limit}
                onChange={(e) => setFormData({ ...formData, daily_limit: e.target.value })}
                placeholder="Optional"
                fullWidth
                helperText="Max emails per day"
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Test Email</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter the email address where you want to receive the test email to verify your SMTP configuration.
            </Typography>
            <TextField
              fullWidth
              label="Recipient Email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              required
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)} disabled={testing}>
            Cancel
          </Button>
          <Button onClick={handleTest} variant="contained" disabled={testing || !testEmail}>
            {testing ? 'Sending...' : 'Send Test Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

