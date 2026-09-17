import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { 
  type Template,
  smsTemplateService,
  emailTemplateService,
  whatsappTemplateService 
} from 'src/services';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function TemplateViewPage() {
  const { id, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && type) {
      loadTemplate();
    }
  }, [id, type]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      setTemplate({ ...response.data, type } as Template);
    } catch (err: any) {
      console.error('Failed to load template:', err);
      setError(err.response?.data?.message || 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeColor = (templateType: string) => {
    switch (templateType) {
      case 'email':
        return 'primary';
      case 'sms':
        return 'secondary';
      case 'whatsapp':
        return 'success';
      default:
        return 'default';
    }
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

  if (error || !template) {
    return (
      <DashboardContent>
        <Card sx={{ p: 3 }}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h6" color="error">
              {error || 'Template not found'}
            </Typography>
            <Button variant="contained" onClick={() => navigate('/templates')}>
              Back to Templates
            </Button>
          </Stack>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<Iconify icon="solar:arrow-left-outline" />}
          onClick={() => navigate('/templates')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" flexGrow={1}>
          Template Details
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:pen-bold" />}
          onClick={() => navigate(`/templates/${id}/edit`)}
        >
          Edit
        </Button>
      </Box>

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Name
            </Typography>
            <Typography variant="h6">{template.name}</Typography>
          </Box>

          <Box display="flex" gap={2} flexWrap="wrap">
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Type
              </Typography>
              <Chip label={template.type} color={getTypeColor(template.type)} size="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Status
              </Typography>
              <Chip label={template.status} color={getStatusColor(template.status)} size="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Category
              </Typography>
              <Chip label={template.category} size="small" />
            </Box>
          </Box>

          {template.description && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">{template.description}</Typography>
            </Box>
          )}

          {template.template_identifier && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Template Identifier
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: 'background.neutral',
                  p: 1,
                  borderRadius: 1,
                }}
              >
                {template.template_identifier}
              </Typography>
            </Box>
          )}

          {template.variables && Array.isArray(template.variables) && template.variables.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Variables
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {template.variables.map((variable: string, index: number) => (
                  <Chip key={variable || index} label={`{{${variable}}}`} size="small" />
                ))}
              </Box>
            </Box>
          )}

          <Box display="flex" gap={2} flexWrap="wrap">
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Usage Count
              </Typography>
              <Typography variant="body1">{template.usage_count || 0}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Created At
              </Typography>
              <Typography variant="body1">
                {new Date(template.created_at).toLocaleString()}
              </Typography>
            </Box>
            {template.last_used_at && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Last Used At
                </Typography>
                <Typography variant="body1">
                  {new Date(template.last_used_at).toLocaleString()}
                </Typography>
              </Box>
            )}
          </Box>

          {template.type === 'email' && (template as any).subject && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Email Subject
              </Typography>
              <Typography variant="body1">{(template as any).subject}</Typography>
            </Box>
          )}

          {/* Message for old templates without preview data */}
          {((template.type === 'email' && !(template as any).html && !(template as any).subject) ||
            (template.type === 'whatsapp' && !(template as any).metadata && !(template as any).body) ||
            (template.type === 'sms' && !(template as any).metadata && !(template as any).message)) && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'warning.main',
                borderRadius: 1,
                p: 3,
                bgcolor: 'warning.lighter',
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" color="warning.dark" gutterBottom>
                No Preview Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This template was created with an older version and doesn&apos;t have preview data.
                Please create a new template to see the preview functionality.
              </Typography>
            </Box>
          )}

          {/* Email Template Preview */}
          {template.type === 'email' && (template as any).html && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Email Preview
              </Typography>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: 'background.neutral',
                  minHeight: 200,
                  maxHeight: 600,
                  overflow: 'auto',
                }}
                dangerouslySetInnerHTML={{ __html: (template as any).html || '' }}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Raw HTML
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    bgcolor: 'background.neutral',
                    maxHeight: 300,
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {(template as any).html || ''}
                </Box>
              </Box>
            </Box>
          )}

          {/* WhatsApp Template Preview */}
          {template.type === 'whatsapp' && ((template as any).metadata || (template as any).body) && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                WhatsApp Preview
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Paper
                  elevation={3}
                  sx={{
                    width: 320,
                    height: 640,
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
                      background: '#e5ddd5',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'260\' height=\'260\' viewBox=\'0 0 260 260\'%3E%3Cpath fill=\'%23000000\' fill-opacity=\'0.04\' d=\'M0 130l130-130L0 0z\'/%3E%3C/svg%3E")',
                      p: 2,
                      overflow: 'auto',
                    }}
                  >
                    {/* WhatsApp Header */}
                    <Box
                      sx={{
                        position: 'sticky',
                        top: 0,
                        background: '#075e54',
                        color: 'white',
                        p: 1.5,
                        borderRadius: 1,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#25D366',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          W
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Your Business</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Online
                        </Typography>
                      </Box>
                    </Box>

                    {/* Message Bubble */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                      <Paper
                        sx={{
                          maxWidth: '75%',
                          background: '#dcf8c6',
                          p: 1.5,
                          borderRadius: 2,
                          borderBottomRightRadius: 0,
                          position: 'relative',
                        }}
                      >
                        {(() => {
                          const mediaUrl = (template as any).metadata?.media_url || (template as any).header?.media_url;
                          return mediaUrl ? (
                            <Box
                              component="img"
                              src={mediaUrl}
                              alt="Preview"
                              sx={{
                                width: '100%',
                                borderRadius: 1,
                                mb: 1,
                                maxHeight: 200,
                                objectFit: 'cover',
                              }}
                              onError={(e: any) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : null;
                        })()}

                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {(() => {
                            let content = (template as any).metadata?.content || (template as any).body || '';
                            if (template.variables && Array.isArray(template.variables)) {
                              template.variables.forEach((variable: string) => {
                                content = content.replace(new RegExp(`{{${variable}}}`, 'g'), `[${variable}]`);
                              });
                            }
                            return content || 'Your message will appear here...';
                          })()}
                        </Typography>

                        {(() => {
                          const buttonText = (template as any).metadata?.button_text || (template as any).buttons?.[0]?.text;
                          const buttonUrl = (template as any).metadata?.button_url || (template as any).buttons?.[0]?.url;
                          return buttonText ? (
                            <Button
                              variant="outlined"
                              size="small"
                              fullWidth
                              sx={{
                                mt: 1,
                                borderColor: '#075e54',
                                color: '#075e54',
                                textTransform: 'none',
                              }}
                              href={buttonUrl || '#'}
                              target="_blank"
                            >
                              {buttonText}
                            </Button>
                          ) : null;
                        })()}

                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.6 }}>
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}

          {/* SMS Template Preview */}
          {template.type === 'sms' && ((template as any).metadata || (template as any).message) && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                SMS Preview
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Paper
                  elevation={3}
                  sx={{
                    width: 320,
                    height: 640,
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
                        background: '#fff',
                        p: 1.5,
                        borderRadius: 1,
                        mb: 2,
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        From: {(template as any).metadata?.sender_id || (template as any).sender_id || 'SMS'}
                      </Typography>
                    </Box>

                    {/* Message Content */}
                    <Paper
                      sx={{
                        background: '#fff',
                        p: 2,
                        borderRadius: 1,
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {(() => {
                          let content = (template as any).metadata?.content || (template as any).message || '';
                          if (template.variables && Array.isArray(template.variables)) {
                            template.variables.forEach((variable: string) => {
                              content = content.replace(new RegExp(`{{${variable}}}`, 'g'), `[${variable}]`);
                            });
                          }
                          return content || 'Your SMS message will appear here...';
                        })()}
                      </Typography>

                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                        {(() => {
                          const content = (template as any).metadata?.content || (template as any).message || '';
                          return (
                            <>
                              <Typography variant="caption" color="text.secondary">
                                Characters: {content.length}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                Segments: {Math.ceil(content.length / 160)}
                              </Typography>
                            </>
                          );
                        })()}
                      </Box>
                    </Paper>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}
        </Stack>
      </Card>
    </DashboardContent>
  );
}

