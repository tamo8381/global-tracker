import { createTheme } from '@mui/material/styles';

const defaultPalette = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#fff',
  },
  secondary: {
    main: '#9c27b0',
    light: '#ba68c8',
    dark: '#7b1fa2',
    contrastText: '#fff',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#fff',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
    contrastText: '#fff',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
    contrastText: '#fff',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#fff',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
};

const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
  h1: { fontSize: '2.5rem', fontWeight: 500, lineHeight: 1.2 },
  h2: { fontSize: '2rem', fontWeight: 500, lineHeight: 1.2 },
  h3: { fontSize: '1.75rem', fontWeight: 500, lineHeight: 1.2 },
  h4: { fontSize: '1.5rem', fontWeight: 500, lineHeight: 1.2 },
  h5: { fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.2 },
  h6: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.2 },
  subtitle1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
  subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.57 },
  body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
  body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.43 },
  button: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.75, textTransform: 'none' },
  caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.66 },
  overline: { fontSize: '0.75rem', fontWeight: 500, lineHeight: 2.66, textTransform: 'uppercase' },
};

const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    },
  },
};

const buildTheme = ({ mode = 'light', primaryColor = defaultPalette.primary.main, secondaryColor = defaultPalette.secondary.main } = {}) => {
  const palette = {
    ...defaultPalette,
    mode,
    primary: { ...defaultPalette.primary, main: primaryColor },
    secondary: { ...defaultPalette.secondary, main: secondaryColor },
    background: {
      ...defaultPalette.background,
      default: mode === 'dark' ? '#0f172a' : defaultPalette.background.default,
      paper: mode === 'dark' ? '#1e293b' : defaultPalette.background.paper,
    },
    text: {
      ...defaultPalette.text,
      primary: mode === 'dark' ? '#e2e8f0' : defaultPalette.text.primary,
      secondary: mode === 'dark' ? '#cbd5e1' : defaultPalette.text.secondary,
    },
  };

  return createTheme({
    palette,
    typography,
    shape: { borderRadius: 8 },
    components,
  });
};

export default buildTheme;
