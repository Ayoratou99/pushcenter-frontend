import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import CardContent from '@mui/material/CardContent';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { type Business, businessService, whatsappTemplateService } from 'src/services';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type HeaderType = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
type ButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'CATALOG';

interface WhatsAppButton {
  type: ButtonType;
  text: string;
  url?: string;
  phone?: string;
}

export function WhatsAppTemplateEditor() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  // Template form data
  const [formData, setFormData] = useState<{
    business_id: number | '';
    name: string;
    description: string;
    category: 'MARKETING' | 'TRANSACTIONAL' | 'UTILITY';
    language: string;
  }>({
    business_id: '',
    name: '',
    description: '',
    category: 'MARKETING',
    language: 'en',
  });

  // Template components
  const [headerType, setHeaderType] = useState<HeaderType>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [headerMediaFile, setHeaderMediaFile] = useState<File | null>(null);
  
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  
  const [buttons, setButtons] = useState<WhatsAppButton[]>([]);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setLoadingBusinesses(true);
      const response = await businessService.getAll({ per_page: 100 });
      setBusinesses(response.data.data);
      
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size based on type
      const maxSizes: Record<string, number> = {
        IMAGE: 8 * 1024 * 1024, // 8MB
        VIDEO: 25 * 1024 * 1024, // 25MB
        DOCUMENT: 25 * 1024 * 1024, // 25MB
      };

      if (headerType !== 'TEXT' && headerType !== 'NONE' && file.size > maxSizes[headerType]) {
        setError(`File too large! Maximum ${maxSizes[headerType] / 1024 / 1024}MB for ${headerType}`);
        return;
      }

      setHeaderMediaFile(file);
      setHeaderMediaUrl(URL.createObjectURL(file));
    }
  };

  const addButton = () => {
    if (buttons.length >= 3) {
      setError('Maximum 3 buttons allowed');
      return;
    }
    setButtons([...buttons, { type: 'QUICK_REPLY', text: '' }]);
  };

  const updateButton = (index: number, field: keyof WhatsAppButton, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\d+)\}\}/g;
    const matches = [...text.matchAll(regex)];
    return [...new Set(matches.map(m => m[1]))].sort();
  };

  const renderPreview = () => {
    let previewBodyText = bodyText;
    const variables = extractVariables(bodyText);
    variables.forEach((varNum) => {
      previewBodyText = previewBodyText.replace(new RegExp(`\\{\\{${varNum}\\}\\}`, 'g'), `[var${varNum}]`);
    });

    let previewHeaderText = headerText;
    if (headerType === 'TEXT') {
      const headerVars = extractVariables(headerText);
      headerVars.forEach((varNum) => {
        previewHeaderText = previewHeaderText.replace(new RegExp(`\\{\\{${varNum}\\}\\}`, 'g'), `[var${varNum}]`);
      });
    }

    return { previewBodyText, previewHeaderText };
  };

  const handleSaveDraft = async () => {
    await handleSave('DRAFT');
  };

  const handleSubmitForApproval = async () => {
    await handleSave('PENDING');
  };

  const handleSave = async (status: 'DRAFT' | 'PENDING') => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.business_id) {
        setError('Please select a business');
        return;
      }

      if (!bodyText.trim()) {
        setError('Body text is required');
        return;
      }

      // Build components array
      const components: any[] = [];

      // Add header if exists
      if (headerType !== 'NONE') {
        if (headerType === 'TEXT') {
          components.push({
            type: 'HEADER',
            format: 'TEXT',
            text: headerText,
          });
        } else {
          components.push({
            type: 'HEADER',
            format: headerType,
            // In production, you'd upload the media file first and get the media_id
            example: {
              header_handle: [headerMediaUrl], // This would be the uploaded media URL
            },
          });
        }
      }

      // Add body (required)
      components.push({
        type: 'BODY',
        text: bodyText,
      });

      // Add footer if exists
      if (footerText.trim()) {
        components.push({
          type: 'FOOTER',
          text: footerText,
        });
      }

      // Add buttons if exist
      if (buttons.length > 0) {
        const buttonComponents = buttons.map((btn) => {
          if (btn.type === 'QUICK_REPLY') {
            return { type: 'QUICK_REPLY', text: btn.text };
          }
          if (btn.type === 'URL') {
            return { type: 'URL', text: btn.text, url: btn.url };
          }
          if (btn.type === 'PHONE_NUMBER') {
            return { type: 'PHONE_NUMBER', text: btn.text, phone_number: btn.phone };
          }
          if (btn.type === 'CATALOG') {
            return { type: 'CATALOG', text: 'View catalog' };
          }
          return btn;
        });

        components.push({
          type: 'BUTTONS',
          buttons: buttonComponents,
        });
      }

      const templateData = {
        business_id: Number(formData.business_id),
        name: formData.name,
        display_name: formData.name,
        description: formData.description,
        language: formData.language,
        category: formData.category,
        status: status.toLowerCase() as 'draft' | 'pending',
        is_active: status === 'PENDING',
        body: bodyText,
        components,
        metadata: {
          header_type: headerType,
          header_text: headerType === 'TEXT' ? headerText : null,
          header_media_url: headerType !== 'TEXT' && headerType !== 'NONE' ? headerMediaUrl : null,
          footer: footerText,
          buttons: buttons.length > 0 ? buttons : null,
        },
      };

      await whatsappTemplateService.create(templateData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Reset form
      setHeaderType('NONE');
      setHeaderText('');
      setHeaderMediaUrl('');
      setHeaderMediaFile(null);
      setBodyText('');
      setFooterText('');
      setButtons([]);
      setFormData({
        business_id: formData.business_id,
        name: '',
        description: '',
        category: 'MARKETING',
        language: 'en',
      });
    } catch (err: any) {
      console.error('Failed to save template:', err);
      setError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const { previewBodyText, previewHeaderText } = renderPreview();

  if (loadingBusinesses) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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

          {/* Basic Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Stack spacing={2}>
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
                  required
                  label="Template Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., order_confirmation"
                  helperText="Use lowercase letters, numbers, and underscores only"
                />

                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={2}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        label="Category"
                        onChange={(e) => handleInputChange('category', e.target.value)}
                      >
                        <MenuItem value="MARKETING">Marketing</MenuItem>
                        <MenuItem value="TRANSACTIONAL">Transactional</MenuItem>
                        <MenuItem value="UTILITY">Utility</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={formData.language}
                        label="Language"
                        onChange={(e) => handleInputChange('language', e.target.value)}
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="en_US">English (US)</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>

          {/* Header Component */}
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Header (Optional)</Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={headerType}
                    label="Type"
                    onChange={(e) => setHeaderType(e.target.value as HeaderType)}
                  >
                    <MenuItem value="NONE">None</MenuItem>
                    <MenuItem value="TEXT">Text</MenuItem>
                    <MenuItem value="IMAGE">Image</MenuItem>
                    <MenuItem value="VIDEO">Video</MenuItem>
                    <MenuItem value="DOCUMENT">Document</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {headerType === 'TEXT' && (
                <TextField
                  fullWidth
                  label="Header Text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="e.g., Welcome {'{{'}}1{'}}'}!"
                  helperText="Use {'{{'}}1{'}}'}, {'{{'}}2{'}}'} for variables"
                />
              )}

              {headerType !== 'NONE' && headerType !== 'TEXT' && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Facebook WhatsApp Limits:
                    </Typography>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                      {headerType === 'IMAGE' && (
                        <>
                          <li>Max size: 8 MB</li>
                          <li>Formats: JPEG, PNG, GIF</li>
                        </>
                      )}
                      {headerType === 'VIDEO' && (
                        <>
                          <li>Max size: 25 MB</li>
                          <li>Formats: MP4, MOV</li>
                        </>
                      )}
                      {headerType === 'DOCUMENT' && (
                        <>
                          <li>Max size: 25 MB</li>
                          <li>Formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT</li>
                        </>
                      )}
                    </ul>
                  </Alert>

                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Iconify icon="solar:cloud-upload-bold" />}
                    fullWidth
                  >
                    Upload {headerType}
                    <input
                      type="file"
                      hidden
                      accept={
                        headerType === 'IMAGE' ? 'image/*' :
                        headerType === 'VIDEO' ? 'video/mp4,video/mov' :
                        '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
                      }
                      onChange={handleFileSelect}
                    />
                  </Button>

                  {headerMediaUrl && (
                    <Box mt={2}>
                      {headerType === 'IMAGE' && (
                        <img src={headerMediaUrl} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                      )}
                      {headerType === 'VIDEO' && (
                        <video src={headerMediaUrl} controls style={{ maxWidth: '100%', borderRadius: '8px' }} />
                      )}
                      {headerType === 'DOCUMENT' && (
                        <Alert severity="success">Document uploaded: {headerMediaFile?.name}</Alert>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Body Component */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Body (Required) <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                required
                multiline
                rows={6}
                label="Message Content"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Your main message here..."
                helperText="Use {'{{'}}1{'}}'}, {'{{'}}2{'}}'}, {'{{'}}3{'}}'} for variables"
              />
              <Typography variant="caption" color="text.secondary" mt={1} display="block">
                Variables found: {extractVariables(bodyText).join(', ') || 'None'}
              </Typography>
            </CardContent>
          </Card>

          {/* Footer Component */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Footer (Optional)
              </Typography>
              <TextField
                fullWidth
                label="Footer Text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                inputProps={{ maxLength: 60 }}
                helperText={`${footerText.length}/60 characters`}
                placeholder="e.g., Thank you for your trust"
              />
            </CardContent>
          </Card>

          {/* Buttons Component */}
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Buttons (Optional)</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={addButton}
                  disabled={buttons.length >= 3}
                >
                  Add Button
                </Button>
              </Stack>

              <Stack spacing={2}>
                {buttons.map((button, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={button.type}
                            label="Type"
                            onChange={(e) => updateButton(index, 'type', e.target.value)}
                          >
                            <MenuItem value="QUICK_REPLY">Quick Reply</MenuItem>
                            <MenuItem value="URL">URL</MenuItem>
                            <MenuItem value="PHONE_NUMBER">Phone</MenuItem>
                            <MenuItem value="CATALOG">Catalog</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <TextField
                          size="small"
                          fullWidth
                          label="Button Text"
                          value={button.text}
                          onChange={(e) => updateButton(index, 'text', e.target.value)}
                          inputProps={{ maxLength: 20 }}
                          disabled={button.type === 'CATALOG'}
                          placeholder={button.type === 'CATALOG' ? 'View catalog' : 'Button text'}
                        />

                        <IconButton color="error" onClick={() => removeButton(index)}>
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Stack>

                      {button.type === 'URL' && (
                        <TextField
                          size="small"
                          fullWidth
                          label="URL"
                          value={button.url || ''}
                          onChange={(e) => updateButton(index, 'url', e.target.value)}
                          placeholder="https://example.com"
                        />
                      )}

                      {button.type === 'PHONE_NUMBER' && (
                        <TextField
                          size="small"
                          fullWidth
                          label="Phone Number"
                          value={button.phone || ''}
                          onChange={(e) => updateButton(index, 'phone', e.target.value)}
                          placeholder="+1234567890"
                        />
                      )}

                      {button.type === 'CATALOG' && (
                        <Alert severity="info">
                          This button will display your WhatsApp Business catalog. Only one catalog button is allowed.
                        </Alert>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Actions */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Iconify icon="solar:diskette-bold" />}
              onClick={handleSaveDraft}
              disabled={loading}
            >
              Save as Draft
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<Iconify icon="solar:paper-plane-bold" />}
              onClick={handleSubmitForApproval}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Submit for Approval'}
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {/* WhatsApp Preview */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Box sx={{ position: 'sticky', top: 20 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            WhatsApp Preview
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

            {/* WhatsApp UI */}
            <Box
              sx={{
                height: 'calc(100% - 24px)',
                background: '#0b141a',
                overflow: 'auto',
              }}
            >
              {/* WhatsApp Header */}
              <Box
                sx={{
                  background: '#202c33',
                  color: '#e9edef',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #3b4a54',
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#00a884',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                    fontSize: '18px',
                    fontWeight: 'bold',
                  }}
                >
                  W
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '15px', color: '#e9edef' }}>
                    Your Business
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '11px', color: '#e9edef' }}>
                    Online
                  </Typography>
                </Box>
              </Box>

              {/* Chat Area */}
              <Box sx={{ p: 2, minHeight: 450, background: 'linear-gradient(to bottom, #0b141a 0%, #1a2c38 100%)' }}>
                <Box
                  sx={{
                    maxWidth: '85%',
                    ml: 'auto',
                    background: '#005c4b',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                    {/* Header Preview */}
                    {headerType === 'TEXT' && headerText && (
                      <Box
                        sx={{
                          background: '#00695c',
                          color: '#e9edef',
                          p: 1.5,
                          fontSize: '14px',
                          fontWeight: 600,
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {previewHeaderText || 'Header text...'}
                      </Box>
                    )}
                    {headerType === 'IMAGE' && headerMediaUrl && (
                      <Box sx={{ position: 'relative', width: '100%' }}>
                        <img 
                          src={headerMediaUrl} 
                          alt="Header" 
                          style={{ 
                            width: '100%', 
                            height: 'auto',
                            maxHeight: '200px',
                            objectFit: 'cover',
                            display: 'block',
                            borderRadius: '8px 8px 0 0',
                          }} 
                        />
                      </Box>
                    )}
                    {headerType === 'VIDEO' && headerMediaUrl && (
                      <Box sx={{ position: 'relative', width: '100%' }}>
                        <video 
                          src={headerMediaUrl} 
                          style={{ 
                            width: '100%', 
                            height: 'auto',
                            maxHeight: '200px',
                            objectFit: 'cover',
                            display: 'block',
                            borderRadius: '8px 8px 0 0',
                          }} 
                          controls 
                        />
                      </Box>
                    )}

                    {/* Body Preview */}
                    <Box sx={{ 
                      p: 1.5, 
                      color: '#e9edef', 
                      fontSize: '14px', 
                      lineHeight: 1.5, 
                      whiteSpace: 'pre-wrap',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}>
                      {previewBodyText || 'Your message will appear here...'}
                    </Box>

                    {/* Footer Preview */}
                    {footerText && (
                      <Box sx={{ 
                        px: 1.5, 
                        pb: 1, 
                        pt: 0.5,
                        color: '#8696a0', 
                        fontSize: '11px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}>
                        {footerText}
                      </Box>
                    )}

                    {/* Message Time */}
                    <Box sx={{ 
                      px: 1.5, 
                      pb: 0.5, 
                      textAlign: 'right',
                      color: '#8696a0',
                      fontSize: '10px',
                    }}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Box>

                    {/* Buttons Preview */}
                    {buttons.length > 0 && (
                      <Box sx={{ p: 1, pt: 0.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        {buttons.map((btn, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              p: 1,
                              mb: idx < buttons.length - 1 ? 0.5 : 0,
                              color: '#00a0e3',
                              fontSize: '13px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              borderRadius: '4px',
                              '&:hover': {
                                background: 'rgba(0,160,227,0.1)',
                              },
                            }}
                          >
                            {btn.type === 'URL' && <Iconify icon="solar:link-bold" sx={{ mr: 0.5, fontSize: 14 }} />}
                            {btn.type === 'PHONE_NUMBER' && <Iconify icon="solar:phone-bold" sx={{ mr: 0.5, fontSize: 14 }} />}
                            {btn.type === 'CATALOG' && <Iconify icon="solar:shop-bold" sx={{ mr: 0.5, fontSize: 14 }} />}
                            {btn.type === 'CATALOG' ? 'View catalog' : btn.text || 'Button'}
                          </Box>
                        ))}
                      </Box>
                    )}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Grid>
    </Grid>
  );
}
