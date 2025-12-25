import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Paper, Avatar, TextField, Button, Grid } from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../services/api';
import AvatarWithFallback from '../components/AvatarWithFallback';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      enqueueSnackbar('New passwords do not match', { variant: 'warning' });
      return;
    }
    if (String(passwordData.newPassword).length < 8) {
      enqueueSnackbar('New password must be at least 8 characters', { variant: 'warning' });
      return;
    }
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmNewPassword
      });
      enqueueSnackbar('Password changed successfully', { variant: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to change password';
      enqueueSnackbar(msg, { variant: 'error' });
      console.error(err);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const userId = user?.id || user?._id;
    if (!userId) {
      enqueueSnackbar('Unable to upload photo: missing user id', { variant: 'error' });
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', file);

    // Client-side validation (quick feedback)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    const maxSize = Number(process.env.REACT_APP_MAX_FILE_UPLOAD) || 2 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      enqueueSnackbar('Please upload a PNG, JPG, GIF or WEBP image', { variant: 'error' });
      return;
    }

    if (file.size > maxSize) {
      enqueueSnackbar(`Please upload an image smaller than ${maxSize} bytes`, { variant: 'error' });
      return;
    }

    try {
      // Let the browser set Content-Type including boundary for multipart/form-data
      const res = await api.put(`/auth/${userId}/photo`, uploadData);
      updateUser({ ...user, photo: res.data.data });
      enqueueSnackbar('Photo updated successfully', { variant: 'success' });
    } catch (error) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || 'Failed to upload photo';
      enqueueSnackbar(msg, { variant: 'error' });
      console.error('Photo upload error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/updatedetails', formData);
      updateUser(res.data.data);
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to update profile', { variant: 'error' });
      console.error(error);
    }
  };

  if (!user) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, margin: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AvatarWithFallback
          photo={user.photo}
          firstName={user.firstName}
          baseURL={api.defaults.baseURL?.replace('/api/v1', '')}
          sx={{ width: 100, height: 100, mr: 3 }}
        />
        <Button variant="contained" component="label">
          Upload Photo
          <input type="file" hidden onChange={handlePhotoUpload} />
        </Button>
      </Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile Information
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Update your personal information.
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary">
              Save Changes
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 3 }}>Change Password</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirmNewPassword"
              type="password"
              value={passwordData.confirmNewPassword}
              onChange={handlePasswordChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="outlined" color="primary" onClick={handleChangePassword} sx={{ mt: 1 }}>
              Change Password
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default Profile;
