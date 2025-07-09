import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

const PrivateRoute = ({ allowedRoles }) => {
  const { user, token, loading, role } = useContext(AuthContext);

  if (loading) {
    // loading spinner
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading authentication...</Typography>
      </Box>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    console.warn(`User ${user.username} with role ${role} tried to access a restricted route.`);
    return <Navigate to={`/${role}-dashboard`} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;