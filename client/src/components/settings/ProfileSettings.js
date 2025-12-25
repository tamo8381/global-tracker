import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardHeader, 
  CardContent, 
  Divider, 
  TextField, 
  Button, 
  Avatar,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import AvatarWithFallback from '../AvatarWithFallback';

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
        await new Promise(resolve => setTimeout(resolve, 1000));
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
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {user?.jobTitle || 'No job title provided'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              {user?.email}
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

export default ProfileSettings;
