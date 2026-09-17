import type { TwoFactorEnrolment } from 'src/auth/types';

import { useNavigate, useLocation } from 'react-router-dom';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Step from '@mui/material/Step';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import Divider from '@mui/material/Divider';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import StepContent from '@mui/material/StepContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from 'src/hooks/useAuth';

import { authService } from 'src/services/auth.service';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * Mandatory Google Authenticator enrolment.
 *
 * Reached either right after a first sign-in (a short lived `setupToken` is
 * passed through the router state) or from the profile page for a signed-in
 * user re-enrolling a new phone.
 */
export function TwoFactorSetupView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, finishTwoFactorSetup, logout } = useAuth();

  const setupTokenFromLogin = (location.state as { setupToken?: string } | null)?.setupToken;
  const emailFromLogin = (location.state as { email?: string } | null)?.email;

  const [enrolment, setEnrolment] = useState<TwoFactorEnrolment | null>(null);
  const [setupToken, setSetupToken] = useState<string | undefined>(setupTokenFromLogin);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const accountLabel = user?.email || emailFromLogin || 'your account';

  // Guards against StrictMode's double invoke: asking for a secret twice would
  // throw away the one the user may already have scanned.
  const started = useRef(false);

  // Start (or restart) the enrolment as soon as the page opens.
  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    (async () => {
      try {
        const data = await authService.setupTwoFactor(setupTokenFromLogin);

        setEnrolment(data);
        setSetupToken(data.setup_token);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Could not start the setup. Please sign in again.');
      } finally {
        setLoading(false);
      }
    })();
    // Intentionally runs once: a new secret must not be generated on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError('');
      setConfirming(true);

      try {
        const result = await authService.confirmTwoFactor(code.trim(), setupToken);
        setRecoveryCodes(result.recovery_codes);
        await finishTwoFactorSetup(result.user);
      } catch (err: any) {
        const nextToken = err?.response?.data?.errors?.setup_token;

        if (nextToken) {
          setSetupToken(nextToken);
        }

        setCode('');
        setError(err?.response?.data?.message || 'Invalid code. Please try again.');
      } finally {
        setConfirming(false);
      }
    },
    [code, setupToken, finishTwoFactorSetup]
  );

  const handleCopyKey = useCallback(() => {
    if (!enrolment) return;

    navigator.clipboard?.writeText(enrolment.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [enrolment]);

  const handleDownloadRecoveryCodes = useCallback(() => {
    if (!recoveryCodes) return;

    const body = [
      'AninfPush — recovery codes',
      `Account: ${accountLabel}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'Each code works once. Keep this file somewhere safe.',
      '',
      ...recoveryCodes,
      '',
    ].join('\n');

    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aninfpush-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  }, [recoveryCodes, accountLabel]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  /* ---------------------------- Done: recovery codes --------------------- */
  if (recoveryCodes) {
    return (
      <Box sx={{ width: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Iconify icon="solar:check-circle-bold" width={56} sx={{ color: 'success.main' }} />
          <Typography variant="h5" sx={{ mt: 1 }}>
            Two-factor authentication is on
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            Save these recovery codes now. Each one works a single time and they are the only way
            back in if you lose your phone.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, bgcolor: 'background.neutral' }}>
          <Box
            sx={{
              display: 'grid',
              gap: 1,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              fontFamily: 'monospace',
            }}
          >
            {recoveryCodes.map((recoveryCode) => (
              <Typography key={recoveryCode} variant="body2" sx={{ fontFamily: 'monospace' }}>
                {recoveryCode}
              </Typography>
            ))}
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
            onClick={handleDownloadRecoveryCodes}
          >
            Download as .txt
          </Button>
          <Button
            variant="contained"
            sx={{ flexGrow: 1 }}
            onClick={() => navigate('/', { replace: true })}
          >
            Continue to the dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  /* ------------------------------- The guide ----------------------------- */
  return (
    <Box sx={{ width: 1 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5">Set up Google Authenticator</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Two-factor authentication is required on {accountLabel}. It takes about a minute.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!enrolment ? (
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </Box>
      ) : (
        <Box>
          <Stepper orientation="vertical" activeStep={-1} nonLinear>
            <Step expanded active>
              <StepLabel>
                <Typography variant="subtitle1">
                  {enrolment.instructions[0]?.title ?? 'Install Google Authenticator'}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {enrolment.instructions[0]?.description}
                </Typography>
              </StepContent>
            </Step>

            <Step expanded active>
              <StepLabel>
                <Typography variant="subtitle1">
                  {enrolment.instructions[1]?.title ?? 'Add the account'}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  {enrolment.instructions[1]?.description}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, bgcolor: 'common.white', lineHeight: 0, borderRadius: 2 }}
                  >
                    <Box
                      component="img"
                      src={enrolment.qr_code}
                      alt="Google Authenticator QR code"
                      sx={{ width: 200, height: 200, display: 'block' }}
                    />
                  </Paper>

                  <Divider sx={{ width: 1, '&::before, &::after': { borderTopStyle: 'dashed' } }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      OR ENTER THIS KEY MANUALLY
                    </Typography>
                  </Divider>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Chip
                      label={enrolment.manual_entry_key}
                      sx={{ fontFamily: 'monospace', fontSize: 14, letterSpacing: 1 }}
                    />
                    <Button
                      size="small"
                      color={copied ? 'success' : 'inherit'}
                      startIcon={<Iconify icon={copied ? 'solar:check-circle-bold' : 'solar:copy-bold'} />}
                      onClick={handleCopyKey}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </Box>
                </Box>
              </StepContent>
            </Step>

            <Step expanded active>
              <StepLabel>
                <Typography variant="subtitle1">
                  {enrolment.instructions[2]?.title ?? 'Confirm the code'}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  {enrolment.instructions[2]?.description}
                </Typography>

                <Box component="form" onSubmit={handleConfirm} sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <TextField
                    required
                    autoFocus
                    size="small"
                    label="6 digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    sx={{ width: 160 }}
                    slotProps={{
                      inputLabel: { shrink: true },
                      htmlInput: { inputMode: 'numeric', maxLength: 6, autoComplete: 'one-time-code' },
                    }}
                  />
                  <Button type="submit" variant="contained" disabled={confirming || code.trim().length < 6}>
                    {confirming ? <CircularProgress size={20} color="inherit" /> : 'Enable'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>

          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Codes not working? Make sure your phone clock is set to automatic time.
            </Typography>
            <Button
              size="small"
              color="inherit"
              onClick={async () => {
                await logout();
                navigate('/sign-in', { replace: true });
              }}
            >
              Sign out
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
