import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  useTheme,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  FormHelperText
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as CompanyIcon,
  LocationOn as LocationIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Transgender as OtherGenderIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import api, { peopleApi, companiesApi, countriesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AvatarWithFallback from '../components/AvatarWithFallback';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male', icon: <MaleIcon /> },
  { value: 'female', label: 'Female', icon: <FemaleIcon /> },
  { value: 'other', label: 'Other', icon: <OtherGenderIcon /> },
];

const PersonForm = ({ open, handleClose, person, onSubmit }) => {
  const isEdit = Boolean(person?._id);
  const { enqueueSnackbar } = useSnackbar();
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const { hasRole } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);

  const baseURL = api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:5000';

  // Fetch companies and countries for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingCompanies(true);
        setLoadingCountries(true);
        
        const [companiesRes, countriesRes] = await Promise.all([
          companiesApi.getAll({ limit: 1000 }),
          countriesApi.getAll()
        ]);
        
        // Ensure data is always an array
        const companiesData = Array.isArray(companiesRes?.data) ? companiesRes.data : [];
        const countriesData = Array.isArray(countriesRes?.data) ? countriesRes.data : [];
        
        setCompanies(companiesData);
        setCountries(countriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        enqueueSnackbar('Failed to load data', { variant: 'error' });
      } finally {
        setLoadingCompanies(false);
        setLoadingCountries(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (open) {
      if (person?.photo) {
        setPreviewSrc(`${baseURL}/uploads/${person.photo}`);
      } else {
        setPreviewSrc(null);
      }
      setSelectedFile(null);
    } else {
      setPreviewSrc(null);
      setSelectedFile(null);
    }
  }, [open, person?.photo]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: person?.firstName || '',
      lastName: person?.lastName || '',
      email: person?.email || '',
      phone: person?.phone || '',
      gender: person?.gender || 'other',
      dateOfBirth: person?.dateOfBirth || '',
      jobTitle: person?.jobTitle || '',
      company: person?.company?._id || '',
      country: person?.country?._id || '',
      city: person?.city || '',
      isActive: person?.isActive ?? true
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required('First name is required'),
      lastName: Yup.string().required('Last name is required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      phone: Yup.string(),
      gender: Yup.string().required('Gender is required'),
      dateOfBirth: Yup.date()
        .max(new Date(), 'Date of birth cannot be in the future')
        .nullable(),
      jobTitle: Yup.string(),
      company: Yup.string().required('Company is required'),
      country: Yup.string().required('Country is required'),
      city: Yup.string(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // Sanitize payload and map to server schema
        const payload = {
          firstName: (values.firstName || '').trim(),
          lastName: (values.lastName || '').trim(),
          email: (values.email || '').trim().toLowerCase(),
          phone: (values.phone || '').trim(),
          position: (values.jobTitle || '').trim(),
          company: (values.company || '').trim(),
          country: (values.country || '').trim(),
          city: (values.city || '').trim(),
          isActive: values.isActive,
          // Optional fields present in server schema
          // department: (values.department || '').trim(),
          // notes: (values.notes || '').trim(),
        };
        
        // Optionally include dateOfBirth if provided
        if (values.dateOfBirth) {
          try {
            payload.dateOfBirth = new Date(values.dateOfBirth).toISOString();
          } catch (_) {
            // ignore invalid date
          }
        }
        
        await onSubmit(payload, selectedFile);
        enqueueSnackbar(
          isEdit ? 'Person updated successfully' : 'Person added successfully',
          { variant: 'success' }
        );
        handleClose();
      } catch (error) {
        console.error('Error saving person:', error);
        const message =
          error?.message ||
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          (Array.isArray(error?.response?.data?.errors) ? error.response.data.errors.map(e=>e.msg).join(', ') : null) ||
          'An error occurred while saving the person';
        enqueueSnackbar(message, { variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const getGenderIcon = (gender) => {
    const genderOption = GENDER_OPTIONS.find(g => g.value === gender);
    return genderOption ? genderOption.icon : <OtherGenderIcon />;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
    >
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>
          {isEdit ? 'Edit Person' : 'Add New Person'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, flexDirection: 'column', alignItems: 'center' }}>
                <Avatar 
                  src={previewSrc || undefined}
                  imgProps={{ onError: () => setPreviewSrc(null), alt: formik.values.firstName ? `${formik.values.firstName} avatar` : undefined }}
                  sx={{ 
                    width: 80, 
                    height: 80,
                    bgcolor: previewSrc ? 'transparent' : 'primary.main',
                    fontSize: '2rem'
                  }}
                >
                  {!previewSrc && (formik.values.firstName?.charAt(0).toUpperCase() || <PersonIcon />)}
                </Avatar>

                {hasRole('admin') && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button component="label" size="small" variant="outlined" startIcon={<UploadIcon />}>
                      Upload Photo
                      <input hidden accept="image/*" type="file" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const maxSize = Number(process.env.REACT_APP_MAX_FILE_UPLOAD) || 2 * 1024 * 1024;
                        if (file.size > maxSize) {
                          enqueueSnackbar(`Please upload an image smaller than ${maxSize} bytes`, { variant: 'error' });
                          return;
                        }
                        if (!file.type || !file.type.startsWith('image')) {
                          enqueueSnackbar('Please select an image file', { variant: 'error' });
                          return;
                        }
                        setSelectedFile(file);
                        setPreviewSrc(URL.createObjectURL(file));
                      }} />
                    </Button>
                    {selectedFile && (
                      <Button size="small" color="inherit" onClick={() => { setSelectedFile(null); if (person?.photo) setPreviewSrc(`${baseURL}/uploads/${person.photo}`); else setPreviewSrc(null); }}>
                        Remove
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="firstName"
                    name="firstName"
                    label="First Name"
                    value={formik.values.firstName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                    helperText={formik.touched.firstName && formik.errors.firstName}
                    disabled={formik.isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="lastName"
                    name="lastName"
                    label="Last Name"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                    helperText={formik.touched.lastName && formik.errors.lastName}
                    disabled={formik.isSubmitting}
                  />
                </Grid>
              </Grid>
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={formik.isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="normal"
                fullWidth
                id="phone"
                name="phone"
                label="Phone Number"
                type="tel"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
                disabled={formik.isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl 
                    fullWidth 
                    margin="normal" 
                    required
                    error={formik.touched.gender && Boolean(formik.errors.gender)}
                  >
                    <InputLabel id="gender-label">Gender</InputLabel>
                    <Select
                      labelId="gender-label"
                      id="gender"
                      name="gender"
                      value={formik.values.gender}
                      label="Gender"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={formik.isSubmitting}
                    >
                      {GENDER_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {option.icon}
                            <Box component="span" sx={{ ml: 1 }}>{option.label}</Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.gender && formik.errors.gender && (
                      <FormHelperText>{formik.errors.gender}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="dateOfBirth"
                    name="dateOfBirth"
                    label="Date of Birth"
                    type="date"
                    value={formik.values.dateOfBirth ? formik.values.dateOfBirth.split('T')[0] : ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
                    helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                    disabled={formik.isSubmitting}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      max: new Date().toISOString().split('T')[0],
                    }}
                  />
                </Grid>
              </Grid>
              
              <TextField
                margin="normal"
                fullWidth
                id="jobTitle"
                name="jobTitle"
                label="Job Title"
                value={formik.values.jobTitle}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.jobTitle && Boolean(formik.errors.jobTitle)}
                helperText={formik.touched.jobTitle && formik.errors.jobTitle}
                disabled={formik.isSubmitting}
              />
              
              <FormControl 
                fullWidth 
                margin="normal" 
                required
                error={formik.touched.company && Boolean(formik.errors.company)}
              >
                <InputLabel id="company-label">Company</InputLabel>
                <Select
                  labelId="company-label"
                  id="company"
                  name="company"
                  value={formik.values.company}
                  label="Company"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={formik.isSubmitting || loadingCompanies}
                  startAdornment={
                    <InputAdornment position="start">
                      <CompanyIcon />
                    </InputAdornment>
                  }
                >
                  {loadingCompanies ? (
                    <MenuItem disabled>Loading companies...</MenuItem>
                  ) : (
                    companies.map((company) => (
                      <MenuItem key={company._id} value={company._id}>
                        {company.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {formik.touched.company && formik.errors.company && (
                  <FormHelperText>{formik.errors.company}</FormHelperText>
                )}
              </FormControl>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl 
                    fullWidth 
                    margin="normal" 
                    required
                    error={formik.touched.country && Boolean(formik.errors.country)}
                  >
                    <InputLabel id="country-label">Country</InputLabel>
                    <Select
                      labelId="country-label"
                      id="country"
                      name="country"
                      value={formik.values.country}
                      label="Country"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={formik.isSubmitting || loadingCountries}
                      startAdornment={
                        <InputAdornment position="start">
                          <LocationIcon />
                        </InputAdornment>
                      }
                    >
                      {loadingCountries ? (
                        <MenuItem disabled>Loading countries...</MenuItem>
                      ) : (
                        countries.map((country) => (
                          <MenuItem key={country._id} value={country._id}>
                            {country.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {formik.touched.country && formik.errors.country && (
                      <FormHelperText>{formik.errors.country}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="city"
                    name="city"
                    label="City"
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.city && Boolean(formik.errors.city)}
                    helperText={formik.touched.city && formik.errors.city}
                    disabled={formik.isSubmitting}
                  />
                </Grid>
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
            {isEdit ? 'Update' : 'Add'} Person
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Confirmation dialog
const ConfirmationDialog = ({ open, onClose, onConfirm, title, message }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary">
        Cancel
      </Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

const People = () => {
  const { hasRole } = useAuth();
  const baseURL = api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:5000';
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  // Local input to debounce search requests
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [formMode, setFormMode] = useState('add');
  const [totalCount, setTotalCount] = useState(0);
  const [companies, setCompanies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [tabValue, setTabValue] = useState('all');
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // Fetch people and related data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        // server compares query.isActive === 'true', so send string values
        ...(statusFilter !== 'all' && { isActive: statusFilter === 'active' ? 'true' : 'false' }),
        ...(companyFilter && { company: companyFilter }),
        ...(countryFilter && { country: countryFilter })
      };
      // Debug: log params so we can verify what is sent to the API
      console.debug('Fetching people with params:', params);
      
      const [peopleRes, companiesRes, countriesRes] = await Promise.all([
        peopleApi.getAll(params),
        companiesApi.getAll({ limit: 1000 }),
        countriesApi.getAll()
      ]);

      // Ensure data is always an array
      const peopleData = Array.isArray(peopleRes.data) ? peopleRes.data : [];
      const companiesData = Array.isArray(companiesRes?.data) ? companiesRes.data : [];
      const countriesData = Array.isArray(countriesRes?.data) ? countriesRes.data : [];
      
      // Apply client-side filters as a fallback in case server didn't filter correctly
      const applyClientFilters = (items) => {
        console.debug('Applying client-side filters', { companyFilter, countryFilter, searchTerm, statusFilter });
        return items.filter((p) => {
          // Normalize helper to get id string
          const normalizeId = (val) => {
            if (!val && val !== 0) return null;
            try {
              if (typeof val === 'string') return val;
              if (val._id) return String(val._id);
              return String(val);
            } catch (_) {
              return null;
            }
          };

          // statusFilter: 'all' | 'active' | 'inactive'
          if (statusFilter !== 'all') {
            const shouldBeActive = statusFilter === 'active';
            if ((p.isActive ?? true) !== shouldBeActive) return false;
          }

          if (companyFilter) {
            const compId = normalizeId(p.company);
            if (!compId || compId !== String(companyFilter)) return false;
          }

          if (countryFilter) {
            const countryId = normalizeId(p.country);
            if (!countryId || countryId !== String(countryFilter)) return false;
          }

          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            const fields = [p.firstName || '', p.lastName || '', p.email || '', p.position || '', p.jobTitle || ''];
            const matched = fields.some(f => String(f).toLowerCase().includes(q));
            if (!matched) return false;
          }

          return true;
        });
      };

      const filteredPeople = applyClientFilters(peopleData);
      console.debug('Filtered people count:', filteredPeople.length, 'server returned:', peopleData.length);

      setPeople(filteredPeople);
      // If server returned pagination total, prefer that when no client filters applied
      const countToUse = (companyFilter || countryFilter || searchTerm || statusFilter !== 'all')
        ? filteredPeople.length
        : (peopleRes.pagination?.total || peopleData.length);
      setTotalCount(countToUse);
      setCompanies(companiesData);
      setCountries(countriesData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      enqueueSnackbar('Failed to load data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Helper to fetch immediately with overrides (avoids relying on state updates order)
  const fetchDataWithOverrides = async (overrides = {}) => {
    try {
      setLoading(true);
      const params = {
        page: (overrides.page ?? page) + 1,
        limit: overrides.limit ?? rowsPerPage,
        search: overrides.search ?? searchTerm,
        ...(((overrides.statusFilter ?? statusFilter) !== 'all') && { isActive: (overrides.statusFilter ?? statusFilter) === 'active' ? 'true' : 'false' }),
        ...(overrides.company || companyFilter ? { company: overrides.company ?? companyFilter } : {}),
        ...(overrides.country || countryFilter ? { country: overrides.country ?? countryFilter } : {})
      };
      console.debug('fetchDataWithOverrides params:', params);

      const [peopleRes, companiesRes, countriesRes] = await Promise.all([
        peopleApi.getAll(params),
        companiesApi.getAll({ limit: 1000 }),
        countriesApi.getAll()
      ]);

      const peopleData = Array.isArray(peopleRes.data) ? peopleRes.data : [];
      const companiesData = Array.isArray(companiesRes?.data) ? companiesRes.data : [];
      const countriesData = Array.isArray(countriesRes?.data) ? countriesRes.data : [];

      // Apply same client-side fallback filtering but using overrides
      const effectiveStatus = overrides.statusFilter ?? statusFilter;
      const effectiveCompany = overrides.company ?? companyFilter;
      const effectiveCountry = overrides.country ?? countryFilter;
      const effectiveSearch = overrides.search ?? searchTerm;

      const normalizeId = (val) => {
        if (!val && val !== 0) return null;
        if (typeof val === 'string') return val;
        if (val && val._id) return String(val._id);
        return String(val);
      };

      const filtered = peopleData.filter((p) => {
        if (effectiveStatus !== 'all') {
          const shouldBeActive = effectiveStatus === 'active';
          if ((p.isActive ?? true) !== shouldBeActive) return false;
        }
        if (effectiveCompany) {
          const compId = normalizeId(p.company);
          if (!compId || compId !== String(effectiveCompany)) return false;
        }
        if (effectiveCountry) {
          const countryId = normalizeId(p.country);
          if (!countryId || countryId !== String(effectiveCountry)) return false;
        }
        if (effectiveSearch) {
          const q = effectiveSearch.toLowerCase();
          const fields = [p.firstName||'', p.lastName||'', p.email||'', p.position||'', p.jobTitle||''];
          if (!fields.some(f=>String(f).toLowerCase().includes(q))) return false;
        }
        return true;
      });

      setPeople(filtered);
      setTotalCount((effectiveCompany || effectiveCountry || effectiveSearch || effectiveStatus !== 'all') ? filtered.length : (peopleRes.pagination?.total || peopleData.length));
      setCompanies(companiesData);
      setCountries(countriesData);
    } catch (err) {
      console.error('Error in fetchDataWithOverrides:', err);
      enqueueSnackbar('Failed to load data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, searchTerm, statusFilter, companyFilter, countryFilter, tabValue]);

  // Debounce search input so we don't call the API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      // ensure we go back to first page when the debounced term changes
      setPage(0);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Keep statusFilter as the tab string ('all' | 'active' | 'inactive') instead of booleans
    // so the params builder can correctly map it to isActive === 'active'
    setStatusFilter(newValue);
    setPage(0);
    // Immediately fetch using the new status to avoid potential state update timing issues
    fetchDataWithOverrides({ statusFilter: newValue, page: 0 });
  };

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

  const handleCompanyFilterChange = (event) => {
    const val = event.target.value;
    console.debug('Company filter changed to:', val);
    setCompanyFilter(val);
    setPage(0);
    // Immediately fetch using the selected company
    fetchDataWithOverrides({ company: val, page: 0 });
  };

  const handleCountryFilterChange = (event) => {
    setCountryFilter(event.target.value);
    setPage(0);
    fetchDataWithOverrides({ country: event.target.value, page: 0 });
  };

  const handleOpenAddForm = () => {
    setFormMode('add');
    setSelectedPerson(null);
    setOpenForm(true);
  };

  const handleOpenEditForm = (person) => {
    setFormMode('edit');
    setSelectedPerson(person);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleSubmitPerson = async (values, photoFile) => {
    let updatedPerson = null;
    try {
      if (formMode === 'add') {
        const res = await peopleApi.create(values);
        const createdPerson = res?.data?.data || res?.data || {};
        if (photoFile) {
          try {
            updatedPerson = await peopleApi.uploadPhoto(createdPerson._id, photoFile);
            // Debug: log the result of the upload to confirm the server returned the photo/updatedAt
            // eslint-disable-next-line no-console
            console.debug('Updated person after upload (create):', updatedPerson);
            // Update local list with the updated person (optimistic update)
            setPeople(prev => {
              const exists = prev.some(p => p._id === updatedPerson._id);
              if (exists) return prev.map(p => p._id === updatedPerson._id ? updatedPerson : p);
              // Prepend so the new person is visible immediately
              return [updatedPerson, ...prev];
            });
          } catch (uploadErr) {
            console.error('Photo upload failed after create:', uploadErr);
            enqueueSnackbar('Person saved, but photo upload failed', { variant: 'warning' });
          }
        }
      } else {
        await peopleApi.update(selectedPerson._id, values);
        if (photoFile) {
          try {
            updatedPerson = await peopleApi.uploadPhoto(selectedPerson._id, photoFile);
            // Debug: log the result of the upload to confirm the server returned the photo/updatedAt
            // eslint-disable-next-line no-console
            console.debug('Updated person after upload (update):', updatedPerson);
            // Update inline so avatar updates immediately
            setPeople(prev => prev.map(p => p._id === updatedPerson._id ? updatedPerson : p));
          } catch (uploadErr) {
            console.error('Photo upload failed after update:', uploadErr);
            enqueueSnackbar('Person updated, but photo upload failed', { variant: 'warning' });
          }
        }
      }
      // Refresh list, but do not fail the overall operation if refresh throws
      try {
        await fetchData();
        // Ensure the updated person remains in the list after a server-side refresh
        if (updatedPerson) {
          setPeople(prev => {
            const exists = prev.some(p => p._id === updatedPerson._id);
            if (exists) return prev.map(p => p._id === updatedPerson._id ? updatedPerson : p);
            return [updatedPerson, ...prev];
          });
        }
      } catch (refreshErr) {
        console.error('Refresh after save failed:', refreshErr);
      }
    } catch (error) {
      console.error('Error saving person:', error);
      throw error;
    }
  };

  const handleDeleteClick = (person) => {
    setSelectedPerson(person);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await peopleApi.delete(selectedPerson._id);
      enqueueSnackbar('Person deleted successfully', { variant: 'success' });
      fetchData();
    } catch (error) {
      console.error('Error deleting person:', error);
      const message =
        error?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Failed to delete person';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setOpenDeleteDialog(false);
      setSelectedPerson(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedPerson(null);
  };

  const getCompanyName = (companyVal) => {
    const id = typeof companyVal === 'string' ? companyVal : companyVal?._id;
    const company = companies.find(c => c._id === id);
    return company ? company.name : (typeof companyVal === 'object' && companyVal?.name) || 'N/A';
  };

  const getCountryName = (countryVal) => {
    const id = typeof countryVal === 'string' ? countryVal : countryVal?._id;
    const country = countries.find(c => c._id === id);
    return country ? country.name : (typeof countryVal === 'object' && countryVal?.name) || 'N/A';
  };

  const getGenderIcon = (gender) => {
    const genderOption = GENDER_OPTIONS.find(g => g.value === gender);
    return genderOption ? genderOption.icon : <OtherGenderIcon />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderRows = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>Loading people...</Typography>
          </TableCell>
        </TableRow>
      );
    }

    if (!loading && people.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
            <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" color="textSecondary">No people found</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
              {searchTerm || companyFilter || countryFilter || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Add a new person to get started.'}
            </Typography>
            {hasRole('admin') && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddForm} sx={{ mt: 1 }}>
                Add Person
              </Button>
            )}
          </TableCell>
        </TableRow>
      );
    }

    return people.map((person) => (
      <TableRow hover key={person._id}>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AvatarWithFallback
              photo={person.photo}
              firstName={person.firstName}
              baseURL={baseURL}
              cacheBust={person.updatedAt}
              sx={{ color: 'white', width: 40, height: 40, mr: 2 }}
            />
            <Box>
              <Typography variant="subtitle2">
                {person.firstName} {person.lastName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                {getGenderIcon(person.gender)}
                <Typography 
                  variant="caption" 
                  color="textSecondary"
                  sx={{ ml: 0.5 }}
                >
                  {person.dateOfBirth && `• ${formatDate(person.dateOfBirth)}`}
                </Typography>
              </Box>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Box>
            <Typography 
              variant="body2" 
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 0.5
              }}
            >
              <EmailIcon 
                color="action" 
                fontSize="small" 
                sx={{ mr: 1 }} 
              />
              {person.email}
            </Typography>
            {person.phone && (
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <PhoneIcon 
                  color="action" 
                  fontSize="small" 
                  sx={{ mr: 1 }} 
                />
                {person.phone}
              </Typography>
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CompanyIcon 
              color="action" 
              fontSize="small" 
              sx={{ mr: 1 }} 
            />
            {getCompanyName(person.company) || (person.company?.name ? person.company.name : 'N/A')}
          </Box>
          {person.position && (
            <Typography variant="caption" color="textSecondary">
              {person.position}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Box>
            <Typography variant="body2">{person.city || 'N/A'}</Typography>
            <Typography variant="caption" color="textSecondary">{getCountryName(person.country)}</Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip 
            label={person.isActive ? 'Active' : 'Inactive'} 
            color={person.isActive ? 'success' : 'default'} 
            size="small"
            variant="outlined"
            icon={person.isActive ? 
              <CheckCircleIcon fontSize="small" /> : 
              <CancelIcon fontSize="small" />}
        />
        </TableCell>
        <TableCell align="right">
          {hasRole('admin') ? (
            <>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => handleOpenEditForm(person)} sx={{ mr: 1 }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => handleDeleteClick(person)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : null}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          People
        </Typography>
        {hasRole('admin') && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddForm}
          sx={{ minWidth: 150 }}
        >
          Add Person
        </Button>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="people tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            iconPosition="start"
            icon={<PersonIcon />} 
            label="All" 
            value="all" 
          />
          <Tab 
            iconPosition="start"
            icon={<CheckCircleIcon color="success" />} 
            label="Active" 
            value="active" 
          />
          <Tab 
            iconPosition="start"
            icon={<CancelIcon color="action" />} 
            label="Inactive" 
            value="inactive" 
          />
        </Tabs>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search people..."
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
                      <IconButton size="small" onClick={() => { setSearchInput(''); setSearchTerm(''); setPage(0); }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="company-filter-label">Company</InputLabel>
                <Select
                  labelId="company-filter-label"
                  id="company-filter"
                  value={companyFilter}
                  onChange={handleCompanyFilterChange}
                  label="Company"
                  startAdornment={
                    <InputAdornment position="start">
                      <CompanyIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>All Companies</em>
                  </MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company._id} value={company._id}>
                      {company.name}
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
                  {countries.map((country) => (
                    <MenuItem key={country._id} value={country._id}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* People Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader aria-label="people table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderRows()}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && totalCount > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
          />
        )}
      </Paper>

      {/* Person Form Dialog */}
      {hasRole('admin') && (
        <PersonForm
          open={openForm}
          handleClose={handleCloseForm}
          person={selectedPerson}
          onSubmit={handleSubmitPerson}
        />
      )}

      <ConfirmationDialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Person"
        message={`Are you sure you want to delete ${selectedPerson?.firstName} ${selectedPerson?.lastName}? This action cannot be undone.`}
      />
    </Box>

  );
};

export default People;
