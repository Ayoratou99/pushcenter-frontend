import type { TemplateType, TransferFormat } from 'src/services/template-transfer.service';

import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
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

import { useLatestRequest } from 'src/hooks/use-latest-request';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  businessService,
  smsTemplateService,
  emailTemplateService,
  whatsappTemplateService,
  templateTransferService,
} from 'src/services';

import { Iconify } from 'src/components/iconify';
import { TableFilters } from 'src/components/table-filters';

import { TemplateImportDialog } from '../template-import-dialog';

// ----------------------------------------------------------------------

type TemplateRow = {
  id: number;
  business_id: number;
  name: string;
  type: TemplateType;
  category?: string;
  status: string;
  is_active?: boolean;
  usage_count: number;
  created_at: string;
  subject?: string;
  language?: string;
  business?: { id: number; name: string };
};

const SERVICES = {
  email: emailTemplateService,
  sms: smsTemplateService,
  whatsapp: whatsappTemplateService,
} as const;

const EMPTY_FILTERS: Record<string, string> = {
  search: '',
  type: '',
  status: '',
  category: '',
  business_id: '',
  is_active: '',
  language: '',
  created_from: '',
  created_to: '',
  min_usage_count: '',
};

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  active: 'success',
  approved: 'success',
  draft: 'warning',
  pending: 'info',
  rejected: 'error',
  disabled: 'error',
  archived: 'default',
};

const TYPE_COLOR: Record<string, 'primary' | 'secondary' | 'success' | 'default'> = {
  email: 'primary',
  sms: 'secondary',
  whatsapp: 'success',
};

