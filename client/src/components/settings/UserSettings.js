import React, { useState, useEffect } from 'react';
import { 
  Box, 
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
  FormHelperText,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import usersApi from '../../services/usersApi';
import { useSnackbar } from 'notistack';

const UserForm = ({ open, handleClose, user, onSubmit }) => {
  const isEdit = Boolean(user?._id);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      role: user?.role || 'user',
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required('First name is required'),
      lastName: Yup.string().required('Last name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      role: Yup.string().required('Role is required'),
    }),
    onSubmit: async (values) => {
      try {
        await onSubmit(values);
        handleClose();
      } catch (err) {
        // Keep the form open so the user can fix the issue; parent shows an error snackbar
        console.error('Submit failed, keeping dialog open', err);
      }
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
                  <MenuItem value="user">Editor</MenuItem>
                  <MenuItem value="user">Viewer</MenuItem>
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
            {isEdit ? 'Save Changes' : 'Add User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const ConfirmationDialog = ({ open, onClose, onConfirm, title, message }) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
        {message}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

const UserSettings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formMode, setFormMode] = useState('add');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await usersApi.getAll();
        setUsers(res.data.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

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
        enqueueSnackbar('User added', { variant: 'success' });
      } else {
        const res = await usersApi.update(selectedUser._id, values);
        setUsers(users.map(user => user._id === selectedUser._id ? res.data.data : user));
        enqueueSnackbar('User updated', { variant: 'success' });
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Error saving user';
      enqueueSnackbar(msg, { variant: 'error' });
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
      setUsers(users.filter(user => user._id !== selectedUser._id));
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Error deleting user';
      enqueueSnackbar(msg, { variant: 'error' });
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
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenAddForm}
          >
            Add User
          </Button>
        }
      />
      <Divider />
      <CardContent>
        <List>
          {users.map(user => (
            <ListItem key={user._id} secondaryAction={
              <Box>
                <IconButton onClick={() => handleOpenEditForm(user)}><EditIcon /></IconButton>
                <IconButton onClick={() => handleDeleteClick(user)}><DeleteIcon /></IconButton>
              </Box>
            }>
              <ListItemAvatar>
                <Avatar>{user.firstName.charAt(0)}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={`${user.firstName} ${user.lastName}`} secondary={`${user.email} - ${user.role}`} />
            </ListItem>
          ))}
        </List>
      </CardContent>
      <UserForm 
        open={openForm} 
        handleClose={handleCloseForm} 
        user={selectedUser} 
        onSubmit={handleSubmitUser} 
      />
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

export default UserSettings;
