import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  type Message,
  messageService,
  businessService,
  smsTemplateService,
  emailTemplateService,
  whatsappTemplateService,
} from 'src/services';

import { TableFilters } from 'src/components/table-filters';

// ----------------------------------------------------------------------

type MessageRow = Message & {
  business?: { id: number; name: string };
  email_message?: { recipient_email?: string; subject?: string; template_id?: number | null };
  sms_message?: { recipient_number?: string; template_id?: number | null };
  whatsapp_message?: { recipient_number?: string; template_id?: number | null };
};

const EMPTY_FILTERS: Record<string, string> = {
  search: '',
  message_type: '',
  status: '',
  business_id: '',
  template_id: '',
  is_template: '',
  recipient: '',
  campaign_id: '',
  has_error: '',
  start_date: '',
  end_date: '',
  min_cost: '',
  max_cost: '',
};

const STATUS_COLOR: Record<string, 'success' | 'info' | 'error' | 'warning' | 'default'> = {
  delivered: 'success',
  read: 'success',
  sent: 'info',
  sending: 'info',
  queued: 'info',
  failed: 'error',
  cancelled: 'error',
  pending: 'warning',
};

const TYPE_COLOR: Record<string, 'primary' | 'secondary' | 'success' | 'default'> = {
  email: 'primary',
  sms: 'secondary',
  whatsapp: 'success',
};

export function MessagesView() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [businesses, setBusinesses] = useState<{ id: number; name: string }[]>([]);
  const [templates, setTemplates] = useState<{ id: number; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string>>(EMPTY_FILTERS);
  const [error, setError] = useState('');

  useEffect(() => {
    businessService
      .getAll({ per_page: 100 })
      .then((response) => setBusinesses(response.data.data))
      .catch(() => setBusinesses([]));
  }, []);

  // The template filter offers every channel's templates, labelled by channel.
  useEffect(() => {
    const params = { per_page: 100 } as any;

    Promise.all([
      emailTemplateService.getAll(params).catch(() => null),
      smsTemplateService.getAll(params).catch(() => null),
      whatsappTemplateService.getAll(params).catch(() => null),
    ]).then(([email, sms, whatsapp]) => {
      const collect = (response: any, type: string) =>
        (response?.data?.data ?? []).map((row: any) => ({ id: row.id, name: row.name, type }));

      setTemplates([
        ...collect(email, 'email'),
        ...collect(sms, 'sms'),
        ...collect(whatsapp, 'whatsapp'),
      ]);
    });
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params: Record<string, any> = {
        page: page + 1,
        per_page: rowsPerPage,
        sort_by: sortBy,
        sort_dir: sortDir,
      };

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') params[key] = value;
      });

      const response = await messageService.getAll(params);
      setMessages(response.data.data as MessageRow[]);
      setTotal(response.data.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not load messages');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortDir, filters]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters((previous) => ({ ...previous, [name]: value }));
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

  const recipientOf = (row: MessageRow) =>
    row.email_message?.recipient_email ??
    row.sms_message?.recipient_number ??
    row.whatsapp_message?.recipient_number ??
    '-';

  // Only offer the templates of the selected channel, when one is selected.
  const templateOptions = templates
    .filter((template) => !filters.message_type || template.type === filters.message_type)
    .map((template) => ({
      value: String(template.id),
      label: filters.message_type ? template.name : `[${template.type}] ${template.name}`,
    }));

  const filterFields = [
    {
      type: 'search' as const,
      name: 'search',
      label: 'Search',
      placeholder: 'Message id, external id, campaign…',
    },
    {
      type: 'select' as const,
      name: 'message_type',
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
        { value: 'pending', label: 'Pending' },
        { value: 'queued', label: 'Queued' },
        { value: 'sending', label: 'Sending' },
        { value: 'sent', label: 'Sent' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'read', label: 'Read' },
        { value: 'failed', label: 'Failed' },
        { value: 'cancelled', label: 'Cancelled' },
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
      name: 'template_id',
      label: 'Template',
      minWidth: 220,
      options: templateOptions,
    },
    {
      type: 'select' as const,
      name: 'is_template',
      label: 'Source',
      options: [
        { value: '1', label: 'From a template' },
        { value: '0', label: 'Free form' },
      ],
    },
    { type: 'text' as const, name: 'recipient', label: 'Recipient', placeholder: 'Email or phone' },
    { type: 'text' as const, name: 'campaign_id', label: 'Campaign' },
    {
      type: 'select' as const,
      name: 'has_error',
      label: 'Errors',
      options: [
        { value: '1', label: 'With error' },
        { value: '0', label: 'Without error' },
      ],
    },
    { type: 'date' as const, name: 'start_date', label: 'From' },
    { type: 'date' as const, name: 'end_date', label: 'To' },
    { type: 'number' as const, name: 'min_cost', label: 'Min. cost' },
    { type: 'number' as const, name: 'max_cost', label: 'Max. cost' },
  ];

  return (
    <DashboardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Messages
        </Typography>
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
                <TableCell>Message ID</TableCell>
                <TableCell>Channel</TableCell>
                <TableCell>Application</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell sortDirection={sortBy === 'status' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortDir : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'cost' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'cost'}
                    direction={sortBy === 'cost' ? sortDir : 'asc'}
                    onClick={() => handleSort('cost')}
                  >
                    Cost
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
                <TableCell sortDirection={sortBy === 'sent_at' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'sent_at'}
                    direction={sortBy === 'sent_at' ? sortDir : 'asc'}
                    onClick={() => handleSort('sent_at')}
                  >
                    Sent
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No message matches these filters
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {row.message_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.message_type}
                        color={TYPE_COLOR[row.message_type] ?? 'default'}
                      />
                    </TableCell>
                    <TableCell>{row.business?.name ?? '-'}</TableCell>
                    <TableCell>{recipientOf(row)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip
                          size="small"
                          label={row.status}
                          color={STATUS_COLOR[row.status] ?? 'default'}
                        />
                        {row.error_message && (
                          <Tooltip title={row.error_message}>
                            <Chip size="small" color="error" variant="outlined" label="!" />
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{row.cost ? `${row.cost} ${row.currency}` : '-'}</TableCell>
                    <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                    <TableCell>{row.sent_at ? new Date(row.sent_at).toLocaleString() : '-'}</TableCell>
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

      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </DashboardContent>
  );
}
