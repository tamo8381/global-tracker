import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardHeader, 
  CardContent, 
  Divider, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  FormHelperText,
  Tabs,
  Tab,
  useTheme,
  Avatar,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Radio,
  RadioGroup,
  Tooltip
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Email as EmailIcon, 
  Palette as ThemeIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import usersApi from '../services/usersApi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeSettings } from '../contexts/ThemeSettingsContext';
import api from '../services/api';
import AvatarWithFallback from '../components/AvatarWithFallback';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Tab Props
function a11yProps(index) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const tabConfig = [
  { label: 'Profile', icon: <PersonIcon />, path: '/settings/profile' },
  { label: 'General', icon: <ThemeIcon />, path: '/settings/general' },
  { label: 'Users', icon: <GroupIcon />, path: '/settings/users' },
];

// Profile Settings Component
const ProfileSettings = ({ user }) => {
  const { user: authUser } = useAuth();
  const effectiveUser = user || authUser;
  const baseURL = api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:5000';
   const [isEditing, setIsEditing] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      jobTitle: user?.jobTitle || '',
      bio: user?.bio || ''
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required('First name is required'),
      lastName: Yup.string().required('Last name is required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      phone: Yup.string(),
      jobTitle: Yup.string(),
      bio: Yup.string().max(500, 'Bio must be 500 characters or less')
    }),
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real app, you would update the user profile via an API call
        // await userApi.updateProfile(values);
        
        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success'
        });
        
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating profile:', error);
        setSnackbar({
          open: true,
          message: 'Failed to update profile. Please try again.',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleCancel = () => {
    formik.resetForm();
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader 
        title="Profile Information" 
        subheader="Update your personal information"
        action={
          !isEditing ? (
            <Button 
              variant="outlined" 
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <Box>
              <Button 
                variant="outlined" 
                color="inherit"
                onClick={handleCancel}
                sx={{ mr: 1 }}
                startIcon={<CloseIcon />}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={formik.handleSubmit}
                disabled={!formik.isValid || isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                Save Changes
              </Button>
            </Box>
          )
        }
      />
      <Divider />
      <CardContent>
        <Box sx={{ display: 'flex', mb: 4 }}>
          <Box sx={{ mr: 3 }}>
            <AvatarWithFallback
              photo={effectiveUser?.photo}
              firstName={effectiveUser?.firstName}
              baseURL={baseURL}
              sx={{ width: 100, height: 100, fontSize: '2.5rem', bgcolor: 'primary.main' }}
            />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">
              {effectiveUser?.firstName} {effectiveUser?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {effectiveUser?.jobTitle || 'No job title provided'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              {effectiveUser?.email}
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => setIsEditing(true)}
            >
              Change Photo
            </Button>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.firstName && Boolean(formik.errors.firstName)}
              helperText={formik.touched.firstName && formik.errors.firstName}
              disabled={!isEditing || isLoading}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.lastName && Boolean(formik.errors.lastName)}
              helperText={formik.touched.lastName && formik.errors.lastName}
              disabled={!isEditing || isLoading}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={!isEditing || isLoading}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <CheckIcon color="success" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
              disabled={!isEditing || isLoading}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Job Title"
              name="jobTitle"
              value={formik.values.jobTitle}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.jobTitle && Boolean(formik.errors.jobTitle)}
              helperText={formik.touched.jobTitle && formik.errors.jobTitle}
              disabled={!isEditing || isLoading}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bio"
              name="bio"
              value={formik.values.bio}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.bio && Boolean(formik.errors.bio)}
              helperText={`${formik.values.bio.length}/500 ${formik.touched.bio && formik.errors.bio ? `• ${formik.errors.bio}` : ''}`}
              disabled={!isEditing || isLoading}
              margin="normal"
              multiline
              rows={4}
            />
          </Grid>
        </Grid>
      </CardContent>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

const UserSettings = () => {
  const { hasRole } = useAuth();
  // Hooks must be called unconditionally
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formMode, setFormMode] = useState('add');
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    // Do not attempt to fetch users if current viewer is not admin
    if (!hasRole('admin')) {
      setLoading(false);
      return;
    }
    const fetchUsers = async () => {
      setFetchError(null);
      try {
        const res = await usersApi.getAll();
        setUsers(res.data.data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        const status = error?.response?.status;
        const message = error?.response?.data?.message || error?.message || 'Failed to load users';
        if (status === 401) {
          setFetchError('Unauthorized. Please log in again.');
        } else if (status === 403) {
          setFetchError('Access denied. You do not have permission to view users.');
        } else {
          setFetchError(message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [hasRole]);

  // Hide the entire UserSettings UI for non-admins
  if (!hasRole('admin')) return null;

  const handleOpenAddForm = () => {
    setFormMode('add');
    setSelectedUser(null);
    setOpenForm(true);
  };

  const handleOpenEditForm = (user) => {
    setFormMode('edit');
    setSelectedUser(user);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleSubmitUser = async (values) => {
    try {
      if (formMode === 'add') {
        const res = await usersApi.create(values);
        setUsers([...users, res.data.data]);
      } else {
        const res = await usersApi.update(selectedUser._id, values);
        setUsers(users.map(user => user._id === selectedUser._id ? res.data.data : user));
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await usersApi.delete(selectedUser._id);
      setUsers(users.filter(u => u._id !== selectedUser._id));
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setOpenDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedUser(null);
  };

  return (
    <Card>
      <CardHeader 
        title="User Management" 
        subheader="Manage users in the system"
        action={
          hasRole('admin') ? (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleOpenAddForm}
            >
              Add User
            </Button>
          ) : (
            <></>
          )
        }
      />
      <Divider />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <>
            {fetchError ? (
              <Box sx={{ px: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{fetchError}</Alert>
                <Button variant="outlined" onClick={() => { setLoading(true); setFetchError(null); (async () => { try { const res = await usersApi.getAll(); setUsers(res.data.data || []); } catch (err) { const status = err?.response?.status; setFetchError(status === 403 ? 'Access denied.' : err?.message || 'Failed to load users'); } finally { setLoading(false); } })(); }}>Retry</Button>
              </Box>
            ) : (
          <List>
            {users.map(user => (
               <ListItem key={user._id} secondaryAction={
                 hasRole('admin') ? (
                 <Box>
                   <IconButton onClick={() => handleDeleteClick(user)}><DeleteIcon /></IconButton>
                 </Box>
                 ) : (
                 <></>
                 )
               }>
                 <ListItemAvatar>
                   <Avatar>{user.firstName.charAt(0)}</Avatar>
                 </ListItemAvatar>
                 <ListItemText 
                   primary={`${user.firstName} ${user.lastName}`} 
                   secondary={`${user.email} - ${user.role === 'admin' ? 'Admin' : 'User'}`} 
                 />
               </ListItem>
             ))}
            {users.length === 0 && !fetchError && (
              <ListItem>
                <ListItemText primary="No users found." />
              </ListItem>
            )}
          </List>
            )}
          </>
        )}
      </CardContent>
      {hasRole('admin') && (
      <UserForm 
        open={openForm} 
        handleClose={handleCloseForm} 
        user={selectedUser} 
        onSubmit={handleSubmitUser} 
      />
      )}
      <ConfirmationDialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.firstName} ${selectedUser?.lastName}? This action cannot be undone.`}
      />
    </Card>
  );
};

const UserForm = ({ open, handleClose, user, onSubmit }) => {
  const isEdit = Boolean(user?._id);
  const passwordSchema = isEdit
    ? Yup.string().min(6, 'Password must be at least 6 characters')
    : Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required');
  const confirmPasswordSchema = isEdit
    ? Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match')
    : Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Please confirm password');

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      role: user?.role || 'user',
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required('First name is required'),
      lastName: Yup.string().required('Last name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      role: Yup.string().oneOf(['admin', 'user']).required('Role is required'),
      password: passwordSchema,
      confirmPassword: confirmPasswordSchema,
    }),
    onSubmit: (values) => {
      const payload = { ...values };
      if (!payload.password) {
        delete payload.password;
      }
      delete payload.confirmPassword;
      onSubmit(payload);
      handleClose();
    },
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={formik.touched.role && Boolean(formik.errors.role)}>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Role"
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </Select>
                {formik.touched.role && formik.errors.role && (
                  <FormHelperText>{formik.errors.role}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {isEdit ? 'Update' : 'Add'} User
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const ConfirmationDialog = ({ open, onClose, onConfirm, title, message }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

// General Settings Component
const GeneralSettings = () => {
  const theme = useTheme();
  const { mode, effectiveMode, primaryColor, secondaryColor, setMode, setPrimaryColor, setSecondaryColor } = useThemeSettings();
  
  const colorOptions = [
    { name: 'Blue', value: '#1976d2' },
    { name: 'Green', value: '#2e7d32' },
    { name: 'Orange', value: '#ed6c02' },
    { name: 'Red', value: '#d32f2f' },
    { name: 'Purple', value: '#9c27b0' },
    { name: 'Teal', value: '#00796b' },
  ];

  const handleModeChange = (event) => {
    setMode(event.target.value);
  };

  const handlePrimaryColorChange = (color) => {
    setPrimaryColor(color);
  };

  const handleSecondaryColorChange = (color) => {
    setSecondaryColor(color);
  };

  return (
    <Card>
      <CardHeader 
        title="Appearance" 
        subheader="Customize the look and feel of the application"
      />
      <Divider />
      <CardContent>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Theme Mode
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                row
                aria-label="theme-mode"
                name="theme-mode"
                value={mode}
                onChange={handleModeChange}
              >
                <FormControlLabel 
                  value="light" 
                  control={<Radio />} 
                  label="Light" 
                />
                <FormControlLabel 
                  value="dark" 
                  control={<Radio />} 
                  label="Dark" 
                />
                <FormControlLabel 
                  value="system" 
                  control={<Radio />} 
                  label="System Default" 
                />
              </RadioGroup>
            </FormControl>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Primary Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {colorOptions.map((color) => (
                  <Tooltip key={color.value} title={color.name}>
                    <Box
                      onClick={() => handlePrimaryColorChange(color.value)}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: color.value,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: primaryColor === color.value ? `3px solid ${theme.palette.primary.main}` : 'none',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    >
                      {primaryColor === color.value && <CheckIcon sx={{ color: 'white' }} />}
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </Box>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Secondary Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {colorOptions.map((color) => (
                  <Tooltip key={color.value} title={color.name}>
                    <Box
                      onClick={() => handleSecondaryColorChange(color.value)}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: color.value,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: secondaryColor === color.value ? `3px solid ${theme.palette.primary.main}` : 'none',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    >
                      {secondaryColor === color.value && <CheckIcon sx={{ color: 'white' }} />}
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: effectiveMode === 'dark' ? '#1E1E1E' : '#FFFFFF',
                color: effectiveMode === 'dark' ? '#FFFFFF' : 'inherit',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Box 
                sx={{ 
                  width: '100%',
                  maxWidth: 300,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: effectiveMode === 'dark' ? '#2D2D2D' : '#F5F5F5',
                  mt: 2
                }}
              >
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 8, 
                    bgcolor: primaryColor, 
                    mb: 2,
                    borderRadius: 4
                  }} 
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: primaryColor,
                    mb: 2
                  }}
                >
                  Primary Color
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  This is a sample text to demonstrate the theme colors.
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ 
                    bgcolor: primaryColor,
                    color: 'white',
                    mr: 1,
                    '&:hover': {
                      bgcolor: primaryColor,
                      opacity: 0.9,
                    },
                  }}
                >
                  Primary Button
                </Button>
                <Button 
                  variant="outlined" 
                  sx={{ 
                    color: primaryColor,
                    borderColor: primaryColor,
                    '&:hover': {
                      borderColor: primaryColor,
                      bgcolor: `${primaryColor}08`,
                    },
                  }}
                >
                  Secondary
                </Button>
                <Divider sx={{ my: 2 }} />
                <Box 
                  sx={{ 
                    width: '100%', 
                    height: 4, 
                    bgcolor: secondaryColor, 
                    mb: 1,
                    borderRadius: 4
                  }} 
                />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Secondary Color Accent
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                sx={{ 
                  mt: 3,
                  bgcolor: primaryColor,
                  color: 'white',
                  '&:hover': {
                    bgcolor: primaryColor,
                    opacity: 0.9,
                  },
                }}
              >
                Apply Theme
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
const Settings = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Only show the Users tab to admins
  const visibleTabs = tabConfig.filter(tab => !(tab.label === 'Users' && !hasRole('admin')));
  const initialTab = visibleTabs.findIndex((tab) => location.pathname.startsWith(tab.path));
  const [tabValue, setTabValue] = useState(initialTab === -1 ? 0 : initialTab);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    navigate(visibleTabs[newValue].path, { replace: true });
  };

  useEffect(() => {
    const nextTab = visibleTabs.findIndex((tab) => location.pathname.startsWith(tab.path));
    if (nextTab !== -1 && nextTab !== tabValue) {
      setTabValue(nextTab);
    }
  }, [location.pathname, tabValue, visibleTabs]);

  // Redirect if a non-admin tries to access the Users tab via URL
  useEffect(() => {
    if (location.pathname.startsWith('/settings/users') && !hasRole('admin')) {
      navigate('/settings', { replace: true });
    }
  }, [location.pathname, hasRole, navigate]);

   return (
     <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {visibleTabs.map((tab, index) => (
            <Tab 
              key={tab.label} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {tab.icon}
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {tab.label}
                  </Typography>
                </Box>
              } 
              {...a11yProps(index)} 
            />
          ))}
        </Tabs>
        
        {visibleTabs.map((tab, index) => (
          <TabPanel key={tab.label} value={tabValue} index={index}>
            {tab.label === 'Profile' && <ProfileSettings user={user} />}
            {tab.label === 'General' && <GeneralSettings />}
            {tab.label === 'Users' && <UserSettings />}
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
};

export default Settings;
