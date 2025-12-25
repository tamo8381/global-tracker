import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  MenuItem,
  Menu,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  CircularProgress,
  FormHelperText,
  Grid,
  Card,
  CardContent,
  Avatar,
  Badge,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  People as PeopleIcon,
  Visibility as ViewIcon,
  FileDownload as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import api, { companiesApi, countriesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AvatarWithFallback from '../components/AvatarWithFallback';

const CompanyForm = ({ open, handleClose, company, onSubmit }) => {
  const isEdit = Boolean(company?._id);
  const [ipInput, setIpInput] = useState('');
  const [subdomainInput, setSubdomainInput] = useState('');
  const [currentIps, setCurrentIps] = useState(() => Array.isArray(company?.ipAddresses) ? company.ipAddresses : []);
  const [currentSubdomains, setCurrentSubdomains] = useState(() => Array.isArray(company?.subdomains) ? company.subdomains : []);
  const { enqueueSnackbar } = useSnackbar();
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  // Fetch countries for the dropdown
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const response = await countriesApi.getAll();
        setCountries(response.data);
      } catch (error) {
        console.error('Error fetching countries:', error);
        enqueueSnackbar('Failed to load countries', { variant: 'error' });
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, [enqueueSnackbar]);
  const handleAddIp = async () => {
    const val = ipInput.trim();
    if (!val) return;
    let html = null;
    try {
      const resp = await companiesApi.addIpAddress(company._id, val);
      const ips = extractArrayFromResp(resp, 'ipAddresses');
      setCurrentIps(ips);
      setIpInput('');
      enqueueSnackbar('IP added', { variant: 'success' });
    } catch (err) {
      console.error('Add IP failed', err);
      enqueueSnackbar('Failed to add IP', { variant: 'error' });
    }
  };
  const handleRemoveIp = async (ip) => {
    try {
      const resp = await companiesApi.removeIpAddress(company._id, ip);
      const ips = extractArrayFromResp(resp, 'ipAddresses');
      setCurrentIps(ips);
      enqueueSnackbar('IP removed', { variant: 'success' });
    } catch (err) {
      console.error('Remove IP failed', err);
      enqueueSnackbar('Failed to remove IP', { variant: 'error' });
    }
  };

  const handleAddSubdomain = async () => {
    const val = subdomainInput.trim();
    if (!val) return;
    try {
      const resp = await companiesApi.addSubdomain(company._id, val);
      const subs = extractArrayFromResp(resp, 'subdomains');
      setCurrentSubdomains(subs);
      setSubdomainInput('');
      enqueueSnackbar('Subdomain added', { variant: 'success' });
    } catch (err) {
      console.error('Add subdomain failed', err);
      enqueueSnackbar('Failed to add subdomain', { variant: 'error' });
    }
  };

  const handleRemoveSubdomain = async (s) => {
    try {
      const resp = await companiesApi.removeSubdomain(company._id, s);
      const subs = extractArrayFromResp(resp, 'subdomains');
      setCurrentSubdomains(subs);
      enqueueSnackbar('Subdomain removed', { variant: 'success' });
    } catch (err) {
      console.error('Remove subdomain failed', err);
      enqueueSnackbar('Failed to remove subdomain', { variant: 'error' });
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: company?.name || '',
      country: company?.country?._id || '',
      industry: company?.industry || '',
      website: company?.website || '',
      foundedYear: company?.foundedYear || '',
      isActive: company?.isActive ?? true,
      // For create: allow comma-separated entry; for edit these are managed via API
      ipAddresses: '',
      subdomains: ''
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Company name is required'),
      country: Yup.string().required('Country is required'),
      industry: Yup.string(),
      website: Yup.string().url('Must be a valid URL'),
      foundedYear: Yup.number()
        .typeError('Must be a valid year')
        .min(1800, 'Year must be after 1800')
        .max(new Date().getFullYear(), `Year must be ${new Date().getFullYear()} or earlier`)
        .nullable(),
      }),
      onSubmit: async (values, { setSubmitting }) => {
        try {
          const payload = {
            name: (values.name || '').trim(),
            country: (values.country || '').trim(),
            industry: (values.industry || '').trim(),
            website: (values.website || '').trim().toLowerCase(),
            foundedYear:
              values.foundedYear === '' || values.foundedYear === null || typeof values.foundedYear === 'undefined'
                ? undefined
                : Number(values.foundedYear),
            // Do NOT include employeeCount; it is computed from People data
            isActive: values.isActive ?? true,
            // On create allow initial ips/subdomains; on edit these are managed via dedicated endpoints
            ...(isEdit ? {} : { ipAddresses: (values.ipAddresses || '').split(',').map(s => s.trim()).filter(Boolean) }),
            ...(isEdit ? {} : { subdomains: (values.subdomains || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean) }),
          };

          await onSubmit(payload);
          enqueueSnackbar(isEdit ? 'Company updated' : 'Company added', { variant: 'success' });
          handleClose();
        } catch (error) {
          console.error('Error saving company:', error);
          const message =
            error?.message || error?.response?.data?.message || 'An error occurred while saving the company';
          enqueueSnackbar(message, { variant: 'error' });
        } finally {
          setSubmitting(false);
        }
      },

      });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit Company' : 'Add New Company'}</DialogTitle>
        <DialogContent dividers>

          <Grid container spacing={2}>
            <Grid item xs={12}>
          <TextField
                margin="normal"
                fullWidth
                id="industry"
                name="industry"
                label="Industry"
                value={formik.values.industry}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.industry && Boolean(formik.errors.industry)}
                helperText={formik.touched.industry && formik.errors.industry}
                disabled={formik.isSubmitting}
              />
              
              <TextField
                margin="normal"
                fullWidth
                id="website"
                name="website"
                label="Website"
                value={formik.values.website}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.website && Boolean(formik.errors.website)}
                helperText={formik.touched.website && formik.errors.website}
                disabled={formik.isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WebsiteIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="foundedYear"
                    name="foundedYear"
                    label="Founded Year"
                    type="number"
                    value={formik.values.foundedYear}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.foundedYear && Boolean(formik.errors.foundedYear)}
                    helperText={formik.touched.foundedYear && formik.errors.foundedYear}
                    disabled={formik.isSubmitting}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: 1800,
                      max: new Date().getFullYear(),
                      step: 1,
                    }}
                  />
                </Grid>
                {/* employeeCount input removed - counts are derived from People */}
              </Grid>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.isActive}
                    onChange={(e) => formik.setFieldValue('isActive', e.target.checked)}
                    name="isActive"
                    color="primary"
                  />
                }
                label={formik.values.isActive ? 'Active' : 'Inactive'}
                sx={{ mt: 2 }}
              />

              {/* IPs and Subdomains management */}
              {isEdit ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">IP Addresses</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                    <TextField
                      size="small"
                      placeholder="e.g. 192.0.2.1"
                      value={ipInput}
                      onChange={(e) => setIpInput(e.target.value)}
                    />
                    <Button variant="outlined" onClick={handleAddIp} disabled={!ipInput.trim()}>Add IP</Button>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    {!Array.isArray(currentIps) || currentIps.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">No IPs</Typography>
                    ) : (
                      currentIps.map(ip => (
                        <Chip key={ip} label={ip} onDelete={() => handleRemoveIp(ip)} sx={{ mr: 1, mt: 1 }} />
                      ))
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2">Subdomains</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                    <TextField
                      size="small"
                      placeholder="e.g. app.example.com"
                      value={subdomainInput}
                      onChange={(e) => setSubdomainInput(e.target.value)}
                    />
                    <Button variant="outlined" onClick={handleAddSubdomain} disabled={!subdomainInput.trim()}>Add Subdomain</Button>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    {!Array.isArray(currentSubdomains) || currentSubdomains.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">No subdomains</Typography>
                    ) : (
                      currentSubdomains.map(s => (
                        <Chip key={s} label={s} onDelete={() => handleRemoveSubdomain(s)} sx={{ mr: 1, mt: 1 }} />
                      ))
                    )}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    margin="normal"
                    id="ipAddresses"
                    name="ipAddresses"
                    label="Initial IP Addresses (comma separated)"
                    value={formik.values.ipAddresses}
                    onChange={formik.handleChange}
                    helperText="Enter IPs separated by commas"
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="subdomains"
                    name="subdomains"
                    label="Initial Subdomains (comma separated)"
                    value={formik.values.subdomains}
                    onChange={formik.handleChange}
                    helperText="Enter subdomains separated by commas"
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className="no-print">
          <Button onClick={handleClose} disabled={formik.isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={!formik.isValid || formik.isSubmitting}
            startIcon={formik.isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isEdit ? 'Update' : 'Add'} Company
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// simple HTML-escape helper used when constructing print HTML
const esc = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Helper to extract an array field from various API response shapes
const extractArrayFromResp = (resp, field) => {
  if (!resp) return [];
  const data = resp.data ?? resp;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[field])) return data[field];
  return [];
};

