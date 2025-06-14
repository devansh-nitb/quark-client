// frontend/src/App.js
// The main application component, handling routing and layout.

import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute'; // A component to protect routes
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import TeacherDashboard from './components/Dashboard/TeacherDashboard';
import StudentDashboard from './components/Dashboard/StudentDashboard';
import UploadPaper from './components/Paper/UploadPaper';
import ViewPaper from './components/Paper/ViewPaper';
import NotFound from './components/common/NotFound'; // A simple 404 page
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School'; // A simple SVG icon for the logo

function App() {
  const { user, logout } = useContext(AuthContext);

  // Helper function for navigation (using regular anchors for simplicity as per instructions)
  const navigateTo = (path) => {
    window.location.href = path; // Simple full page reload/navigation
  };

  // Log to confirm App component is rendering
  console.log('App.js: App component rendered. Current user:', user ? user.username : 'Guest');

  return (
    <BrowserRouter>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
        <AppBar position="static">
          <Toolbar sx={{ justifyContent: 'space-between', paddingX: { xs: 2, md: 4 } }}>
            {/* Logo and Title */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SchoolIcon sx={{ mr: 1, color: 'primary.main', fontSize: '2rem' }} />
              <Typography
                variant="h6"
                component="div"
                sx={{
                  flexGrow: 1,
                  fontWeight: 'bold',
                  color: 'primary.dark',
                  fontFamily: 'Poppins, sans-serif', // Changed to Poppins
                  fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
                }}
              >
                Secure QPS
              </Typography>
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {user ? (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      mr: { xs: 1, md: 3 },
                      color: 'text.secondary',
                      display: { xs: 'none', sm: 'block' }, // Hide welcome message on very small screens
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Welcome, <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{user.username}</Box> ({user.role})
                  </Typography>
                  <Tooltip title="Go to Home/Dashboard">
                    <Button
                      color="inherit"
                      onClick={() => navigateTo('/')}
                      sx={{
                        color: 'primary.dark',
                        fontWeight: 600, // Ensure font weight
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          color: 'secondary.main', // Highlight on hover
                          transform: 'translateY(-1px)', // Slight lift
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        }
                      }}
                    >
                      Home
                    </Button>
                  </Tooltip>
                  <Tooltip title="Log out of your account">
                    <Button
                      color="inherit"
                      onClick={logout}
                      sx={{
                        color: 'error.main',
                        fontWeight: 600, // Ensure font weight
                        ml: 1, // Margin from Home button
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          color: 'error.dark', // Deeper red on hover
                          transform: 'translateY(-1px)', // Slight lift
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        }
                      }}
                    >
                      Logout
                    </Button>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Tooltip title="Log in to your account">
                    <Button
                      color="inherit"
                      onClick={() => navigateTo('/login')}
                      sx={{
                        color: 'primary.dark',
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          color: 'secondary.main',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        }
                      }}
                    >
                      Login
                    </Button>
                  </Tooltip>
                  <Tooltip title="Create a new account">
                    <Button
                      color="inherit"
                      onClick={() => navigateTo('/register')}
                      sx={{
                        color: 'primary.dark',
                        fontWeight: 600,
                        ml: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          color: 'secondary.main',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        }
                      }}
                    >
                      Register
                    </Button>
                  </Tooltip>
                </>
              )}
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: { xs: 2, md: 3 } }}> {/* Responsive padding for main content */}
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

            {/* Protected Routes based on roles */}
            <Route path="/" element={<PrivateRoute allowedRoles={['admin', 'teacher', 'student']} />}>
              {user && user.role === 'admin' && <Route index element={<AdminDashboard />} />}
              {user && user.role === 'teacher' && <Route index element={<TeacherDashboard />} />}
              {user && user.role === 'student' && <Route index element={<StudentDashboard />} />}
              {/* Fallback for home if user is logged in but role doesn't match a direct dashboard */}
              {user && <Route index element={<Navigate to={`/${user.role}-dashboard`} />} />}
            </Route>

            {/* Specific dashboard routes, primarily for direct navigation after login */}
            <Route path="/admin-dashboard" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
            <Route path="/teacher-dashboard" element={<PrivateRoute allowedRoles={['teacher']}><TeacherDashboard /></PrivateRoute>} />
            <Route path="/student-dashboard" element={<PrivateRoute allowedRoles={['student']}><StudentDashboard /></PrivateRoute>} />

            {/* Paper Management Routes */}
            <Route path="/upload-paper" element={
              
              
              <UploadPaper/>
             } />
            <Route path="/view-paper/:paperId" element={<ViewPaper />} />

            {/* Redirect root to appropriate dashboard if logged in, otherwise to login */}
            <Route path="/" element={user ? <Navigate to={`/${user.role}-dashboard`} /> : <Navigate to="/login" />} />

            {/* Catch-all for undefined routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;