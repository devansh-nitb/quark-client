// frontend/src/index.js
// The entry point of the React application. Renders the App component.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CssBaseline } from '@mui/material'; // Material-UI CSS reset
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles'; // For consistent theming and responsive fonts

// Define a sophisticated, professional color palette
const palette = {
  primary: {
    main: '#2C3E50', // Dark Charcoal Blue - primary for branding/main elements
    light: '#4A6178',
    dark: '#1C2833',
    contrastText: '#F0F4F8', // Light text for dark backgrounds
  },
  secondary: {
    main: '#3498DB', // Muted Sky Blue - for accents, buttons
    light: '#5DADE2',
    dark: '#21618C',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#E74C3C', // Professional Red for errors
  },
  warning: {
    main: '#F39C12', // Professional Orange for warnings
  },
  info: {
    main: '#3498DB', // Reusing secondary blue for info
  },
  success: {
    main: '#2ECC71', // Professional Green for success
  },
  text: {
    primary: '#2C3E50', // Dark text for light backgrounds
    secondary: '#7F8C8D', // Muted grey for secondary text
  },
  background: {
    default: '#ECF0F1', // Light grey/off-white for main background
    paper: '#FFFFFF', // Clean white for cards/panels
  },
  action: {
    hover: 'rgba(0, 0, 0, 0.04)', // Subtle hover effect
    selected: 'rgba(0, 0, 0, 0.08)',
  },
};

// Create a custom Material-UI theme
let theme = createTheme({
  palette: palette,
  typography: {
    // Primary font for most text (Inter)
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    // Secondary font for headings (Poppins) - UPDATED
    h1: { fontFamily: 'Poppins, sans-serif', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontFamily: 'Poppins, sans-serif', fontWeight: 700, lineHeight: 1.2 },
    h3: { fontFamily: 'Poppins, sans-serif', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontFamily: 'Poppins, sans-serif', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontFamily: 'Poppins, sans-serif', fontWeight: 500, lineHeight: 1.5 },
    h6: { fontFamily: 'Poppins, sans-serif', fontWeight: 500, lineHeight: 1.6 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 400 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 }, // No uppercase for buttons by default
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Glassmorphism effect for AppBar
          backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
          backdropFilter: 'blur(10px) saturate(180%)', // Frosted glass effect
          WebkitBackdropFilter: 'blur(10px) saturate(180%)', // For Safari
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', // Subtle shadow
          borderRadius: '0 0 16px 16px', // Rounded bottom corners
          padding: '8px 24px', // Add some padding
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)', // Subtle border
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '64px', // Ensure consistent height
          '@media (min-width:600px)': {
            minHeight: '64px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Rounded corners
          padding: '8px 16px',
          transition: 'all 0.3s ease-in-out', // Smooth transition for hover effects
          '&:hover': {
            transform: 'translateY(-2px)', // Subtle lift on hover
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Add shadow on hover
          },
        },
        containedPrimary: {
          background: `linear-gradient(45deg, ${palette.primary.main} 30%, ${palette.primary.light} 90%)`,
          boxShadow: '0 3px 5px 2px rgba(44, 62, 80, .3)',
          '&:hover': {
            background: `linear-gradient(45deg, ${palette.primary.dark} 30%, ${palette.primary.main} 90%)`,
            boxShadow: '0 5px 10px 3px rgba(44, 62, 80, .4)',
          },
        },
        outlinedPrimary: {
          color: palette.primary.main,
          borderColor: palette.primary.main,
          '&:hover': {
            backgroundColor: palette.primary.light,
            color: palette.primary.contrastText,
            borderColor: palette.primary.light,
          },
        },
        text: {
          color: palette.text.primary,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            color: palette.secondary.main,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12, // More rounded corners for cards/panels
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', // Softer, professional shadow
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8, // Rounded corners for input fields
            '& fieldset': {
              borderColor: palette.text.secondary, // Muted border color
            },
            '&:hover fieldset': {
              borderColor: palette.primary.light, // Highlight on hover
            },
            '&.Mui-focused fieldset': {
              borderColor: palette.primary.main, // Primary color on focus
            },
          },
          '& .MuiInputLabel-root': {
            color: palette.text.secondary, // Muted label color
            '&.Mui-focused': {
              color: palette.primary.main, // Primary color on focus
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.text.secondary,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.primary.light,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.primary.main,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.primary.dark,
          color: palette.primary.contrastText,
          fontSize: '0.8rem',
          padding: '8px 12px',
          borderRadius: 6,
        },
      },
    },
    MuiDialog: { // Added for professional dialogs
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
        },
      },
    },
  },
});

// Make font sizes responsive
theme = responsiveFontSizes(theme);

// Inject Google Fonts for Inter and Poppins - UPDATED
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Apply Material-UI theme and CSS baseline for consistent styling */}
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* AuthProvider makes authentication state available throughout the app */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);