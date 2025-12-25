import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Toolbar,
  Box,
  Typography,
  Collapse
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Public as CountriesIcon, 
  Business as CompaniesIcon, 
  People as PeopleIcon, 
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';

const menuItems = [
  { 
    text: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/',
    children: []
  },
  { 
    text: 'Countries', 
    icon: <CountriesIcon />, 
    path: '/countries',
    children: []
  },
  { 
    text: 'Companies', 
    icon: <CompaniesIcon />, 
    path: '/companies',
    children: []
  },
  { 
    text: 'People', 
    icon: <PeopleIcon />, 
    path: '/people',
    children: []
  },
  { 
    text: 'Settings', 
    icon: <SettingsIcon />, 
    path: '/settings',
    children: [
      { text: 'General', path: '/settings/general' },
      { text: 'Users', path: '/settings/users' },
    ]
  },
];

const Sidebar = ({ mobileOpen, onDrawerToggle, drawerWidth }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = React.useState({});

  const handleSubmenuClick = (text) => {
    setOpenSubmenu(prev => ({
      ...prev,
      [text]: !prev[text]
    }));
  };

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            Global Tracker
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem 
              disablePadding 
              onClick={() => {
                if (item.children && item.children.length > 0) {
                  handleSubmenuClick(item.text);
                } else {
                  navigate(item.path);
                }
              }}
            >
              <ListItemButton 
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.contrastText' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
                {item.children && item.children.length > 0 && (
                  openSubmenu[item.text] ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>
            
            {item.children && item.children.length > 0 && (
              <Collapse in={openSubmenu[item.text]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItemButton 
                      key={child.text} 
                      sx={{ pl: 4 }}
                      selected={location.pathname === child.path}
                      onClick={() => navigate(child.path)}
                    >
                      <ListItemText primary={child.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: 'none',
            boxShadow: '1px 0px 4px rgba(0, 0, 0, 0.1)'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