// Confirmation dialog
const ConfirmationDialog = ({ open, onClose, onConfirm, title, message }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions className="no-print">
      <Button onClick={onClose} color="primary">
        Cancel
      </Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

const Companies = () => {
  const { hasRole } = useAuth();
  const baseURL = api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:5000';
  // Escape text used in generated print/HTML output
  const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const [viewCompany, setViewCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const skipNextFetch = useRef(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  // Local input state to debounce search
  const [searchInput, setSearchInput] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formMode, setFormMode] = useState('add');
  const [totalCount, setTotalCount] = useState(0);
  const [countries, setCountries] = useState([]);
  const [industries, setIndustries] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  const handleExportClick = (event) => setExportAnchorEl(event.currentTarget);
  const handleExportClose = () => setExportAnchorEl(null);
  
  const handleExportJSON = async () => {
    if (!viewCompany) return;
    try {
      const resp = await api.get(`/companies/${viewCompany._id}/export?format=json`);
      const data = resp?.data?.data || [];
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = (viewCompany.name || 'company').replace(/\s+/g, '_');
      link.download = `${safeName}_people.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export JSON failed', err);
      enqueueSnackbar('Failed to export JSON', { variant: 'error' });
    }
  };

  const handleExportCSV = async () => {
    try {
      const resp = await api.get(`/companies/${viewCompany._id}/export?format=csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(viewCompany?.name || 'company').replace(/\s+/g, '_')}_people.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export CSV failed', err);
      enqueueSnackbar('Failed to export CSV', { variant: 'error' });
    }
  };

  const handlePrint = async () => {
    let html = null;
    // If no specific company view is open, print the page
    if (!viewCompany) {
      window.print();
      return;
    }
    // Use iframe-based printing to reliably render content before invoking print
    try {
      const { createCompanyPrintElement, printHTMLString } = await import('../utils/printUtils');
      // Remove any previously generated print elements to avoid duplication
      document.querySelectorAll('.generated-print').forEach(el => { try { el.remove(); } catch (e) {} });

      // Prefer an explicit API base if provided via env; otherwise fall back to
      // a reasonable backend origin (replace client port with 5000).
      const serverBase = (process.env.REACT_APP_API_URL && String(process.env.REACT_APP_API_URL).replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '')) || window.location.origin.replace(/:\d+$/, ':5000');
      const el = createCompanyPrintElement(viewCompany, serverBase);
      html = el.outerHTML;
      console.debug('Companies.handlePrint: generated HTML length', html.length);
      await printHTMLString(html);
      console.debug('Companies.handlePrint: printHTMLString resolved');
    } catch (err) {
      console.error('Print failed', err);
      console.error('Print failed, attempting fallback window.print approach', err);
      // Fallback: open a new window/tab with the HTML and attempt to print
      try {
        const win = window.open('', '_blank');
        if (win) {
          win.document.open();
          win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Print</title></head><body>${html}</body></html>`);
          win.document.close();
          setTimeout(() => { try { win.focus(); win.print(); } catch (e) { console.error('Fallback print failed', e); } }, 600);
          setTimeout(() => { try { win.close(); } catch (e) {} }, 4000);
          enqueueSnackbar('Print initiated (fallback). If the preview is blank, check the browser console for errors.', { variant: 'info' });
        } else {
          enqueueSnackbar('Failed to open print window; popup might be blocked.', { variant: 'error' });
        }
      } catch (err2) {
        console.error('Fallback print failed', err2);
        enqueueSnackbar('Failed to print company info', { variant: 'error' });
      }
    }
  };

  useEffect(() => {
    if (skipNextFetch.current) {
      // skip a single effect-triggered fetch because an immediate override fetch already ran
      skipNextFetch.current = false;
      return;
    }
    fetchData();
  }, [page, rowsPerPage, searchTerm, industryFilter, countryFilter]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(0);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Helper to fetch immediately with overrides (avoids relying on state updates order)
  const fetchDataWithOverrides = async (overrides = {}) => {
    try {
      setLoading(true);
      const params = {
        page: (overrides.page ?? page) + 1,
        limit: overrides.limit ?? rowsPerPage,
        search: overrides.search ?? searchTerm,
        ...((overrides.industryFilter ?? industryFilter) ? { industry: overrides.industryFilter ?? industryFilter } : {}),
        ...((overrides.country ?? countryFilter) ? { country: overrides.country ?? countryFilter } : {})
      };
      console.debug('fetchDataWithOverrides companies params:', params);

      const [companiesRes, countriesRes] = await Promise.all([
        companiesApi.getAll(params),
        countriesApi.getAll()
      ]);

      const companiesData = Array.isArray(companiesRes.data) ? companiesRes.data : [];
      const countriesData = Array.isArray(countriesRes.data) ? countriesRes.data : [];

      // Client-side fallback filtering
      const effectiveIndustry = overrides.industryFilter ?? industryFilter;
      const effectiveCountry = overrides.country ?? countryFilter;
      const effectiveSearch = overrides.search ?? searchTerm;

      const filtered = companiesData.filter(c => {
        if (effectiveIndustry && String(c.industry || '') !== String(effectiveIndustry)) return false;
        if (effectiveCountry) {
          const cid = typeof c.country === 'string' ? c.country : c.country?._id;
          if (!cid || cid !== String(effectiveCountry)) return false;
        }
        if (effectiveSearch) {
          const q = effectiveSearch.toLowerCase();
          if (!((c.name||'').toLowerCase().includes(q) || (c.industry||'').toLowerCase().includes(q))) return false;
        }
        return true;
      });

      setCompanies(filtered);
      setTotalCount((effectiveIndustry || effectiveCountry || effectiveSearch) ? filtered.length : (companiesRes.pagination?.total || companiesData.length));
      setCountries(countriesData);
      const uniqueIndustries = [...new Set((companiesData).map(company => company.industry).filter(industry => industry && typeof industry === 'string'))];
      setIndustries(uniqueIndustries);
    } catch (err) {
      console.error('Error in fetchDataWithOverrides companies:', err);
      enqueueSnackbar('Failed to load companies', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Backwards-compatible wrapper used in several places (e.g. effects, submit handlers)
  const fetchData = async (overrides = {}) => {
    return fetchDataWithOverrides(overrides);
  };

  useEffect(() => {
    if (skipNextFetch.current) {
      // skip a single effect-triggered fetch because an immediate override fetch already ran
      skipNextFetch.current = false;
      return;
    }
    fetchData();
  }, [page, rowsPerPage, searchTerm, industryFilter, countryFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchInput(event.target.value);
    setPage(0);
  };

  const handleIndustryFilterChange = (event) => {
    const val = event.target.value;
    skipNextFetch.current = true;
    setIndustryFilter(val);
    setPage(0);
    fetchDataWithOverrides({ industryFilter: val, page: 0 });
   };

   const handleCountryFilterChange = (event) => {
    const val = event.target.value;
    skipNextFetch.current = true;
    setCountryFilter(val);
    setPage(0);
    fetchDataWithOverrides({ country: val, page: 0 });
   };

  const handleOpenAddForm = () => {
    setFormMode('add');
    setSelectedCompany(null);
    setOpenForm(true);
  };

  const handleOpenEditForm = (company) => {
    setFormMode('edit');
    setSelectedCompany(company);
    setOpenForm(true);
  };

  const handleOpenView = async (company) => {
    try {
      // Fetch full company data including IPs and subdomains
      const [detailResp, peopleResp] = await Promise.all([
        companiesApi.getById(company._id),
        companiesApi.getPeople(company._id)
      ]);

      const detail = detailResp?.data?.data || {};
      const people = Array.isArray(peopleResp?.data?.data) ? peopleResp.data.data : [];

      setViewCompany({ ...detail, people });
    } catch (err) {
      console.error('Failed to load company details', err);
      enqueueSnackbar('Failed to load company details', { variant: 'error' });
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleSubmitCompany = async (values) => {
    try {
      if (formMode === 'add') {
        await companiesApi.create(values);
      } else {
        await companiesApi.update(selectedCompany._id, values);
      }
      fetchData();
    } catch (error) {
      console.error('Error saving company:', error);
      throw error;
    }
  };

  const handleDeleteClick = (company) => {
    setSelectedCompany(company);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await companiesApi.delete(selectedCompany._id);
      enqueueSnackbar('Company deleted successfully', { variant: 'success' });
      fetchData();
    } catch (error) {
      console.error('Error deleting company:', error);
      const message =
        error?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Failed to delete company';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setOpenDeleteDialog(false);
      setSelectedCompany(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedCompany(null);
  };

  const getCountryName = (countryVal) => {
    // Handle both ObjectId string and populated object forms
    const id = typeof countryVal === 'string' ? countryVal : countryVal?._id;
    const country = countries.find(c => c._id === id);
    return country ? country.name : 'N/A';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Companies
        </Typography>
        {hasRole('admin') && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddForm}
          sx={{ minWidth: 150 }}
        >
          Add Company
        </Button>
        )}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search companies..."
                value={searchInput}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (searchInput || searchTerm) && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setSearchInput(''); setSearchTerm(''); }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="industry-filter-label">Industry</InputLabel>
                <Select
                  labelId="industry-filter-label"
                  id="industry-filter"
                  value={industryFilter}
                  onChange={handleIndustryFilterChange}
                  label="Industry"
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>All Industries</em>
                  </MenuItem>
                  {industries.map((industry) => (
                    <MenuItem key={industry} value={industry}>
                      {industry}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="country-filter-label">Country</InputLabel>
                <Select
                  labelId="country-filter-label"
                  id="country-filter"
                  value={countryFilter}
                  onChange={handleCountryFilterChange}
                  label="Country"
                  startAdornment={
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>All Countries</em>
                  </MenuItem>
                  {Array.isArray(countries) && countries.length > 0 ? (
                    countries.map((country) => (
                      <MenuItem key={country._id} value={country._id}>
                        {country.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No countries available</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader aria-label="companies table">
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Employees</TableCell>
                <TableCell>Founded</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>Loading companies...</Typography>
                  </TableCell>
                </TableRow>
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="textSecondary">
                      No companies found
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
                      {searchTerm || industryFilter || countryFilter
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Add a new company to get started.'}
                    </Typography>
                    {hasRole('admin') && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenAddForm}
                      sx={{ mt: 1 }}
                    >
                      Add Company
                    </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow hover key={company._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.main', 
                            color: 'white',
                            width: 40,
                            height: 40,
                            mr: 2
                          }}
                        >
                          {company.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{company.name}</Typography>
                          {company.website && (
                            <Typography 
                              variant="caption" 
                              color="textSecondary"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': { textDecoration: 'underline' },
                                cursor: 'pointer',
                                maxWidth: '200px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              onClick={() => window.open(
                                company.website.startsWith('http') 
                                  ? company.website 
                                  : `https://${company.website}`, 
                                '_blank',
                                'noopener,noreferrer'
                              )}
                            >
                              <WebsiteIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                              {company.website.replace(/^https?:\/\//, '')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {company.industry || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon 
                          color="action" 
                          fontSize="small" 
                          sx={{ mr: 1 }} 
                        />
                        {getCountryName(company.country)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon 
                          color="action" 
                          fontSize="small" 
                          sx={{ mr: 1 }} 
                        />
                        {company.personCount ? company.personCount : (company.employeeCount ? company.employeeCount.toLocaleString() : 'N/A')}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {company.foundedYear || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={company.isActive ? 'Active' : 'Inactive'} 
                        color={company.isActive ? 'success' : 'default'} 
                        size="small"
                        variant="outlined"
                        icon={company.isActive ? 
                          <CheckCircleIcon fontSize="small" /> : 
                          <CancelIcon fontSize="small" />}
                        />
                     </TableCell>
                    <TableCell align="right">
                      {hasRole('admin') ? (
                        <>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenEditForm(company)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteClick(company)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : null}

                      {/* View/Export button available to all users */}
                      <Tooltip title="View / Export">
                        <IconButton size="small" onClick={() => handleOpenView(company)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && companies.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: `1px solid ${theme.palette.divider}`,
              '& .MuiTablePagination-toolbar': {
                minHeight: 56,
              },
            }}
          />
        )}
      </Paper>

      {/* Company Form Dialog */}
      <CompanyForm
        open={openForm}
        handleClose={handleCloseForm}
        company={selectedCompany}
        onSubmit={handleSubmitCompany}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Company"
        message={`Are you sure you want to delete ${selectedCompany?.name}? This action cannot be undone.`}
      />

      {/* View / Export Dialog */}
      <Dialog open={Boolean(viewCompany)} onClose={() => setViewCompany(null)} maxWidth="md" fullWidth>
        <DialogTitle>Company Details</DialogTitle>
        <DialogContent dividers>
          {viewCompany ? (
            <Box className="print-company">
               <Typography variant="h6">{viewCompany.name}</Typography>
               <Typography variant="subtitle2">Country: {viewCompany.country?.name}</Typography>
               <Typography variant="body2">Website: {viewCompany.website || 'N/A'}</Typography>
               <Divider sx={{ my: 2 }} />
               <Typography variant="subtitle1">IP Addresses</Typography>
               {Array.isArray(viewCompany.ipAddresses) && viewCompany.ipAddresses.length > 0 ? (
                 <Box component="ul" sx={{ pl: 2 }}>
                   {viewCompany.ipAddresses.map((ip) => (
                     <li key={ip}><Typography variant="body2">{ip}</Typography></li>
                   ))}
                 </Box>
               ) : (
                 <Typography variant="body2" color="text.secondary">No IPs</Typography>
               )}
               <Divider sx={{ my: 2 }} />
               <Typography variant="subtitle1">Subdomains</Typography>
               {Array.isArray(viewCompany.subdomains) && viewCompany.subdomains.length > 0 ? (
                 <Box component="ul" sx={{ pl: 2 }}>
                   {viewCompany.subdomains.map((s) => (
                     <li key={s}><Typography variant="body2">{s}</Typography></li>
                   ))}
                 </Box>
               ) : (
                 <Typography variant="body2" color="text.secondary">No subdomains</Typography>
               )}
               <Divider sx={{ my: 2 }} />
               <Typography variant="subtitle1">People</Typography>
               {Array.isArray(viewCompany.people) && viewCompany.people.length > 0 ? (
                 <Table size="small">
                   <TableHead>
                     <TableRow>
                       <TableCell>Photo</TableCell>
                       <TableCell>Name</TableCell>
                       <TableCell>Email</TableCell>
                       <TableCell>Position</TableCell>
                     </TableRow>
                   </TableHead>
                   <TableBody>
                     {viewCompany.people.map(p => (
                       <TableRow key={p._id}>
                         <TableCell>
                           <AvatarWithFallback
                             photo={p.photo}
                             firstName={p.firstName}
                             baseURL={baseURL}
                             sx={{ width: 36, height: 36 }}
                           />
                         </TableCell>
                         <TableCell>
                           <Typography variant="body2">{((p.name || `${p.firstName || ''} ${p.lastName || ''}`).trim()) || 'N/A'}</Typography>
                         </TableCell>
                         <TableCell>
                           <Typography variant="body2">{p.email}</Typography>
                         </TableCell>
                         <TableCell>
                           <Typography variant="body2">{p.position || 'N/A'}</Typography>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               ) : (
                 <Typography variant="body2" color="text.secondary">No people found</Typography>
               )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">Loading company details...</Typography>
          )}
        </DialogContent>
        <DialogActions className="no-print">
          {hasRole('admin') && (
            <>
              <Button onClick={handleExportJSON} startIcon={<DownloadIcon />} disabled={!Array.isArray(viewCompany?.people) || viewCompany.people.length === 0}>
                Export JSON
              </Button>
              <Button onClick={handleExportCSV} startIcon={<DownloadIcon />} disabled={!Array.isArray(viewCompany?.people) || viewCompany.people.length === 0}>
                Export CSV
              </Button>
            </>
          )}
          <Button 
            onClick={handlePrint} 
            color="primary"
            startIcon={<PrintIcon />}
          >
            Print
          </Button>
          <Button onClick={() => setViewCompany(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Companies;
