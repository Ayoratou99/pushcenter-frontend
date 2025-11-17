import type { EditorRef } from 'react-email-editor';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import EmailEditor from 'react-email-editor';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';

import { Iconify } from 'src/components/iconify';

import { emailTemplateService, businessService, type Business } from 'src/services';

// ----------------------------------------------------------------------

export function EmailTemplateEditor() {
  const emailEditorRef = useRef<EditorRef>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [editorType, setEditorType] = useState<'unlayer' | 'ckeditor'>('unlayer');
  const [ckeditorContent, setCkeditorContent] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [variableDialogOpen, setVariableDialogOpen] = useState(false);
  const [newVariableName, setNewVariableName] = useState('');

  // Ensure variables is always an array
  const safeVariables = Array.isArray(variables) ? variables : [];

  const [formData, setFormData] = useState<{
    business_id: number | '';
    name: string;
    description: string;
    category: 'marketing' | 'transactional' | 'notification';
    subject: string;
  }>({
    business_id: '',
    name: '',
    description: '',
    category: 'marketing',
    subject: '',
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
    setVariableDialogOpen(true);
  };

  const handleConfirmAddVariable = () => {
    const varName = newVariableName.trim();
    if (!varName) return;
    
    if (!safeVariables.includes(varName)) {
      setVariables([...safeVariables, varName]);
      setNewVariableName('');
      setVariableDialogOpen(false);
      
      // Insert variable into editor
      if (editorType === 'ckeditor') {
        // For CKEditor, we'll insert it at cursor position
        // This is a simplified version - in production, you'd use CKEditor's API
        setCkeditorContent((prev) => prev + ` {{${varName}}}`);
      } else {
        // For Unlayer, variables can be inserted via the editor API
        // This is a placeholder - Unlayer has its own variable system
        const unlayer = emailEditorRef.current?.editor;
        if (unlayer) {
          // Unlayer handles variables differently, but we'll track them
          console.log('Variable added for Unlayer:', varName);
        }
      }
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setVariables(safeVariables.filter((v) => v && v !== variable));
  };

  const exportHtml = async (): Promise<{ design?: any; html: string; plain_text?: string }> => {
    if (editorType === 'unlayer') {
      return new Promise((resolve) => {
        const unlayer = emailEditorRef.current?.editor;
        
        unlayer?.exportHtml((data: any) => {
          const { design, html } = data;
          resolve({ design, html });
        });
      });
    } else {
      // CKEditor - just return HTML
      // Convert HTML to plain text (simple version)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = ckeditorContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      return Promise.resolve({
        html: ckeditorContent,
        plain_text: plainText,
      });
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.business_id) {
        setError('Please select a business');
        return;
      }

      const exportedData = await exportHtml();

      const templateData = {
        ...formData,
        business_id: Number(formData.business_id),
        type: 'email' as const,
        status: 'draft' as const,
        is_active: false,
        ...(exportedData.design && { design: exportedData.design }),
        html: exportedData.html,
        ...(exportedData.plain_text && { plain_text: exportedData.plain_text }),
        variables: (safeVariables.length > 0) ? safeVariables : undefined,
      };

      await emailTemplateService.create(templateData);
      setSuccess(true);
      setError(null);
      // Clear form after successful save
      setFormData({
        business_id: '',
        name: '',
        description: '',
        category: 'marketing',
        subject: '',
      });
      setCkeditorContent('');
      setVariables([]);
      setNewVariableName('');
      // Reset Unlayer editor if it exists
      if (emailEditorRef.current?.editor) {
        emailEditorRef.current.editor.loadDesign({});
      }
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.name?.[0] || 'Failed to save template';
      setError(errorMessage);
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

      const exportedData = await exportHtml();

      const templateData = {
        ...formData,
        business_id: Number(formData.business_id),
        type: 'email' as const,
        status: 'active' as const,
        is_active: true,
        ...(exportedData.design && { design: exportedData.design }),
        html: exportedData.html,
        ...(exportedData.plain_text && { plain_text: exportedData.plain_text }),
        variables: (safeVariables.length > 0) ? safeVariables : undefined,
      };

      await emailTemplateService.create(templateData);
      setSuccess(true);
      setError(null);
      // Clear form after successful publish
      setFormData({
        business_id: '',
        name: '',
        description: '',
        category: 'marketing',
        subject: '',
      });
      setCkeditorContent('');
      setVariables([]);
      setNewVariableName('');
      // Reset Unlayer editor if it exists
      if (emailEditorRef.current?.editor) {
        emailEditorRef.current.editor.loadDesign({});
      }
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.name?.[0] || 'Failed to publish template';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingBusinesses) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Email template saved successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Side - Form Fields */}
        <Grid size={{ xs: 12, md: 4 }}>
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
              required
              label="Template Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g. Welcome Email"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the purpose of this template"
            />

            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="transactional">Transactional</MenuItem>
                <MenuItem value="notification">Notification</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              required
              label="Email Subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="e.g. Welcome to our platform!"
              helperText="You can use double braces for variables, e.g. {{name}}"
            />

            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2">
                  Variables
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={handleAddVariable}
                >
                  Add Variable
                </Button>
              </Box>
              {safeVariables.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                  {safeVariables.filter(v => v).map((variable: string, index: number) => (
                    <Chip
                      key={variable || `var-${index}`}
                      label={`{{${variable}}}`}
                      onDelete={() => handleRemoveVariable(variable)}
                      size="small"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  No variables added. Click "Add Variable" to add dynamic content placeholders.
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Use {'{{'} variable {'}}'} syntax in your email content to insert dynamic values.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Editor Type
              </Typography>
              <ToggleButtonGroup
                value={editorType}
                exclusive
                onChange={(_, newType) => {
                  if (newType !== null) {
                    setEditorType(newType);
                  }
                }}
                aria-label="editor type"
                fullWidth
              >
                <ToggleButton value="unlayer" aria-label="unlayer">
                  Unlayer (Drag & Drop)
                </ToggleButton>
                <ToggleButton value="ckeditor" aria-label="ckeditor">
                  CKEditor (Rich Text)
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleSaveDraft}
                disabled={loading || !formData.business_id || !formData.name}
              >
                {loading ? 'Saving...' : 'Save Draft'}
              </Button>

              <Button
                fullWidth
                variant="contained"
                onClick={handlePublish}
                disabled={loading || !formData.business_id || !formData.name}
              >
                {loading ? 'Publishing...' : 'Publish'}
              </Button>
            </Stack>
          </Stack>
        </Grid>

        {/* Right Side - Email Editor */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
              height: '600px',
            }}
          >
            {editorType === 'unlayer' ? (
              <EmailEditor ref={emailEditorRef} minHeight="600px" />
            ) : (
              <Box sx={{ height: '100%', '& .ck-editor': { height: '100%' }, '& .ck-editor__editable': { minHeight: '550px' } }}>
                <CKEditor
                  editor={ClassicEditor}
                  data={ckeditorContent}
                  onChange={(_, editor) => {
                    const data = editor.getData();
                    setCkeditorContent(data);
                  }}
                  config={{
                    toolbar: [
                      'heading',
                      '|',
                      'bold',
                      'italic',
                      'link',
                      'bulletedList',
                      'numberedList',
                      '|',
                      'outdent',
                      'indent',
                      '|',
                      'blockQuote',
                      'insertTable',
                      '|',
                      'imageUpload',
                      'mediaEmbed',
                      '|',
                      'undo',
                      'redo',
                    ],
                  }}
                />
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Variable Dialog */}
      <Dialog open={variableDialogOpen} onClose={() => setVariableDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Variable</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter a variable name (e.g., name, email, amount). This will be used as {'{{'} variable {'}}'} in your template.
            </Typography>
            <TextField
              fullWidth
              label="Variable Name"
              value={newVariableName}
              onChange={(e) => setNewVariableName(e.target.value)}
              placeholder="e.g. name, email, amount"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmAddVariable();
                }
              }}
              helperText="Use lowercase letters, numbers, and underscores only"
            />
            {safeVariables.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Existing variables:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {safeVariables.filter(v => v).map((variable: string, index: number) => (
                    <Chip key={variable || `existing-var-${index}`} label={`{{${variable}}}`} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setVariableDialogOpen(false);
            setNewVariableName('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAddVariable}
            variant="contained"
            disabled={!newVariableName.trim() || safeVariables.includes(newVariableName.trim())}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
