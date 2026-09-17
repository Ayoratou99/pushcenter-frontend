import type { ManagedUser } from 'src/services/user.service';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { useAuth } from 'src/hooks/useAuth';

import { userService } from 'src/services/user.service';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { TableFilters } from 'src/components/table-filters';

import { UserFormDialog } from './user-form-dialog';

// ----------------------------------------------------------------------

type BusinessOption = { id: number; name: string; status: string };

const EMPTY_FILTERS = {
  search: '',
  role: '',
  scope: '',
  is_active: '',
  two_factor: '',
  business_id: '',
  created_from: '',
  created_to: '',
};

export function UsersView() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string>>(EMPTY_FILTERS);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const response = await userService.getAll({
        page: page + 1,
        per_page: rowsPerPage,
        sort_by: sortBy,
        sort_dir: sortDir,
        ...(Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')) as any),
      });

      setUsers(response.data.data);
      setTotal(response.data.total);
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Could not load users', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortDir, filters]);

  useEffect(() => {
    userService.businessOptions().then(setBusinesses).catch(() => setBusinesses([]));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((previous) => ({ ...previous, [name]: value }));
    setPage(0);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);

    try {
      await userService.delete(deleting.id);
      setToast({ message: 'User deleted', severity: 'success' });
      setDeleting(null);
      loadUsers();
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Could not delete the user', severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleResetTwoFactor = async (target: ManagedUser) => {
    try {
      await userService.resetTwoFactor(target.id);
      setToast({
        message: `${target.name} will configure Google Authenticator again on their next sign-in.`,
        severity: 'success',
      });
      loadUsers();
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'Could not reset two-factor', severity: 'error' });
    }
  };

  const filterFields = [
    { type: 'search' as const, name: 'search', label: 'Search', placeholder: 'Name, email or phone' },
    {
      type: 'select' as const,
      name: 'role',
      label: 'Role',
      options: [
        { value: 'admin', label: 'Administrator' },
        { value: 'manager', label: 'Manager' },
      ],
    },
    {
      type: 'select' as const,
      name: 'scope',
      label: 'Access',
      options: [
        { value: 'global', label: 'All applications' },
        { value: 'restricted', label: 'Specific applications' },
      ],
    },
    {
      type: 'select' as const,
      name: 'business_id',
      label: 'Application',
      minWidth: 200,
      options: businesses.map((business) => ({ value: String(business.id), label: business.name })),
    },
    {
      type: 'select' as const,
      name: 'is_active',
      label: 'Status',
      options: [
        { value: '1', label: 'Active' },
        { value: '0', label: 'Disabled' },
      ],
    },
    {
      type: 'select' as const,
      name: 'two_factor',
      label: '2FA',
      options: [
        { value: 'enabled', label: 'Configured' },
        { value: 'disabled', label: 'Not configured' },
      ],
    },
    { type: 'date' as const, name: 'created_from', label: 'Created from' },
    { type: 'date' as const, name: 'created_to', label: 'Created to' },
  ];

  return (
    <DashboardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          New user
        </Button>
      </Box>

      <TableFilters
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => {
          setFilters(EMPTY_FILTERS);
          setPage(0);
        }}
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
                <TableCell>Role</TableCell>
                <TableCell>Applications</TableCell>
                <TableCell>2FA</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sortDirection={sortBy === 'last_login_at' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'last_login_at'}
                    direction={sortBy === 'last_login_at' ? sortDir : 'asc'}
                    onClick={() => handleSort('last_login_at')}
                  >
                    Last sign-in
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No user matches these filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.role === 'admin' ? 'Administrator' : 'Manager'}
                        color={row.role === 'admin' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {row.role === 'admin' || row.scope === 'global' ? (
                        <Chip size="small" variant="outlined" label="All applications" />
                      ) : row.businesses?.length ? (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {row.businesses.slice(0, 2).map((business) => (
                            <Chip key={business.id} size="small" label={business.name} />
                          ))}
                          {row.businesses.length > 2 && (
                            <Tooltip title={row.businesses.slice(2).map((b) => b.name).join(', ')}>
                              <Chip size="small" label={`+${row.businesses.length - 2}`} />
                            </Tooltip>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'warning.main' }}>
                          None assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={row.two_factor_enabled ? 'success' : 'warning'}
                        label={row.two_factor_enabled ? 'Configured' : 'Pending'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={row.is_active ? 'success' : 'error'}
                        variant="outlined"
                        label={row.is_active ? 'Active' : 'Disabled'}
                      />
                    </TableCell>
                    <TableCell>
                      {row.last_login_at ? new Date(row.last_login_at).toLocaleString() : 'Never'}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditing(row);
                              setFormOpen(true);
                            }}
                          >
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Reset Google Authenticator">
                          <span>
                            <IconButton
                              size="small"
                              disabled={!row.two_factor_enabled}
                              onClick={() => handleResetTwoFactor(row)}
                            >
                              <Iconify icon="solar:restart-bold" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title={row.id === currentUser?.id ? 'You cannot delete yourself' : 'Delete'}>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={row.id === currentUser?.id}
                              onClick={() => setDeleting(row)}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
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
          onPageChange={(_, value) => setPage(value)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      <UserFormDialog
        open={formOpen}
        user={editing}
        businesses={businesses}
        onClose={() => setFormOpen(false)}
        onSaved={(message) => {
          setToast({ message, severity: 'success' });
          loadUsers();
        }}
      />

      <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle>Delete user</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete {deleting?.name} ({deleting?.email})? They lose access immediately.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)} disabled={busy}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={busy}>
            {busy ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

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
    </DashboardContent>
  );
}
