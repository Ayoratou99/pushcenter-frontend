import type { UserRole, UserScope } from 'src/auth/types';
import type { ManagedUser } from 'src/services/user.service';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { userService } from 'src/services/user.service';

// ----------------------------------------------------------------------

type BusinessOption = { id: number; name: string; status: string };

type Props = {
  open: boolean;
  user: ManagedUser | null;
  businesses: BusinessOption[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

export function UserFormDialog({ open, user, businesses, onClose, onSaved }: Props) {
  const isEdit = !!user;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [scope, setScope] = useState<UserScope>('restricted');
  const [businessIds, setBusinessIds] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;

    setErrors({});
    setFormError('');
    setPassword('');
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setPhone(user?.phone ?? '');
    setRole(user?.role ?? 'manager');
    setScope(user?.scope ?? 'restricted');
    setBusinessIds(user?.businesses?.map((b) => b.id) ?? []);
    setIsActive(user?.is_active ?? true);
    setMustChangePassword(!user);
  }, [open, user]);

  // Admins always reach every application.
  const effectiveScope: UserScope = role === 'admin' ? 'global' : scope;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    setFormError('');
    setSaving(true);

    const payload = {
      name,
      email,
      phone: phone || null,
      role,
      scope: effectiveScope,
      is_active: isActive,
      must_change_password: mustChangePassword,
      ...(effectiveScope === 'restricted' ? { business_ids: businessIds } : { business_ids: [] }),
      ...(password ? { password } : {}),
    };

    try {
      if (isEdit) {
        await userService.update(user!.id, payload);
        onSaved('User updated');
      } else {
        await userService.create(payload as any);
        onSaved('User created');
      }
      onClose();
    } catch (err: any) {
      setErrors(err?.response?.data?.errors ?? {});
      setFormError(err?.response?.data?.message || 'Could not save the user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? `Edit ${user!.name}` : 'New user'}</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              required
              fullWidth
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name?.[0]}
            />

            <TextField
              required
              fullWidth
              type="email"
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email?.[0]}
            />

            <TextField fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

            <TextField
              fullWidth
              type="password"
              label={isEdit ? 'New password (leave empty to keep the current one)' : 'Password'}
              required={!isEdit}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password?.[0] ?? 'At least 8 characters, with letters and numbers.'}
            />

            <FormControl fullWidth>
              <InputLabel id="user-role-label">Role</InputLabel>
              <Select
                labelId="user-role-label"
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
              </Select>
            </FormControl>

            {role === 'admin' ? (
              <Alert severity="info">
                Administrators manage users and reach every application, so no assignment is needed.
              </Alert>
            ) : (
              <FormControl>
                <FormLabel sx={{ mb: 1 }}>Application access</FormLabel>
                <RadioGroup value={scope} onChange={(e) => setScope(e.target.value as UserScope)}>
                  <FormControlLabel
                    value="global"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2">Global</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Works on every application, including the ones created later.
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="restricted"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2">Specific applications</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Only sees the applications picked below.
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            )}

            {role === 'manager' && scope === 'restricted' && (
              <FormControl fullWidth error={!!errors.business_ids}>
                <InputLabel id="user-businesses-label">Applications</InputLabel>
                <Select
                  multiple
                  labelId="user-businesses-label"
                  value={businessIds}
                  onChange={(e) => setBusinessIds(e.target.value as number[])}
                  input={<OutlinedInput label="Applications" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as number[]).map((id) => (
                        <Chip
                          key={id}
                          size="small"
                          label={businesses.find((b) => b.id === id)?.name ?? id}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {businesses.map((business) => (
                    <MenuItem key={business.id} value={business.id}>
                      <Checkbox checked={businessIds.includes(business.id)} />
                      <ListItemText primary={business.name} secondary={business.status} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Stack direction="row" spacing={3} flexWrap="wrap">
              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                label="Account active"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                  />
                }
                label="Ask to change the password"
              />
            </Stack>

            <Alert severity="info">
              Google Authenticator is mandatory: the user is walked through the setup on their first
              sign-in.
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
