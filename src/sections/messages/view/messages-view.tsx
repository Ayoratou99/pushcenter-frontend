import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { type Message, messageService } from 'src/services';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function MessagesView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [messageType, setMessageType] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [businessFilter, setBusinessFilter] = useState('');
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, messageType, status, startDate, endDate, businessFilter]);

  const loadBusinesses = async () => {
    try {
      const { businessService } = await import('src/services');
      const response = await businessService.getAll({ per_page: 100 });
      setBusinesses(response.data.data);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: page + 1,
        per_page: rowsPerPage,
      };
      
      if (messageType) params.message_type = messageType;
      if (status) params.status = status;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (businessFilter) params.business_id = businessFilter;
      
      const response = await messageService.getAll(params);
      setMessages(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to load messages:', error);
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
    setMessageType('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setBusinessFilter('');
    setPage(0);
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'delivered':
        return 'success';
      case 'sent':
        return 'info';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'primary';
      case 'sms':
        return 'secondary';
      case 'whatsapp':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading && messages.length === 0) {
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
          Messages
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={messageType}
              label="Type"
              onChange={(e) => setMessageType(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="whatsapp">WhatsApp</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="queued">Queued</MenuItem>
              <MenuItem value="sending">Sending</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Business</InputLabel>
            <Select
              value={businessFilter}
              label="Business"
              onChange={(e) => setBusinessFilter(e.target.value)}
            >
              <MenuItem value="">All Businesses</MenuItem>
              {businesses.map((business) => (
                <MenuItem key={business.id} value={business.id}>
                  {business.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <TextField
            size="small"
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

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
                <TableCell>Message ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Sent At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No messages found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow key={message.id} hover>
                    <TableCell>{message.message_id}</TableCell>
                    <TableCell>
                      <Chip label={message.message_type} color={getTypeColor(message.message_type)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={message.status} color={getStatusColor(message.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      {message.cost ? `${message.cost} ${message.currency}` : '-'}
                    </TableCell>
                    <TableCell>{new Date(message.created_at).toLocaleString()}</TableCell>
                    <TableCell>{message.sent_at ? new Date(message.sent_at).toLocaleString() : '-'}</TableCell>
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
    </DashboardContent>
  );
}
