import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardHeader, 
  CardContent, 
  Divider, 
  Button, 
  FormControl, 
  FormControlLabel, 
  Radio, 
  RadioGroup,
  Tooltip,
  Paper,
  useTheme
} from '@mui/material';
import { 
  Check as CheckIcon
} from '@mui/icons-material';

const GeneralSettings = () => {
  const theme = useTheme();
  const [mode, setMode] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#1976d2');
  const [secondaryColor, setSecondaryColor] = useState('#9c27b0');
  
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
                <FormControlLabel value="light" control={<Radio />} label="Light" />
                <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                <FormControlLabel value="system" control={<Radio />} label="System Default" />
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
                bgcolor: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
                color: mode === 'dark' ? '#FFFFFF' : 'inherit',
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
                  bgcolor: mode === 'dark' ? '#2D2D2D' : '#F5F5F5',
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

export default GeneralSettings;
