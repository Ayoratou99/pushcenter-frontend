import type { ImportPreview } from 'src/services/template-transfer.service';

import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';

import { templateTransferService } from 'src/services/template-transfer.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type BusinessOption = { id: number; name: string };

type Props = {
  open: boolean;
  businesses: BusinessOption[];
  onClose: () => void;
  onImported: (message: string) => void;
};

const TYPE_LABEL: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

/**
 * Import a .json or .txt template export. The file carries the template type,
 * so the only thing to pick is the application it gets attached to.
 */
export function TemplateImportDialog({ open, businesses, onClose, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [businessId, setBusinessId] = useState<string>('');
  const [name, setName] = useState('');
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setBusinessId('');
    setName('');
    setError('');
    setDragging(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = useCallback(async (selected: File) => {
    setError('');
    setPreview(null);
    setName('');
    setFile(selected);
    setReading(true);

    try {
      const result = await templateTransferService.preview(selected);
      setPreview(result);

      if (result.count === 1) {
        setName(result.templates[0].name);
      }
    } catch (err: any) {
      setPreview(null);
      setError(
        err?.response?.data?.errors?.file?.[0] ||
          err?.response?.data?.message ||
          'This file could not be read. Use a .json or .txt export produced by AninfPush.'
      );
    } finally {
      setReading(false);
    }
  }, []);

  const handleImport = async () => {
    if (!file || !businessId) return;

    setImporting(true);
    setError('');

    try {
      const response = await templateTransferService.import({
        file,
        businessId: Number(businessId),
        ...(preview?.count === 1 && name ? { name } : {}),
      });

      onImported(response.message ?? `${response.data.imported} template(s) imported`);
      handleClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.errors?.file?.[0] ||
          err?.response?.data?.message ||
          'The import failed.'
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Import a template</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <Paper
            variant="outlined"
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const dropped = event.dataTransfer.files?.[0];
              if (dropped) handleFile(dropped);
            }}
            onClick={() => inputRef.current?.click()}
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              borderStyle: 'dashed',
              borderColor: dragging ? 'primary.main' : 'divider',
              bgcolor: dragging ? 'action.hover' : 'background.neutral',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".json,.txt,application/json,text/plain"
              hidden
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) handleFile(selected);
                event.target.value = '';
              }}
            />

            <Iconify icon="solar:cloud-upload-bold" width={40} sx={{ color: 'text.disabled' }} />
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              {file ? file.name : 'Drop a .json or .txt export here, or click to browse'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Files exported from the Templates page, up to 10 MB.
            </Typography>
          </Paper>

          {reading && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={22} />
            </Box>
          )}

          {preview && (
            <>
              <Alert severity="success" icon={<Iconify icon="solar:check-circle-bold" />}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <span>
                    {preview.count} {TYPE_LABEL[preview.type] ?? preview.type} template
                    {preview.count > 1 ? 's' : ''} found
                  </span>
                  <Chip size="small" label={TYPE_LABEL[preview.type] ?? preview.type} />
                  {preview.source?.business_name && (
                    <Chip size="small" variant="outlined" label={`from ${preview.source.business_name}`} />
                  )}
                </Stack>
              </Alert>

              <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 160, overflow: 'auto' }}>
                <Stack spacing={0.5}>
                  {preview.templates.map((template, index) => (
                    <Typography key={`${template.name}-${index}`} variant="body2">
                      • {template.name}
                      {template.subject ? ` — ${template.subject}` : ''}
                      {template.language ? ` (${template.language})` : ''}
                    </Typography>
                  ))}
                </Stack>
              </Paper>

              <FormControl fullWidth required>
                <InputLabel id="import-business-label">Attach to the application</InputLabel>
                <Select
                  labelId="import-business-label"
                  label="Attach to the application"
                  value={businessId}
                  onChange={(event) => setBusinessId(event.target.value as string)}
                >
                  {businesses.map((business) => (
                    <MenuItem key={business.id} value={String(business.id)}>
                      {business.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  The only choice to make: everything else comes from the file.
                </FormHelperText>
              </FormControl>

              {preview.count === 1 && (
                <TextField
                  fullWidth
                  label="Template name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  helperText="A name already taken in this application is suffixed automatically."
                />
              )}

              <Alert severity="info">
                Imported templates land as inactive drafts so you can review them before use.
              </Alert>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={!preview || !businessId || importing}
          startIcon={!importing ? <Iconify icon="solar:import-bold" /> : undefined}
        >
          {importing ? <CircularProgress size={20} color="inherit" /> : 'Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
