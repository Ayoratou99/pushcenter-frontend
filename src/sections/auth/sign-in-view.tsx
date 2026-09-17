import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from 'src/hooks/useAuth';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Step = 'credentials' | 'two-factor';

export function SignInView() {
  const navigate = useNavigate();
  const { login, completeTwoFactor } = useAuth();

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const readError = (err: any, fallback: string) =>
    err?.response?.data?.message || err?.message || fallback;

  const handleCredentials = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError('');
      setSubmitting(true);

      try {
        const result = await login(email, password);

        if (result.status === 'two_factor_required') {
          setChallengeToken(result.challengeToken);
          setStep('two-factor');
          return;
        }

        if (result.status === 'two_factor_setup_required') {
          // First login: walk the user through the Google Authenticator setup.
          navigate('/two-factor-setup', {
            replace: true,
            state: { setupToken: result.setupToken, email },
          });
          return;
        }

        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        setError(readError(err, 'Sign in failed. Please try again.'));
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, login, navigate]
  );

  const handleTwoFactor = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError('');
      setSubmitting(true);

      try {
        await completeTwoFactor(challengeToken, code.trim());
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        // The API hands back a fresh challenge so the user can retype the code.
        const nextChallenge = err?.response?.data?.errors?.challenge_token;

        if (nextChallenge) {
          setChallengeToken(nextChallenge);
        } else {
          setStep('credentials');
        }

        setCode('');
        setError(readError(err, 'Invalid authentication code.'));
      } finally {
        setSubmitting(false);
      }
    },
    [challengeToken, code, completeTwoFactor, navigate]
  );

  const renderCredentials = (
    <Box component="form" onSubmit={handleCredentials} sx={{ display: 'flex', flexDirection: 'column' }}>
      <TextField
        fullWidth
        required
        autoFocus
        name="email"
        type="email"
        label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <TextField
        fullWidth
        required
        name="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type={showPassword ? 'text' : 'password'}
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button fullWidth size="large" type="submit" color="inherit" variant="contained" disabled={submitting}>
        {submitting ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
      </Button>
    </Box>
  );

  const renderTwoFactor = (
    <Box component="form" onSubmit={handleTwoFactor} sx={{ display: 'flex', flexDirection: 'column' }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        Open Google Authenticator and enter the 6 digit code shown for {email}.
      </Alert>

      <TextField
        fullWidth
        required
        autoFocus
        label="Authentication code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="123456"
        helperText="Lost your phone? Enter one of your recovery codes instead."
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: 20 },
        }}
      />

      <Button fullWidth size="large" type="submit" color="inherit" variant="contained" disabled={submitting}>
        {submitting ? <CircularProgress size={22} color="inherit" /> : 'Verify'}
      </Button>

      <Button
        fullWidth
        size="small"
        color="inherit"
        sx={{ mt: 1.5 }}
        onClick={() => {
          setStep('credentials');
          setCode('');
          setError('');
        }}
      >
        Use a different account
      </Button>
    </Box>
  );

  return (
    <>
      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 5 }}>
        <Typography variant="h5">{step === 'credentials' ? 'Sign in' : 'Two-factor authentication'}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          {step === 'credentials'
            ? 'Use the email and password given to you by your administrator.'
            : 'One more step to protect your account.'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {step === 'credentials' ? renderCredentials : renderTwoFactor}
    </>
  );
}
