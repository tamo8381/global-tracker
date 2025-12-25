import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../services/api';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Badge, 
  Avatar, 
  Menu, 
  MenuItem, 
  Divider, 
  ListItemIcon, 
  Tooltip 
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Notifications as NotificationsIcon, 
  Settings, 
  Logout 
} from '@mui/icons-material';

const Navbar = ({ onDrawerToggle }) => {
  const navigate = useNavigate();
  const { logout, user, hasRole } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const notificationsOpen = Boolean(notifAnchor);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Fetch notifications (recent activities) for admins only
  useEffect(() => {
    let mounted = true;
    const fetchNotifications = async () => {
      try {
        // Only admins see notifications
        if (!user || !hasRole('admin')) {
          if (mounted) setNotifications([]);
          return;
        }

        const resp = await dashboardApi.getActivities({ limit: 20 });
        const activities = resp?.data?.data || [];

        if (mounted) {
          // Map activities to a lightweight notification shape
          const notifs = activities.map(a => ({
            title: `${a.type?.toUpperCase()}: ${a.details}`,
            time: a.timestamp,
            raw: a
          }));
          setNotifications(notifs);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        if (mounted) setNotifications([]);
      }
    };

    fetchNotifications();

    return () => { mounted = false; };
  }, [user, hasRole]);

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Global Tracker
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Notifications">
            <IconButton 
              color="inherit"
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              disabled={!user || !hasRole('admin')}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32 }}>A</Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <Avatar /> Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={notifAnchor}
        open={notificationsOpen}
        onClose={() => setNotifAnchor(null)}
        PaperProps={{
          sx: {
            minWidth: 260,
            p: 1,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {!user || !hasRole('admin') ? (
          <MenuItem disabled>Notifications available for admins only</MenuItem>
        ) : notifications.length === 0 ? (
          <MenuItem disabled>No notifications yet</MenuItem>
        ) : (
          notifications.map((notif, idx) => (
            <MenuItem key={idx} onClick={() => setNotifAnchor(null)}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2">{notif.title}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(notif.time).toLocaleString()}</Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </AppBar>
  );
};

export default Navbar;
