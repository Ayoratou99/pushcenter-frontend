import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { businessService } from 'src/services';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const EVENTS = [
  { value: 'message.sent', label: 'Message sent', hint: 'Delivery accepted by the mail server' },
  { value: 'message.failed', label: 'Message failed', hint: 'Delivery failed, with the reason' },
];

const SAMPLE_PAYLOAD = `{
  "event": "message.failed",
  "occurred_at": "2026-01-15T10:32:11+00:00",
  "data": {
    "message_id": "9b1c...",
    "message_type": "email",
    "status": "failed",
    "recipient": "jane@customer.test",
    "subject": "Order A-1234 confirmed",
    "error_message": "Connection could not be established",
    "retry_count": 3,
    "failed_at": "2026-01-15T10:32:11+00:00"
  }
}`;

type Props = { businessId: number };

export function WebhookSettingsTab({ businessId }: Props) {
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await businessService.getById(businessId);
      const business = response.data;

      setUrl(business.webhook_url ?? '');
      setEvents(business.webhook_events ?? []);
    } catch (err: any) {
      setToast({
        message: err?.response?.data?.message || 'Could not load the webhook settings',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);

    try {
      await businessService.update(businessId, {
        webhook_url: url || null,
        // An empty field leaves the stored secret untouched.
        ...(secret ? { webhook_secret: secret } : {}),
        webhook_events: events.length ? events : null,
      } as any);

      setSecret('');
      setToast({ message: 'Webhook settings saved', severity: 'success' });
    } catch (err: any) {
      setToast({
        message: err?.response?.data?.message || 'Could not save the webhook settings',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = (value: string) =>
    setEvents((previous) =>
      previous.includes(value) ? previous.filter((item) => item !== value) : [...previous, value]
    );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          Delivery notifications
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          When a message is sent or fails, we POST the event to this URL. It is the quickest way to
          learn about a failure without polling the API.
        </Typography>

        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Webhook URL"
            placeholder="https://your-app.example.com/hooks/aninfpush"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            helperText="Leave empty to disable notifications."
          />

          <TextField
            fullWidth
            label="Signing secret"
            type={showSecret ? 'text' : 'password'}
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="Leave empty to keep the current secret"
            helperText="Used to sign each payload so you can verify it really comes from us."
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowSecret(!showSecret)}>
                      <Iconify icon={showSecret ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Events
            </Typography>
            <FormGroup>
              {EVENTS.map((event) => (
                <FormControlLabel
                  key={event.value}
                  control={
                    <Checkbox
                      checked={events.includes(event.value)}
                      onChange={() => toggleEvent(event.value)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{event.label}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {event.hint}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Select none to receive every event.
            </Typography>
          </Box>

          <Box>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
            </Button>
          </Box>
        </Stack>
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          Verifying a payload
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Each request carries <code>X-AninfPush-Signature</code>, the HMAC-SHA256 of the raw body
          computed with your signing secret. Compare it against the body you received, before
          parsing it.
        </Typography>

        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.neutral' }}>
          <Typography
            component="pre"
            sx={{ m: 0, fontFamily: 'monospace', fontSize: 13, overflowX: 'auto' }}
          >
{`$expected = 'sha256=' . hash_hmac('sha256', $rawBody, $yourSecret);

if (! hash_equals($expected, $request->header('X-AninfPush-Signature'))) {
    abort(401);
}`}
          </Typography>
        </Paper>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Example payload
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral' }}>
          <Typography
            component="pre"
            sx={{ m: 0, fontFamily: 'monospace', fontSize: 13, overflowX: 'auto' }}
          >
            {SAMPLE_PAYLOAD}
          </Typography>
        </Paper>

        <Alert severity="info" sx={{ mt: 2 }}>
          A failing endpoint is retried up to 5 times with an increasing delay. Webhooks run on
          their own queue, so a slow endpoint never delays your actual messages.
        </Alert>
      </Card>

      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity ?? 'success'} variant="filled" onClose={() => setToast(null)}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
