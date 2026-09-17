import type { AppCredentials } from 'src/services/business.service';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { type Business, businessService } from 'src/services';

import { Iconify } from 'src/components/iconify';
import { TableFilters } from 'src/components/table-filters';

// ----------------------------------------------------------------------

const EMPTY_FILTERS: Record<string, string> = {
  search: '',
  status: '',
  verification_status: '',
  city: '',
  country: '',
  created_from: '',
  created_to: '',
};

// ----------------------------------------------------------------------

export function BusinessesView() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<Record<string, string>>({ ...EMPTY_FILTERS });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Credentials shown once, right after an application is created
  const [newCredentials, setNewCredentials] = useState<
    (AppCredentials & { businessName: string }) | null
  >(null);
  const [secretVisible, setSecretVisible] = useState(false);
  const [copied, setCopied] = useState('');
  
  // Create/Edit dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  // Get user's timezone as default
  const getUserTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  };

  // Get list of common timezones
  const getTimezones = () => {
    try {
      // Use modern API if available
      if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
        return Intl.supportedValuesOf('timeZone').sort();
      }
    } catch {
      // Fallback to common timezones
    }
    
    // Fallback list of common timezones
    return [
      'UTC',
      'Africa/Abidjan',
      'Africa/Accra',
      'Africa/Addis_Ababa',
      'Africa/Algiers',
      'Africa/Asmara',
      'Africa/Bamako',
      'Africa/Bangui',
      'Africa/Banjul',
      'Africa/Bissau',
      'Africa/Blantyre',
      'Africa/Brazzaville',
      'Africa/Bujumbura',
      'Africa/Cairo',
      'Africa/Casablanca',
      'Africa/Ceuta',
      'Africa/Conakry',
      'Africa/Dakar',
      'Africa/Dar_es_Salaam',
      'Africa/Djibouti',
      'Africa/Douala',
      'Africa/El_Aaiun',
      'Africa/Freetown',
      'Africa/Gaborone',
      'Africa/Harare',
      'Africa/Johannesburg',
      'Africa/Juba',
      'Africa/Kampala',
      'Africa/Khartoum',
      'Africa/Kigali',
      'Africa/Kinshasa',
      'Africa/Lagos',
      'Africa/Libreville',
      'Africa/Lome',
      'Africa/Luanda',
      'Africa/Lubumbashi',
      'Africa/Lusaka',
      'Africa/Malabo',
      'Africa/Maputo',
      'Africa/Maseru',
      'Africa/Mbabane',
      'Africa/Mogadishu',
      'Africa/Monrovia',
      'Africa/Nairobi',
      'Africa/Ndjamena',
      'Africa/Niamey',
      'Africa/Nouakchott',
      'Africa/Ouagadougou',
      'Africa/Porto-Novo',
      'Africa/Sao_Tome',
      'Africa/Tripoli',
      'Africa/Tunis',
      'Africa/Windhoek',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'America/Mexico_City',
      'America/Sao_Paulo',
      'America/Buenos_Aires',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Rome',
      'Europe/Madrid',
      'Europe/Amsterdam',
      'Europe/Brussels',
      'Europe/Vienna',
      'Europe/Stockholm',
      'Europe/Warsaw',
      'Europe/Athens',
      'Europe/Istanbul',
      'Europe/Moscow',
      'Asia/Dubai',
      'Asia/Karachi',
      'Asia/Kolkata',
      'Asia/Dhaka',
      'Asia/Bangkok',
      'Asia/Singapore',
      'Asia/Hong_Kong',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Australia/Sydney',
      'Australia/Melbourne',
      'Pacific/Auckland',
    ].sort();
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    website: '',
    description: '',
    timezone: getUserTimezone(),
    status: 'active' as 'active' | 'inactive' | 'suspended',
  });

  const [timezones] = useState<string[]>(getTimezones());

  useEffect(() => {
    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filters, sortBy, sortDir]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);

      const params: Record<string, any> = {
        page: page + 1,
        per_page: rowsPerPage,
        sort_by: sortBy,
        sort_dir: sortDir,
      };

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') params[key] = value;
      });

      const response = await businessService.getAll(params);
      setBusinesses(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((previous) => ({ ...previous, [name]: value }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setPage(0);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleOpenDialog = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      website: '',
      description: '',
      timezone: getUserTimezone(),
      status: 'active',
    });
    setOpenDialog(true);
  };

  const handleEditBusiness = (business: Business) => {
    setEditingId(business.id);
    setFormData({
      name: business.name || '',
      email: business.email || '',
      phone_number: business.phone_number || '',
      website: business.website || '',
      description: business.description || '',
      timezone: business.timezone || getUserTimezone(),
      status: (business.status as 'active' | 'inactive' | 'suspended') || 'active',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone_number: '',
      website: '',
      description: '',
      timezone: getUserTimezone(),
      status: 'active',
    });
  };

  const handleCreateBusiness = async () => {
    try {
      setCreating(true);
      if (editingId) {
        await businessService.update(editingId, formData);
      } else {
        const response = await businessService.create(formData);

        // The app key and secret are generated server side; show them once.
        if (response.data?.credentials) {
          setNewCredentials({
            ...response.data.credentials,
            businessName: response.data.business?.name ?? formData.name,
          });
          setSecretVisible(false);
        }
      }
      handleCloseDialog();
      loadBusinesses();
    } catch (error) {
      console.error(`Failed to ${editingId ? 'update' : 'create'} business:`, error);
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && businesses.length === 0) {
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
        <Typography variant="h4" flexGrow={1}>
          Applications
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenDialog}
        >
          Create application
        </Button>
      </Box>

      <TableFilters
        fields={[
          {
            type: 'search',
            name: 'search',
            label: 'Search',
            placeholder: 'Name, email, phone, city or app id',
            minWidth: 260,
          },
          {
            type: 'select',
            name: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
            ],
          },
          {
            type: 'select',
            name: 'verification_status',
            label: 'Verification',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'verified', label: 'Verified' },
              { value: 'rejected', label: 'Rejected' },
            ],
          },
          { type: 'text', name: 'city', label: 'City' },
          { type: 'text', name: 'country', label: 'Country' },
          { type: 'date', name: 'created_from', label: 'Created from' },
          { type: 'date', name: 'created_to', label: 'Created to' },
        ]}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleClearFilters}
      />

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sortDirection={sortBy === 'name' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortDir : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'email' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'email'}
                    direction={sortBy === 'email' ? sortDir : 'asc'}
                    onClick={() => handleSort('email')}
                  >
                    Email
                  </TableSortLabel>
                </TableCell>
                <TableCell>App key</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Verification</TableCell>
                <TableCell sortDirection={sortBy === 'created_at' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'created_at'}
                    direction={sortBy === 'created_at' ? sortDir : 'asc'}
                    onClick={() => handleSort('created_at')}
                  >
                    Created
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : businesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No businesses found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                businesses.map((business) => (
                  <TableRow key={business.id} hover>
                    <TableCell>{business.name}</TableCell>
                    <TableCell>{business.email}</TableCell>
                    <TableCell>
                      {business.app_id ? (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {`${business.app_id.slice(0, 12)}…`}
                          </Typography>
                          <Tooltip title={copied === `list-${business.id}` ? 'Copied' : 'Copy app key'}>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(`list-${business.id}`, business.app_id!)}
                            >
                              <Iconify icon="solar:copy-bold" width={16} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={business.status} color={getStatusColor(business.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={business.verification_status ?? 'pending'}
                        color={business.verification_status === 'verified' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{new Date(business.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Iconify icon="solar:pen-bold" />}
                          onClick={() => handleEditBusiness(business)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Iconify icon="solar:settings-bold" />}
                          onClick={() => navigate(`/business/${business.id}`)}
                        >
                          Settings
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Create/Edit Business Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Business' : 'Create New Business'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Business Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
            <TextField
              fullWidth
              label="Website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={formData.timezone}
                label="Timezone"
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                {timezones.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {editingId && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleCreateBusiness}
            variant="contained"
            disabled={creating || !formData.name || !formData.email}
          >
            {creating ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Credentials generated on creation: shown once, with a copy helper. */}
      <Dialog
        open={!!newCredentials}
        onClose={() => setNewCredentials(null)}
        fullWidth
        maxWidth="sm"
        disableEscapeKeyDown
      >
        <DialogTitle>Application created</DialogTitle>

        <DialogContent dividers>
          <Alert severity="success" sx={{ mb: 2.5 }}>
            <strong>{newCredentials?.businessName}</strong> is ready. Its API key and secret were
            generated automatically.
          </Alert>

          <Alert severity="warning" sx={{ mb: 2.5 }}>
            Copy the app secret now and store it somewhere safe. You can always regenerate a new pair
            from the application settings.
          </Alert>

          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                App key
              </Typography>
              <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', flexGrow: 1, wordBreak: 'break-all' }}
                >
                  {newCredentials?.app_id}
                </Typography>
                <Tooltip title={copied === 'app_id' ? 'Copied' : 'Copy'}>
                  <IconButton
                    size="small"
                    onClick={() => handleCopy('app_id', newCredentials?.app_id ?? '')}
                  >
                    <Iconify icon={copied === 'app_id' ? 'solar:check-circle-bold' : 'solar:copy-bold'} />
                  </IconButton>
                </Tooltip>
              </Paper>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                App secret
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={newCredentials?.app_secret ?? ''}
                type={secretVisible ? 'text' : 'password'}
                slotProps={{
                  htmlInput: { readOnly: true, style: { fontFamily: 'monospace' } },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSecretVisible(!secretVisible)}>
                          <Iconify icon={secretVisible ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                        </IconButton>
                        <Tooltip title={copied === 'app_secret' ? 'Copied' : 'Copy'}>
                          <IconButton
                            size="small"
                            onClick={() => handleCopy('app_secret', newCredentials?.app_secret ?? '')}
                          >
                            <Iconify
                              icon={copied === 'app_secret' ? 'solar:check-circle-bold' : 'solar:copy-bold'}
                            />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              setNewCredentials(null);
              setSecretVisible(false);
            }}
          >
            I have saved the credentials
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!copied}
        autoHideDuration={2000}
        onClose={() => setCopied('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          Copied to clipboard
        </Alert>
      </Snackbar>
    </DashboardContent>
  );
}
