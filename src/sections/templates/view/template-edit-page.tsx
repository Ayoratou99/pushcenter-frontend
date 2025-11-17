import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import type { EditorRef } from 'react-email-editor';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import EmailEditor from 'react-email-editor';
import { useRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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

import { DashboardContent } from 'src/layouts/dashboard';
import { 
  emailTemplateService,
  smsTemplateService,
  whatsappTemplateService,
  type Template 
} from 'src/services';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function TemplateEditPage() {
  const { id, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const emailEditorRef = useRef<EditorRef>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
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
    if (id && type) {
      loadTemplate();
    }
  }, [id, type]);

  const loadTemplate = async () => {
    try {
      setLoadingTemplate(true);
      
      let response;
      if (type === 'email') {
        response = await emailTemplateService.getById(Number(id));
      } else if (type === 'sms') {
        response = await smsTemplateService.getById(Number(id));
      } else if (type === 'whatsapp') {
        response = await whatsappTemplateService.getById(Number(id));
      } else {
        throw new Error('Invalid template type');
      }
      
      const template = response.data;

      setFormData({
        business_id: template.business_id || '',
        name: template.name || '',
        description: template.description || '',
        category: (template.category as any) || 'marketing',
        subject: (template as any).subject || '',
      });

      // Set variables
      if (template.variables && Array.isArray(template.variables)) {
        setVariables(template.variables);
      }

      // Set editor content
      if (template.type === 'email') {
        if ((template as any).html) {
          setCkeditorContent((template as any).html);
          // Check if it has design (Unlayer) or just HTML (CKEditor)
          if ((template as any).design) {
            setEditorType('unlayer');
            // Load design into Unlayer when editor is ready
            setTimeout(() => {
              if (emailEditorRef.current?.editor && (template as any).design) {
                emailEditorRef.current.editor.loadDesign((template as any).design);
              }
            }, 1000);
          } else {
            setEditorType('ckeditor');
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load template:', err);
      setError(err.response?.data?.message || 'Failed to load template');
    } finally {
      setLoadingTemplate(false);
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
        setCkeditorContent((prev) => prev + ` {{${varName}}}`);
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
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = ckeditorContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';

      return Promise.resolve({
        html: ckeditorContent,
        plain_text: plainText,
      });
    }
  };

  const handleSave = async () => {
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
        ...(exportedData.design && { design: exportedData.design }),
        html: exportedData.html,
        ...(exportedData.plain_text && { plain_text: exportedData.plain_text }),
        variables: safeVariables.length > 0 ? safeVariables : undefined,
      };

      if (type === 'email') {
        await emailTemplateService.update(Number(id), templateData);
      } else if (type === 'sms') {
        await smsTemplateService.update(Number(id), templateData);
      } else if (type === 'whatsapp') {
        await whatsappTemplateService.update(Number(id), templateData);
      }
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate(`/templates/${type}/${id}/view`);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.name?.[0] || 'Failed to update template';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingTemplate) {
    return (
      <DashboardContent>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<Iconify icon="solar:arrow-left-outline" />}
          onClick={() => navigate(`/templates/${id}/view`)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" flexGrow={1}>
          Edit Template
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Template updated successfully! Redirecting...
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

            {formData.subject !== undefined && (
              <TextField
                fullWidth
                required
                label="Email Subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="e.g. Welcome to our platform!"
                helperText="You can use {{variable}} syntax in the subject"
              />
            )}

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

            <Button
              fullWidth
              variant="contained"
              onClick={handleSave}
              disabled={loading || !formData.name}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
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
    </DashboardContent>
  );
}
