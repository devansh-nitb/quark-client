import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

const PrivateRoute = ({ allowedRoles }) => {
  const { user, token, loading, role } = useContext(AuthContext);

  if (loading) {
    // Show a loading spinner while authentication state is being determined
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading authentication...</Typography>
      </Box>
    );
  }

  // Check if user is authenticated (has a token)
  if (!token || !user) {
    // If not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // Check if the user's role is allowed for this route
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If authenticated but not authorized, redirect to a default dashboard or an access denied page
    console.warn(`User ${user.username} with role ${role} tried to access a restricted route.`);
    // A more user-friendly redirect might be to their own dashboard
    return <Navigate to={`/${role}-dashboard`} replace />;
  }

  // If authenticated and authorized, render the child routes/components
  return <Outlet />;
};

export default PrivateRoute;