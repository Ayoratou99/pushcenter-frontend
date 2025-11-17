import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { type Business, businessService } from 'src/services';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function BusinessesView() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  
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
  }, [page, rowsPerPage, status, search]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: page + 1,
        per_page: rowsPerPage,
      };
      
      if (status) params.status = status;
      if (search) params.search = search;
      
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

  const handleClearFilters = () => {
    setStatus('');
    setSearch('');
    setPage(0);
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
        await businessService.create(formData);
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
          Businesses
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenDialog}
        >
          Create Business
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search businesses..."
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <Iconify icon="eva:search-fill" sx={{ ml: 1, mr: 0.5, color: 'text.disabled' }} />,
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            color="inherit"
            onClick={handleClearFilters}
            startIcon={<Iconify icon="solar:restart-bold" />}
          >
            Clear
          </Button>
        </Box>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell>Credits Balance</TableCell>
                <TableCell>Created At</TableCell>
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
                      <Chip label={business.status} color={getStatusColor(business.status)} size="small" />
                    </TableCell>
                    <TableCell>{business.subscription_tier || '-'}</TableCell>
                    <TableCell>{business.credits_balance || 0}</TableCell>
                    <TableCell>{new Date(business.created_at).toLocaleString()}</TableCell>
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
    </DashboardContent>
  );
}
