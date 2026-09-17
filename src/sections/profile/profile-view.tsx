import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from 'src/hooks/useAuth';

import { authService } from 'src/services/auth.service';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/** Rough strength meter, purely to guide the user while they type. */
function passwordScore(value: string): { score: number; label: string; color: 'error' | 'warning' | 'success' } {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 2) return { score: score * 20, label: 'Weak', color: 'error' };
  if (score === 3) return { score: 60, label: 'Fair', color: 'warning' };
  if (score === 4) return { score: 80, label: 'Good', color: 'success' };
  return { score: 100, label: 'Strong', color: 'success' };
}

export function ProfileView() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();

  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const notify = useCallback(
    (message: string, severity: 'success' | 'error' = 'success') => setToast({ message, severity }),
    []
  );

  if (!user) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My profile
      </Typography>

      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2.5} alignItems="center" flexWrap="wrap">
          <Avatar sx={{ width: 64, height: 64, fontSize: 24 }}>
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>

          <Box sx={{ flexGrow: 1, minWidth: 200 }}>
            <Typography variant="h6">{user.name}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {user.email}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              size="small"
              label={user.role === 'admin' ? 'Administrator' : 'Manager'}
              color={user.role === 'admin' ? 'primary' : 'default'}
            />
            <Chip
              size="small"
              label={user.global_scope ? 'All applications' : `${user.businesses.length} application(s)`}
              variant="outlined"
            />
            <Chip
              size="small"
              color={user.two_factor_enabled ? 'success' : 'warning'}
              label={user.two_factor_enabled ? '2FA enabled' : '2FA required'}
              icon={<Iconify icon="solar:shield-keyhole-bold-duotone" width={16} />}
            />
          </Stack>
        </Stack>

        {!user.global_scope && user.businesses.length > 0 && (
          <>
            <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Applications you manage
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
              {user.businesses.map((business) => (
                <Chip key={business.id} size="small" label={business.name} />
              ))}
            </Stack>
          </>
        )}
      </Card>

      <Card>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Details" />
          <Tab label="Password" />
          <Tab label="Two-factor authentication" />
        </Tabs>

        <CardContent>
          {tab === 0 && <DetailsTab onSaved={refreshUser} notify={notify} />}
          {tab === 1 && <PasswordTab notify={notify} />}
          {tab === 2 && (
            <TwoFactorTab
              enabled={user.two_factor_enabled}
              notify={notify}
              onReset={async () => {
                await logout();
                navigate('/sign-in', { replace: true });
              }}
              onReconfigure={() => navigate('/two-factor-setup')}
            />
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity ?? 'success'} onClose={() => setToast(null)} variant="filled">
          {toast?.message}
        </Alert>
      </Snackbar>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type NotifyFn = (message: string, severity?: 'success' | 'error') => void;

function DetailsTab({ onSaved, notify }: { onSaved: () => Promise<any>; notify: NotifyFn }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      await authService.updateProfile({ name, email, phone: phone || null });
      await onSaved();
      notify('Profile updated');
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Could not update the profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 480 }}>
      <Stack spacing={2.5}>
        <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
        <TextField
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <TextField label="Phone" value={phone ?? ''} onChange={(e) => setPhone(e.target.value)} fullWidth />

        <Box>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save changes'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

function PasswordTab({ notify }: { notify: NotifyFn }) {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const strength = passwordScore(password);
  const mismatch = confirmation.length > 0 && password !== confirmation;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      await authService.updatePassword({
        current_password: current,
        password,
        password_confirmation: confirmation,
      });
      setCurrent('');
      setPassword('');
      setConfirmation('');
      notify('Password updated. Your other sessions have been signed out.');
    } catch (err: any) {
      setErrors(err?.response?.data?.errors ?? {});
      notify(err?.response?.data?.message || 'Could not update the password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (
    <InputAdornment position="end">
      <IconButton onClick={() => setShow(!show)} edge="end">
        <Iconify icon={show ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 480 }}>
      <Stack spacing={2.5}>
        <Alert severity="info">
          Changing your password signs out every other device. You stay signed in here.
        </Alert>

        <TextField
          required
          fullWidth
          label="Current password"
          type={show ? 'text' : 'password'}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          error={!!errors.current_password}
          helperText={errors.current_password?.[0]}
          slotProps={{ input: { endAdornment: toggle } }}
        />

        <Box>
          <TextField
            required
            fullWidth
            label="New password"
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
            helperText={errors.password?.[0] ?? 'At least 8 characters, with letters and numbers.'}
            slotProps={{ input: { endAdornment: toggle } }}
          />
          {password.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={strength.score}
                color={strength.color}
                sx={{ height: 6, borderRadius: 1 }}
              />
              <Typography variant="caption" sx={{ color: `${strength.color}.main` }}>
                {strength.label}
              </Typography>
            </Box>
          )}
        </Box>

        <TextField
          required
          fullWidth
          label="Confirm new password"
          type={show ? 'text' : 'password'}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          error={mismatch}
          helperText={mismatch ? 'The two passwords do not match.' : ' '}
          slotProps={{ input: { endAdornment: toggle } }}
        />

        <Box>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || mismatch || !current || password.length < 8}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Update password'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

function TwoFactorTab({
  enabled,
  notify,
  onReset,
  onReconfigure,
}: {
  enabled: boolean;
  notify: NotifyFn;
  onReset: () => Promise<void>;
  onReconfigure: () => void;
}) {
  const [resetOpen, setResetOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);

  const handleReset = async () => {
    setBusy(true);

    try {
      await authService.disableTwoFactor(password);
      setResetOpen(false);
      notify('Two-factor authentication reset. Sign in again to configure a new device.');
      await onReset();
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Could not reset two-factor authentication', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    setBusy(true);

    try {
      const result = await authService.regenerateRecoveryCodes();
      setCodes(result.recovery_codes);
      notify('New recovery codes generated. The previous ones no longer work.');
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Could not regenerate the recovery codes', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 620 }}>
      <Alert severity={enabled ? 'success' : 'warning'} sx={{ mb: 3 }}>
        {enabled
          ? 'Google Authenticator is active on your account. A code is asked on every sign-in.'
          : 'Google Authenticator is not configured yet. It is required to use the application.'}
      </Alert>

      {!enabled ? (
        <Button variant="contained" onClick={onReconfigure} startIcon={<Iconify icon="solar:shield-keyhole-bold-duotone" />}>
          Configure Google Authenticator
        </Button>
      ) : (
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="subtitle2">Changed phone?</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Reset the enrolment, then sign in again to scan a new QR code on your new device.
            </Typography>
            <Button color="warning" variant="outlined" onClick={() => setResetOpen(true)}>
              Reset two-factor authentication
            </Button>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Box>
            <Typography variant="subtitle2">Recovery codes</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Single use codes that let you in when your phone is unavailable. Generating a new set
              invalidates the previous one.
            </Typography>
            <Button variant="outlined" onClick={handleRegenerate} disabled={busy}>
              Generate new recovery codes
            </Button>

            {codes && (
              <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'background.neutral' }}>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  }}
                >
                  {codes.map((code) => (
                    <Typography key={code} variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {code}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        </Stack>
      )}

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Reset two-factor authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            You will be signed out and asked to configure Google Authenticator again on your next
            sign-in. Confirm with your password.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button color="warning" variant="contained" onClick={handleReset} disabled={busy || !password}>
            {busy ? <CircularProgress size={20} color="inherit" /> : 'Reset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