export function TemplatesView() {
  const navigate = useNavigate();
  const { start, isCurrent } = useLatestRequest();

  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [businesses, setBusinesses] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string>>(EMPTY_FILTERS);

  const [selected, setSelected] = useState<TemplateRow[]>([]);
  const [deleting, setDeleting] = useState<TemplateRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportMenu, setExportMenu] = useState<{ anchor: HTMLElement; row?: TemplateRow } | null>(null);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  useEffect(() => {
    businessService
      .getAll({ per_page: 100 })
      .then((response) => setBusinesses(response.data.data))
      .catch(() => setBusinesses([]));
  }, []);

  const loadTemplates = useCallback(async () => {
    const token = start();
    setLoading(true);

    const shared: Record<string, any> = {
      page: page + 1,
      per_page: rowsPerPage,
      sort_by: sortBy,
      sort_dir: sortDir,
    };

    // `type` picks which endpoints to hit; everything else is a real query param.
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && key !== 'type') shared[key] = value;
    });

    const types: TemplateType[] = filters.type
      ? [filters.type as TemplateType]
      : ['email', 'sms', 'whatsapp'];

    try {
      const responses = await Promise.all(
        types.map(async (type) => {
          // `language` only exists on WhatsApp templates.
          const params = type === 'whatsapp' ? shared : { ...shared, language: undefined };
          const response = await SERVICES[type].getAll(params as any);

          return {
            type,
            rows: (response.data.data as any[]).map((row) => ({ ...row, type })),
            total: response.data.total,
          };
        })
      );

      // A newer request already took over; its answer is the current one.
      if (!isCurrent(token)) return;

      const rows = responses.flatMap((response) => response.rows) as TemplateRow[];
      rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTemplates(rows);
      setTotal(responses.reduce((sum, response) => sum + response.total, 0));
    } catch (err: any) {
      if (!isCurrent(token)) return;
      setToast({ message: err?.response?.data?.message || 'Could not load templates', severity: 'error' });
    } finally {
      if (isCurrent(token)) setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortDir, filters, start, isCurrent]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters((previous) => ({ ...previous, [name]: value }));
    setSelected([]);
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

  const toggleRow = (row: TemplateRow) =>
    setSelected((previous) =>
      previous.some((item) => item.id === row.id && item.type === row.type)
        ? previous.filter((item) => !(item.id === row.id && item.type === row.type))
        : [...previous, row]
    );

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);

    try {
      await SERVICES[deleting.type].delete(deleting.id);
      setToast({ message: 'Template deleted', severity: 'success' });
      setDeleting(null);
      setSelected([]);
      loadTemplates();
    } catch (err: any) {
      setToast({
        message: err?.response?.data?.message || 'Could not delete the template',
        severity: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async (format: TransferFormat) => {
    const row = exportMenu?.row;
    setExportMenu(null);

    try {
      if (row) {
        await templateTransferService.exportOne(row.type, row.id, format);
        setToast({ message: `“${row.name}” exported as ${format.toUpperCase()}`, severity: 'success' });
        return;
      }

      // Bulk export works per type, since a file holds one kind of template.
      const byType = selected.reduce<Record<string, number[]>>((groups, item) => {
        groups[item.type] = [...(groups[item.type] ?? []), item.id];
        return groups;
      }, {});

      await Promise.all(
        Object.entries(byType).map(([type, ids]) =>
          templateTransferService.exportMany(type as TemplateType, ids, format)
        )
      );

      setToast({
        message: `${selected.length} template(s) exported as ${format.toUpperCase()}`,
        severity: 'success',
      });
    } catch (err: any) {
      setToast({ message: err?.response?.data?.message || 'The export failed', severity: 'error' });
    }
  };

  const filterFields = [
    { type: 'search' as const, name: 'search', label: 'Search', placeholder: 'Name, subject, content…' },
    {
      type: 'select' as const,
      name: 'type',
      label: 'Channel',
      options: [
        { value: 'email', label: 'Email' },
        { value: 'sms', label: 'SMS' },
        { value: 'whatsapp', label: 'WhatsApp' },
      ],
    },
    {
      type: 'select' as const,
      name: 'status',
      label: 'Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
        { value: 'pending', label: 'Pending (WhatsApp)' },
        { value: 'approved', label: 'Approved (WhatsApp)' },
        { value: 'rejected', label: 'Rejected (WhatsApp)' },
      ],
    },
    {
      type: 'select' as const,
      name: 'category',
      label: 'Category',
      options: [
        { value: 'marketing', label: 'Marketing' },
        { value: 'transactional', label: 'Transactional' },
        { value: 'notification', label: 'Notification' },
        { value: 'otp', label: 'OTP' },
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
      label: 'Enabled',
      options: [
        { value: '1', label: 'Yes' },
        { value: '0', label: 'No' },
      ],
    },
    {
      type: 'select' as const,
      name: 'language',
      label: 'Language',
      options: [
        { value: 'fr', label: 'French' },
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
      ],
    },
    { type: 'date' as const, name: 'created_from', label: 'Created from' },
    { type: 'date' as const, name: 'created_to', label: 'Created to' },
    { type: 'number' as const, name: 'min_usage_count', label: 'Min. uses' },
  ];

  return (
    <DashboardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Templates
        </Typography>

        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:import-bold" />}
          onClick={() => setImportOpen(true)}
        >
          Import
        </Button>

        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => navigate('/template-create')}
        >
          Create template
        </Button>
      </Box>

      <TableFilters
        fields={filterFields}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => {
          setFilters(EMPTY_FILTERS);
          setSelected([]);
          setPage(0);
        }}
      />

      <Card>
        {selected.length > 0 && (
          <Toolbar
            sx={{
              gap: 2,
              pl: 2,
              pr: 1,
              bgcolor: 'primary.lighter',
              color: 'primary.darker',
            }}
          >
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              {selected.length} selected
            </Typography>

            <Button
              size="small"
              variant="contained"
              startIcon={<Iconify icon="solar:export-bold" />}
              onClick={(event) => setExportMenu({ anchor: event.currentTarget })}
            >
              Export
            </Button>

            <Button size="small" color="inherit" onClick={() => setSelected([])}>
              Clear
            </Button>
          </Toolbar>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < templates.length}
                    checked={templates.length > 0 && selected.length === templates.length}
                    onChange={(event) => setSelected(event.target.checked ? templates : [])}
                  />
                </TableCell>
                <TableCell sortDirection={sortBy === 'name' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortDir : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>Channel</TableCell>
                <TableCell>Application</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sortDirection={sortBy === 'usage_count' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'usage_count'}
                    direction={sortBy === 'usage_count' ? sortDir : 'asc'}
                    onClick={() => handleSort('usage_count')}
                  >
                    Uses
                  </TableSortLabel>
                </TableCell>
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
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No template matches these filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((row) => {
                  const isSelected = selected.some(
                    (item) => item.id === row.id && item.type === row.type
                  );

                  return (
                    <TableRow key={`${row.type}-${row.id}`} hover selected={isSelected}>
                      <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} onChange={() => toggleRow(row)} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.name}</Typography>
                        {row.subject && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {row.subject}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={row.type} color={TYPE_COLOR[row.type] ?? 'default'} />
                      </TableCell>
                      <TableCell>{row.business?.name ?? '-'}</TableCell>
                      <TableCell>{row.category ? <Chip size="small" label={row.category} /> : '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.status}
                          color={STATUS_COLOR[row.status] ?? 'default'}
                        />
                      </TableCell>
                      <TableCell>{row.usage_count}</TableCell>
                      <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/templates/${row.type}/${row.id}/view`)}
                            >
                              <Iconify icon="solar:eye-bold" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/templates/${row.type}/${row.id}/edit`)}
                            >
                              <Iconify icon="solar:pen-bold" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Export">
                            <IconButton
                              size="small"
                              onClick={(event) => setExportMenu({ anchor: event.currentTarget, row })}
                            >
                              <Iconify icon="solar:export-bold" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleting(row)}>
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
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

      <Menu
        open={!!exportMenu}
        anchorEl={exportMenu?.anchor}
        onClose={() => setExportMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleExport('json')}>
          <Iconify icon="solar:code-file-bold" sx={{ mr: 1.5 }} />
          Export as JSON
        </MenuItem>
        <MenuItem onClick={() => handleExport('txt')}>
          <Iconify icon="solar:document-text-bold" sx={{ mr: 1.5 }} />
          Export as TXT
        </MenuItem>
      </Menu>

      <TemplateImportDialog
        open={importOpen}
        businesses={businesses}
        onClose={() => setImportOpen(false)}
        onImported={(message) => {
          setToast({ message, severity: 'success' });
          loadTemplates();
        }}
      />

      <Dialog open={!!deleting} onClose={() => setDeleting(null)}>
        <DialogTitle>Delete template</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete “{deleting?.name}”? This cannot be undone.
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
