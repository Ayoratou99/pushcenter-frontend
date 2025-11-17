import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';

import { DashboardContent } from 'src/layouts/dashboard';
import { 
  type Template, 
  emailTemplateService,
  smsTemplateService,
  whatsappTemplateService,
} from 'src/services';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function TemplatesView() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Filters
  const [templateType, setTemplateType] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [businessFilter, setBusinessFilter] = useState('');
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, templateType, status, category, search, businessFilter]);

  const loadBusinesses = async () => {
    try {
      const { businessService } = await import('src/services');
      const response = await businessService.getAll({ per_page: 100 });
      setBusinesses(response.data.data);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: page + 1,
        per_page: rowsPerPage,
      };
      
      if (status) params.status = status;
      if (category) params.category = category;
      if (search) params.search = search;
      if (businessFilter) params.business_id = businessFilter;
      
      // Fetch from specific endpoints based on type filter
      let allTemplates: Template[] = [];
      let totalCount = 0;

      if (!templateType || templateType === 'email') {
        const emailResponse = await emailTemplateService.getAll(params);
        allTemplates = [...allTemplates, ...emailResponse.data.data.map((t: any) => ({ ...t, type: 'email' }))];
        totalCount += emailResponse.data.total;
      }

      if (!templateType || templateType === 'sms') {
        const smsResponse = await smsTemplateService.getAll(params);
        allTemplates = [...allTemplates, ...smsResponse.data.data.map((t: any) => ({ ...t, type: 'sms' }))];
        totalCount += smsResponse.data.total;
      }

      if (!templateType || templateType === 'whatsapp') {
        const whatsappResponse = await whatsappTemplateService.getAll(params);
        allTemplates = [...allTemplates, ...whatsappResponse.data.data.map((t: any) => ({ ...t, type: 'whatsapp' }))];
        totalCount += whatsappResponse.data.total;
      }

      // Sort by created_at descending
      allTemplates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setTemplates(allTemplates);
      setTotal(totalCount);
    } catch (error) {
      console.error('Failed to load templates:', error);
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

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      setDeleting(true);
      
      // Delete from the appropriate service based on type
      if (templateToDelete.type === 'email') {
        await emailTemplateService.delete(templateToDelete.id);
      } else if (templateToDelete.type === 'sms') {
        await smsTemplateService.delete(templateToDelete.id);
      } else if (templateToDelete.type === 'whatsapp') {
        await whatsappTemplateService.delete(templateToDelete.id);
      }
      
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      // Reload templates
      loadTemplates();
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      alert(error.response?.data?.message || 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  const handleClearFilters = () => {
    setTemplateType('');
    setStatus('');
    setCategory('');
    setSearch('');
    setBusinessFilter('');
    setPage(0);
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
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

  if (loading && templates.length === 0) {
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
          Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => navigate('/template-create')}
        >
          Create Template
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
            placeholder="Search templates..."
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <Iconify icon="eva:search-fill" sx={{ ml: 1, mr: 0.5, color: 'text.disabled' }} />,
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={templateType}
              label="Type"
              onChange={(e) => setTemplateType(e.target.value)}
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
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
              <MenuItem value="transactional">Transactional</MenuItem>
              <MenuItem value="notification">Notification</MenuItem>
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
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Usage Count</TableCell>
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
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No templates found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>
                      <Chip label={template.type} color={getTypeColor(template.type)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={template.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={template.status} color={getStatusColor(template.status)} size="small" />
                    </TableCell>
                    <TableCell>{template.usage_count}</TableCell>
                    <TableCell>{new Date(template.created_at).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Iconify icon="solar:eye-bold" />}
                                    onClick={() => navigate(`/templates/${template.type}/${template.id}/view`)}
                                >
                                    View
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<Iconify icon="solar:pen-bold" />}
                                    onClick={() => navigate(`/templates/${template.type}/${template.id}/edit`)}
                                >
                                    Edit
                                </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                          onClick={() => handleDeleteClick(template)}
                        >
                          Delete
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Template
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the template "{templateToDelete?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
