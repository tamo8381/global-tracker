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
  FormControl,
  InputLabel,
  Select,
  useTheme,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Public as PublicIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import { countriesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Sample data for regions
const regions = [
  'Africa',
  'Americas',
  'Asia',
  'Europe',
  'Oceania',
  'Polar'
];

// Country form component
const CountryForm = ({ open, handleClose, country, onSubmit }) => {
  const isEdit = Boolean(country?._id);
  const { enqueueSnackbar } = useSnackbar();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: country?.name || '',
      code: country?.code || '',
      region: country?.region || '',
      population: country?.population || '',
      isActive: country?.isActive ?? true
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      code: Yup.string()
        .required('Code is required')
        .max(3, 'Code must be 2-3 characters')
        .min(2, 'Code must be at least 2 characters'),
      region: Yup.string().required('Region is required'),
      population: Yup.number()
        .typeError('Population must be a number')
        .min(0, 'Population must be a positive number')
        .nullable(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
        enqueueSnackbar(
          isEdit ? 'Country updated successfully' : 'Country added successfully',
          { variant: 'success' }
        );
        handleClose();
      } catch (error) {
        console.error('Error saving country:', error);
        const message =
          error?.message ||
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          'An error occurred while saving the country';
        enqueueSnackbar(message, { variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>
          {isEdit ? 'Edit Country' : 'Add New Country'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                name="name"
                label="Country Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                disabled={formik.isSubmitting}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="code"
                name="code"
                label="Country Code"
                value={formik.values.code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.code && Boolean(formik.errors.code)}
                helperText={formik.touched.code && formik.errors.code}
                disabled={formik.isSubmitting}
                inputProps={{
                  style: { textTransform: 'uppercase' },
                  maxLength: 3
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="region-label">Region</InputLabel>
                <Select
                  labelId="region-label"
                  id="region"
                  name="region"
                  value={formik.values.region}
                  label="Region"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.region && Boolean(formik.errors.region)}
                  disabled={formik.isSubmitting}
                >
                  {regions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                fullWidth
                id="population"
                name="population"
                label="Population"
                type="number"
                value={formik.values.population}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.population && Boolean(formik.errors.population)}
                helperText={formik.touched.population && formik.errors.population}
                disabled={formik.isSubmitting}
                InputLabelProps={{
                  shrink: true,
                }}
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
            {isEdit ? 'Update' : 'Add'} Country
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

const Countries = () => {
  const { hasRole } = useAuth();
  const [countries, setCountries] = useState([]);
  const skipNextFetch = useRef(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Local input state to debounce search
  const [regionFilter, setRegionFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [totalCount, setTotalCount] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // Fetch countries from API
  const fetchCountries = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        ...(regionFilter && { region: regionFilter })
      };
      
      const response = await countriesApi.getAll(params);
      const data = Array.isArray(response.data) ? response.data : [];
      // Client-side fallback filtering (search + region)
      const effectiveRegion = regionFilter;
      const effectiveSearch = searchTerm;
      const filtered = data.filter(c => {
        if (effectiveRegion && String(c.region || '') !== String(effectiveRegion)) return false;
        if (effectiveSearch) {
          const q = effectiveSearch.toLowerCase();
          if (!((c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q))) return false;
        }
        return true;
      });

      setCountries(filtered);
      setTotalCount((effectiveRegion || effectiveSearch) ? filtered.length : (response.pagination?.total || data.length));
    } catch (error) {
      console.error('Error fetching countries:', error);
      enqueueSnackbar('Failed to load countries', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    fetchCountries();
  }, [page, rowsPerPage, searchTerm, regionFilter]);

  // Helper to fetch immediately with overrides (avoids relying on state updates order)
  const fetchCountriesWithOverrides = async (overrides = {}) => {
    try {
      setLoading(true);
      const params = {
        page: (overrides.page ?? page) + 1,
        limit: overrides.limit ?? rowsPerPage,
        search: overrides.search ?? searchTerm,
        ...((overrides.regionFilter ?? regionFilter) ? { region: overrides.regionFilter ?? regionFilter } : {})
      };
      console.debug('fetchCountriesWithOverrides params:', params);

      const response = await countriesApi.getAll(params);
      const data = Array.isArray(response.data) ? response.data : [];
      // Client-side fallback filtering
      const effectiveRegion = overrides.regionFilter ?? regionFilter;
      const effectiveSearch = overrides.search ?? searchTerm;
      const filtered = data.filter(c => {
        if (effectiveRegion && String(c.region || '') !== String(effectiveRegion)) return false;
        if (effectiveSearch) {
          const q = effectiveSearch.toLowerCase();
          if (!((c.name||'').toLowerCase().includes(q) || (c.code||'').toLowerCase().includes(q))) return false;
        }
        return true;
      });

      setCountries(filtered);
      setTotalCount((effectiveRegion || effectiveSearch) ? filtered.length : (response.pagination?.total || data.length));
    } catch (err) {
      console.error('Error in fetchCountriesWithOverrides:', err);
      enqueueSnackbar('Failed to load countries', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(0);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

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

  const handleRegionFilterChange = (event) => {
    const val = event.target.value;
    skipNextFetch.current = true;
    setRegionFilter(val);
    setPage(0);
    fetchCountriesWithOverrides({ regionFilter: val, page: 0 });
  };

  const handleOpenAddForm = () => {
    setFormMode('add');
    setSelectedCountry(null);
    setOpenForm(true);
  };

  const handleOpenEditForm = (country) => {
    setFormMode('edit');
    setSelectedCountry(country);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleSubmitCountry = async (values) => {
    // Sanitize payload
    const payload = {
      name: (values.name || '').trim(),
      code: (values.code || '').trim().toUpperCase(),
      region: values.region || '',
      population:
        values.population === '' || values.population === null || typeof values.population === 'undefined'
          ? undefined
          : Number(values.population),
      isActive: values.isActive ?? true,
    };

    if (formMode === 'add') {
      await countriesApi.create(payload);
    } else {
      await countriesApi.update(selectedCountry._id, payload);
    }
    fetchCountries();
  };

  const handleDeleteClick = (country) => {
    setSelectedCountry(country);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await countriesApi.delete(selectedCountry._id);
      enqueueSnackbar('Country deleted successfully', { variant: 'success' });
      fetchCountries();
    } catch (error) {
      console.error('Error deleting country:', error);
      const message =
        error?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Failed to delete country';

      // If deletion is blocked due to associations, offer force delete
      if (message.startsWith('Cannot delete country with')) {
        const confirmForce = window.confirm(
          `${message}.\n\nDo you want to force delete this country and remove all associated companies and people? This cannot be undone.`
        );
        if (confirmForce) {
          try {
            const res = await countriesApi.delete(selectedCountry._id, { force: true });
            const deletedCompanies = res?.data?.meta?.companiesDeleted ?? 0;
            const deletedPeople = res?.data?.meta?.peopleDeleted ?? 0;
            enqueueSnackbar(
              `Country and associated data deleted (companies: ${deletedCompanies}, people: ${deletedPeople}).`,
              { variant: 'success' }
            );
            fetchCountries();
          } catch (forceErr) {
            const forceMsg =
              forceErr?.message ||
              forceErr?.response?.data?.message ||
              forceErr?.response?.data?.error ||
              'Force delete failed';
            enqueueSnackbar(forceMsg, { variant: 'error' });
          }
        } else {
          // User declined force delete; show the original message
          enqueueSnackbar(message, { variant: 'error' });
        }
      } else {
        enqueueSnackbar(message, { variant: 'error' });
      }
    } finally {
      setOpenDeleteDialog(false);
      setSelectedCountry(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedCountry(null);
  };

  // Format population number with commas
  const formatPopulation = (num) => {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'N/A';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Countries
        </Typography>
        {hasRole('admin') && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddForm}
          sx={{ minWidth: 150 }}
        >
          Add Country
        </Button>
        )}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search countries..."
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
                <InputLabel id="region-filter-label">Filter by Region</InputLabel>
                <Select
                  labelId="region-filter-label"
                  id="region-filter"
                  value={regionFilter}
                  onChange={handleRegionFilterChange}
                  label="Filter by Region"
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>All Regions</em>
                  </MenuItem>
                  {regions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setSearchTerm('');
                  setRegionFilter('');
                }}
                disabled={!searchTerm && !regionFilter}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Countries Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader aria-label="countries table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Region</TableCell>
                <TableCell align="right">Population</TableCell>
                <TableCell align="right">Companies</TableCell>
                <TableCell align="right">People</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>Loading countries...</Typography>
                  </TableCell>
                </TableRow>
              ) : countries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <PublicIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" color="textSecondary">
                      No countries found
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
                      {searchTerm || regionFilter 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Add a new country to get started.'}
                    </Typography>
                    {hasRole('admin') && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenAddForm}
                      sx={{ mt: 1 }}
                    >
                      Add Country
                    </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                countries.map((country) => (
                  <TableRow hover key={country._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FlagIcon 
                          sx={{ 
                            mr: 1.5, 
                            color: 'text.secondary',
                            fontSize: '1.2rem'
                          }} 
                        />
                        <Typography variant="body2">
                          {country.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={country.code} 
                        size="small" 
                        variant="outlined"
                        sx={{ textTransform: 'uppercase' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={country.region || 'N/A'} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatPopulation(country.population)}
                    </TableCell>
                    <TableCell align="right">
                      {typeof country.companyCount === 'number' ? country.companyCount : 0}
                    </TableCell>
                    <TableCell align="right">
                      {typeof country.personCount === 'number' ? country.personCount : 0}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={country.isActive ? 'Active' : 'Inactive'} 
                        color={country.isActive ? 'success' : 'default'} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {hasRole('admin') ? (
                        <>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenEditForm(country)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(country)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        </>
                      ) : (
                        <></>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {!loading && countries.length > 0 && (
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

      {/* Country Form Dialog */}
      <CountryForm
        open={openForm}
        handleClose={handleCloseForm}
        country={selectedCountry}
        onSubmit={handleSubmitCountry}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Country"
        message={`Are you sure you want to delete ${selectedCountry?.name}? This action cannot be undone.`}
      />
    </Box>
  );
};

export default Countries;
