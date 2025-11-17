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
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import { Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

import axios from 'axios';

import { Iconify } from 'src/components/iconify';

import { ENV_CONFIG } from 'src/config/env.config';

// ----------------------------------------------------------------------

interface SmsSetting {
  id: number;
  name: string;
  description?: string;
  provider: 'twilio' | 'nexmo' | 'africastalking' | 'orange' | 'mtn' | 'custom';
  sender_id: string;
  is_active: boolean;
  is_default: boolean;
  test_status?: 'not_tested' | 'success' | 'failed';
  messages_sent?: number;
  cost_per_sms?: number;
  currency?: string;
  balance?: number;
  hourly_limit?: number;
  daily_limit?: number;
}

interface SmsSettingsTabProps {
  businessId: number;
}

export function SmsSettingsTab({ businessId }: SmsSettingsTabProps) {
  const [settings, setSettings] = useState<SmsSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider: 'twilio' as 'twilio' | 'nexmo' | 'africastalking' | 'orange' | 'mtn' | 'custom',
    api_key: '',
    api_secret: '',
    account_sid: '',
    api_url: '',
    sender_id: '',
    sender_phone: '',
    cost_per_sms: '25.00',
    currency: 'XAF',
    is_active: true,
    is_default: false,
    hourly_limit: '',
    daily_limit: '',
  });

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${ENV_CONFIG.apiBaseUrl}/businesses/${businessId}/sms-settings`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSettings(response.data.data || []);
    } catch (error) {
      console.error('Failed to load SMS settings:', error);
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (setting?: SmsSetting) => {
    if (setting) {
      setEditingId(setting.id);
      setFormData({
        name: setting.name,
        description: setting.description || '',
        provider: setting.provider,
        api_key: '', // Don't populate credentials
        api_secret: '',
        account_sid: '',
        api_url: '',
        sender_id: setting.sender_id,
        sender_phone: '',
        cost_per_sms: setting.cost_per_sms?.toString() || '25.00',
        currency: setting.currency || 'XAF',
        is_active: setting.is_active,
        is_default: setting.is_default,
        hourly_limit: setting.hourly_limit?.toString() || '',
        daily_limit: setting.daily_limit?.toString() || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        provider: 'twilio',
        api_key: '',
        api_secret: '',
        account_sid: '',
        api_url: '',
        sender_id: '',
        sender_phone: '',
        cost_per_sms: '25.00',
        currency: 'XAF',
        is_active: true,
        is_default: false,
        hourly_limit: '',
        daily_limit: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        cost_per_sms: Number(formData.cost_per_sms),
        hourly_limit: formData.hourly_limit ? Number(formData.hourly_limit) : null,
        daily_limit: formData.daily_limit ? Number(formData.daily_limit) : null,
      };

      if (editingId) {
        await axios.put(
          `${ENV_CONFIG.apiBaseUrl}/businesses/${businessId}/sms-settings/${editingId}`,
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      } else {
        await axios.post(
          `${ENV_CONFIG.apiBaseUrl}/businesses/${businessId}/sms-settings`,
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
      }
      handleCloseDialog();
      loadSettings();
    } catch (error) {
      console.error('Failed to save SMS settings:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this SMS setting?')) return;
    
    try {
      await axios.delete(
        `${ENV_CONFIG.apiBaseUrl}/businesses/${businessId}/sms-settings/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      loadSettings();
    } catch (error) {
      console.error('Failed to delete SMS settings:', error);
    }
  };

  const handleTest = async (id: number) => {
    try {
      await axios.post(
        `${ENV_CONFIG.apiBaseUrl}/businesses/${businessId}/sms-settings/${id}/test`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert('Test SMS sent successfully!');
      loadSettings();
    } catch (error) {
      console.error('Failed to test SMS settings:', error);
      alert('Failed to send test SMS. Check console for details.');
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
        <Typography variant="h6">SMS Provider Settings</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => handleOpenDialog()}
        >
          Add SMS Config
        </Button>
      </Box>

      {settings.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No SMS settings configured yet.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Add an SMS provider configuration to start sending SMS messages.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Sender ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Balance</TableCell>
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
                    <Chip label={setting.provider.toUpperCase()} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{setting.sender_id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={setting.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={setting.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {setting.balance !== undefined ? (
                      <Typography variant="body2">
                        {setting.balance} {setting.currency}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{setting.messages_sent || 0}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleTest(setting.id)} title="Test">
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
        <DialogTitle>{editingId ? 'Edit SMS Settings' : 'Add SMS Settings'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
            <FormControl fullWidth>
              <InputLabel>SMS Provider</InputLabel>
              <Select
                value={formData.provider}
                label="SMS Provider"
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
              >
                <MenuItem value="twilio">Twilio</MenuItem>
                <MenuItem value="nexmo">Nexmo/Vonage</MenuItem>
                <MenuItem value="africastalking">Africa's Talking</MenuItem>
                <MenuItem value="orange">Orange SMS</MenuItem>
                <MenuItem value="mtn">MTN SMS</MenuItem>
                <MenuItem value="custom">Custom Provider</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="API Key"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              helperText={editingId ? 'Leave blank to keep current API key' : ''}
              required={!editingId}
            />
            <TextField
              fullWidth
              label="API Secret"
              type="password"
              value={formData.api_secret}
              onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
              helperText={editingId ? 'Leave blank to keep current API secret' : ''}
              required={!editingId}
            />

            {formData.provider === 'twilio' && (
              <TextField
                fullWidth
                label="Account SID (Twilio)"
                value={formData.account_sid}
                onChange={(e) => setFormData({ ...formData, account_sid: e.target.value })}
              />
            )}

            {formData.provider === 'custom' && (
              <TextField
                fullWidth
                label="API URL"
                value={formData.api_url}
                onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                placeholder="https://api.yourprovider.com/sms"
              />
            )}

            <TextField
              fullWidth
              label="Sender ID / From"
              value={formData.sender_id}
              onChange={(e) => setFormData({ ...formData, sender_id: e.target.value })}
              placeholder="YourBrand"
              required
            />

            <TextField
              fullWidth
              label="Sender Phone (if required)"
              value={formData.sender_phone}
              onChange={(e) => setFormData({ ...formData, sender_phone: e.target.value })}
              placeholder="+237xxxxxxxxx"
            />

            <Box display="flex" gap={2}>
              <TextField
                label="Cost per SMS"
                type="number"
                value={formData.cost_per_sms}
                onChange={(e) => setFormData({ ...formData, cost_per_sms: e.target.value })}
                sx={{ width: '50%' }}
                required
              />
              <TextField
                label="Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="XAF"
                sx={{ width: '50%' }}
                required
              />
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                label="Hourly Limit"
                type="number"
                value={formData.hourly_limit}
                onChange={(e) => setFormData({ ...formData, hourly_limit: e.target.value })}
                placeholder="Optional"
                fullWidth
              />
              <TextField
                label="Daily Limit"
                type="number"
                value={formData.daily_limit}
                onChange={(e) => setFormData({ ...formData, daily_limit: e.target.value })}
                placeholder="Optional"
                fullWidth
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
    </Box>
  );
}

