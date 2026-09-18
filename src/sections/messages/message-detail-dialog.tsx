import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import AlertTitle from '@mui/material/AlertTitle';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type MessageRow = {
  id: number;
  message_id: string;
  message_type: string;
  status: string;
  cost?: number | null;
  currency?: string;
  error_message?: string | null;
  retry_count?: number;
  webhook_status?: 'not_applicable' | 'pending' | 'delivered' | 'failed';
  webhook_error?: string | null;
  webhook_attempts?: number;
  webhook_last_attempt_at?: string | null;
  campaign_id?: string | null;
  created_at: string;
  sent_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  business?: { id: number; name: string };
  email_message?: { recipient_email?: string; subject?: string };
  sms_message?: { recipient_number?: string };
  whatsapp_message?: { recipient_number?: string };
};

type Props = {
  message: MessageRow | null;
  onClose: () => void;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.75 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 140 }}>
        {label}
      </Typography>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>{value}</Box>
    </Box>
  );
}

/**
 * Full detail of one message. Its main job is to surface the delivery error of
 * a failed message, which is otherwise only visible in the server logs.
 */
export function MessageDetailDialog({ message, onClose }: Props) {
  if (!message) {
    return null;
  }

  const recipient =
    message.email_message?.recipient_email ??
    message.sms_message?.recipient_number ??
    message.whatsapp_message?.recipient_number ??
    '-';

  const failed = message.status === 'failed';
  const webhookFailed = message.webhook_status === 'failed';

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Message detail</DialogTitle>

      <DialogContent dividers>
        {failed && (
          <Alert
            severity="error"
            icon={<Iconify icon="solar:danger-triangle-bold" />}
            sx={{ mb: 2.5 }}
          >
            <AlertTitle>Delivery failed</AlertTitle>

            {message.error_message ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mt: 1,
                  bgcolor: 'background.paper',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {message.error_message}
              </Paper>
            ) : (
              <Typography variant="body2">No reason was recorded for this failure.</Typography>
            )}

            {!!message.retry_count && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                {message.retry_count} delivery attempt{message.retry_count > 1 ? 's' : ''} made.
              </Typography>
            )}
          </Alert>
        )}

        {webhookFailed && (
          <Alert severity="warning" sx={{ mb: 2.5 }}>
            <AlertTitle>Webhook not delivered</AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              The message itself is unaffected: this is only the notification we push to your
              endpoint.
            </Typography>
            {message.webhook_error && (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  bgcolor: 'background.paper',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {message.webhook_error}
              </Paper>
            )}
            {!!message.webhook_attempts && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                {message.webhook_attempts} attempt{message.webhook_attempts > 1 ? 's' : ''}
                {message.webhook_last_attempt_at
                  ? `, last on ${new Date(message.webhook_last_attempt_at).toLocaleString()}`
                  : ''}
                .
              </Typography>
            )}
          </Alert>
        )}

        <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
          <Row
            label="Message ID"
            value={
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {message.message_id}
              </Typography>
            }
          />
          <Row label="Channel" value={<Chip size="small" label={message.message_type} />} />
          <Row
            label="Status"
            value={
              <Chip
                size="small"
                label={message.status}
                color={failed ? 'error' : message.status === 'sent' ? 'info' : 'default'}
              />
            }
          />
          <Row label="Application" value={message.business?.name ?? '-'} />
          <Row label="Recipient" value={recipient} />
          {message.email_message?.subject && (
            <Row label="Subject" value={message.email_message.subject} />
          )}
          {message.campaign_id && <Row label="Campaign" value={message.campaign_id} />}
          <Row
            label="Cost"
            value={message.cost ? `${message.cost} ${message.currency ?? ''}` : '-'}
          />
          <Row label="Created" value={new Date(message.created_at).toLocaleString()} />
          <Row
            label="Sent"
            value={message.sent_at ? new Date(message.sent_at).toLocaleString() : '-'}
          />
          {message.failed_at && (
            <Row label="Failed" value={new Date(message.failed_at).toLocaleString()} />
          )}
          {message.webhook_status && message.webhook_status !== 'not_applicable' && (
            <Row
              label="Webhook"
              value={
                <Chip
                  size="small"
                  label={message.webhook_status}
                  color={
                    message.webhook_status === 'delivered'
                      ? 'success'
                      : message.webhook_status === 'failed'
                        ? 'warning'
                        : 'default'
                  }
                />
              }
            />
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
