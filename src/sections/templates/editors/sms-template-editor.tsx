import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Autocomplete from '@mui/material/Autocomplete';

import { smsTemplateService, businessService, type Business } from 'src/services';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const SMS_MAX_LENGTH = 160;
const SMS_MULTIPART_LENGTH = 153;

export function SmsTemplateEditor() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  const [formData, setFormData] = useState<{
    business_id: number | '';
    name: string;
    description: string;
    category: 'marketing' | 'transactional' | 'notification';
    content: string;
    sender_id: string;
    variables: string[];
  }>({
    business_id: '',
    name: '',
    description: '',
    category: 'marketing',
    content: '',
    sender_id: '',
    variables: [],
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setLoadingBusinesses(true);
      const response = await businessService.getAll({ per_page: 100 });
      setBusinesses(response.data.data);
      
      // Auto-select first business if available
      if (response.data.data.length > 0) {
        setFormData((prev) => ({ ...prev, business_id: response.data.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load businesses:', err);
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddVariable = () => {
    const varName = prompt('Enter variable name (e.g., name, code):');
    if (varName && !formData.variables.includes(varName)) {
      setFormData((prev) => ({
        ...prev,
        variables: [...prev.variables, varName],
        content: prev.content + ` {{${varName}}}`,
      }));
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      variables: (Array.isArray(prev.variables) ? prev.variables : []).filter((v) => v !== variable),
    }));
  };

  const calculateSmsStats = () => {
    const length = formData.content.length;
    const messageCount = length === 0 ? 0 : Math.ceil(length / (length > SMS_MAX_LENGTH ? SMS_MULTIPART_LENGTH : SMS_MAX_LENGTH));
    const remainingChars = length > SMS_MAX_LENGTH 
      ? SMS_MULTIPART_LENGTH - (length % SMS_MULTIPART_LENGTH || SMS_MULTIPART_LENGTH)
      : SMS_MAX_LENGTH - length;

    return { length, messageCount, remainingChars };
  };

  const renderPreview = () => {
    let previewText = formData.content;
    formData.variables.forEach((variable) => {
      previewText = previewText.replace(new RegExp(`{{${variable}}}`, 'g'), `[${variable}]`);
    });
    return previewText;
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.business_id) {
        setError('Please select a business');
        return;
      }

      const templateData = {
        ...formData,
        business_id: Number(formData.business_id),
        type: 'sms' as const,
        status: 'draft' as const,
        is_active: false,
        metadata: {
          content: formData.content,
          sender_id: formData.sender_id,
          variables: (Array.isArray(formData.variables) && formData.variables.length > 0) ? formData.variables : undefined,
          ...calculateSmsStats(),
        },
      };

      await smsTemplateService.create(templateData);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save draft:', err);
      setError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.business_id) {
        setError('Please select a business');
        return;
      }

      const templateData = {
        ...formData,
        business_id: Number(formData.business_id),
        type: 'sms' as const,
        status: 'active' as const,
        is_active: true,
        metadata: {
          content: formData.content,
          sender_id: formData.sender_id,
          variables: (Array.isArray(formData.variables) && formData.variables.length > 0) ? formData.variables : undefined,
          ...calculateSmsStats(),
        },
      };

      await smsTemplateService.create(templateData);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to publish:', err);
      setError(err.response?.data?.message || 'Failed to publish template');
    } finally {
      setLoading(false);
    }
  };

  const stats = calculateSmsStats();

  if (loadingBusinesses) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 7 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Template saved successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          <Autocomplete
            options={businesses}
            getOptionLabel={(option) => option.name}
            value={businesses.find((b) => b.id === formData.business_id) || null}
            onChange={(_, newValue) => handleInputChange('business_id', newValue?.id || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Business"
                required
                placeholder="Search businesses..."
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="No businesses found"
            loading={loadingBusinesses}
          />

          <TextField
            fullWidth
            label="Template Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  label="Category"
                >
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="transactional">Transactional</MenuItem>
                  <MenuItem value="notification">Notification</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Sender ID"
                value={formData.sender_id}
                onChange={(e) => handleInputChange('sender_id', e.target.value)}
                placeholder="YourBrand"
                helperText="Max 11 characters"
                inputProps={{ maxLength: 11 }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            multiline
            rows={2}
          />

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle2">Message Content</Typography>
              <Button
                size="small"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleAddVariable}
              >
                Add Variable
              </Button>
            </Stack>

            {Array.isArray(formData.variables) && formData.variables.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Variables:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(Array.isArray(formData.variables) ? formData.variables : []).map((variable) => (
                    <Chip
                      key={variable}
                      label={`{{${variable}}}`}
                      size="small"
                      onDelete={() => handleRemoveVariable(variable)}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={8}
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter your SMS message here..."
              helperText="Use {{variable}} syntax for dynamic content"
              required
            />

            {/* SMS Stats */}
            <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.neutral' }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Characters
                  </Typography>
                  <Typography variant="h6">
                    {stats.length}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Messages
                  </Typography>
                  <Typography variant="h6" color={stats.messageCount > 1 ? 'warning.main' : 'text.primary'}>
                    {stats.messageCount}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Remaining
                  </Typography>
                  <Typography variant="h6" color={stats.remainingChars < 20 ? 'error.main' : 'text.primary'}>
                    {stats.remainingChars}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={(stats.length / (stats.messageCount * (stats.length > SMS_MAX_LENGTH ? SMS_MULTIPART_LENGTH : SMS_MAX_LENGTH))) * 100}
                  color={stats.messageCount > 2 ? 'warning' : 'primary'}
                />
                {stats.messageCount > 1 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    This message will be sent as {stats.messageCount} SMS messages
                  </Alert>
                )}
              </Box>
            </Paper>
          </Box>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={handleSaveDraft}
              disabled={loading || !formData.business_id || !formData.name}
            >
              {loading ? <CircularProgress size={24} /> : 'Save as Draft'}
            </Button>
            <Button
              variant="contained"
              onClick={handlePublish}
                disabled={loading || !formData.business_id || !formData.name || !formData.content}
            >
              {loading ? <CircularProgress size={24} /> : 'Publish Template'}
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {/* Mobile Phone Preview */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Box sx={{ position: 'sticky', top: 20 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Preview
          </Typography>

          {/* Mobile Frame */}
          <Paper
            elevation={3}
            sx={{
              width: 320,
              height: 640,
              mx: 'auto',
              borderRadius: 6,
              overflow: 'hidden',
              border: '12px solid #1f1f1f',
              background: '#000',
              position: 'relative',
            }}
          >
            {/* Phone Notch */}
            <Box
              sx={{
                width: 120,
                height: 24,
                background: '#1f1f1f',
                borderRadius: '0 0 16px 16px',
                mx: 'auto',
              }}
            />

            {/* SMS UI */}
            <Box
              sx={{
                height: 'calc(100% - 24px)',
                background: '#f5f5f5',
                p: 2,
                overflow: 'auto',
              }}
            >
              {/* SMS Header */}
              <Box
                sx={{
                  background: 'white',
                  p: 1.5,
                  borderRadius: 1,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Iconify icon="mingcute:add-line" width={24} />
                <Box>
                  <Typography variant="subtitle2">
                    {formData.sender_id || 'SMS'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Text Message
                  </Typography>
                </Box>
              </Box>

              {/* Message Bubble */}
              <Box>
                <Paper
                  sx={{
                    background: 'white',
                    p: 1.5,
                    borderRadius: 2,
                    boxShadow: 1,
                  }}
                >
                  <Typography variant="caption" color="primary" fontWeight="bold" display="block" mb={0.5}>
                    {formData.sender_id || 'SMS'}
                  </Typography>

                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {renderPreview() || 'Your SMS message will appear here...'}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      textAlign: 'right',
                      color: 'text.secondary',
                      mt: 1,
                    }}
                  >
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Grid>
    </Grid>
  );
}

