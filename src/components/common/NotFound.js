// A simple 404 Not Found page.

import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const NotFound = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '80vh',
        textAlign: 'center',
      }}
    >
      <Typography variant="h1" component="h2" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'primary.main' }}>
        404
      </Typography>
      <Typography variant="h4" component="h1" sx={{ mt: 2, mb: 3 }}>
        Page Not Found
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        The page you are looking for does not exist.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => window.history.back()}>
        Go Back
      </Button>
    </Box>
  );
};

export default NotFound;