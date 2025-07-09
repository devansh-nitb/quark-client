import React, { useState, useEffect } from 'react';
import {
  TextField, Button, Typography, Box, Paper, CircularProgress,
  Select, MenuItem, InputLabel, FormControl, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // default role
  const [sections, setSections] = useState([]); 
  const [selectedSection, setSelectedSection] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [showReview, setShowReview] = useState(false); 
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); 

  const navigate = useNavigate();

  // fetch sections when role changes to student
  useEffect(() => {
    const fetchSections = async () => {
      try {
        // USing the public endpoint for fetching sections for registration
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/misc/sections-public`);
        const data = await response.json();
        if (response.ok) {
          setSections(data);
        } else {
          setError(data.message || 'Failed to fetch sections.');
          setSnackbarMessage(data.message || 'Failed to fetch sections.');
          setSnackbarSeverity('error');
          setOpenSnackbar(true);
        }
      } catch (err) {
        console.error('Error fetching sections:', err);
        setError('Network error while fetching sections.');
        setSnackbarMessage('Network error while fetching sections.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    };

    if (role === 'student') {
      fetchSections();
    } else {
      setSelectedSection(''); 
    }
  }, [role]);

  const handleNextOrReview = (e) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (role === 'student' && !selectedSection) {
      setError('Please select a section for student registration.');
      return;
    }

    setShowReview(true); 
  };

  const handleConfirmRegistration = async () => {
    setLoading(true);
    setOpenConfirmDialog(false); 
    setError('');
    setOpenSnackbar(false);

    try {
      const payload = {
        username,
        email,
        password,
        role,
      };
      if (role === 'student') {
        payload.sectionId = selectedSection; 
      }

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage('Registration successful! You can now log in.');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
        setSnackbarMessage(data.message || 'Registration failed.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please try again later.');
      setSnackbarMessage('Network error. Please try again later.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)' }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 3, width: '100%', maxWidth: 450 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Register
        </Typography>
        {!showReview ? (
          // registration form code
          <form onSubmit={handleNextOrReview}>
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              variant="outlined"
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="outlined"
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="outlined"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-select-label">Register As</InputLabel>
              <Select
                labelId="role-select-label"
                id="role-select"
                value={role}
                label="Register As"
                onChange={(e) => setRole(e.target.value)}
                required
                variant="outlined"
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>

              </Select>
            </FormControl>

            {role === 'student' && (
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="section-select-label">Select Section</InputLabel>
                <Select
                  labelId="section-select-label"
                  id="section-select"
                  value={selectedSection}
                  label="Select Section"
                  onChange={(e) => setSelectedSection(e.target.value)}
                  variant="outlined"
                >
                  <MenuItem value="">
                    <em>Loading Sections...</em>
                  </MenuItem>
                  {sections.map((section) => (
                    <MenuItem key={section._id} value={section._id}>
                      {section.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3, py: 1.5 }}
              disabled={loading}
            >
              Review Details
            </Button>
          </form>
        ) : (
          // Review area
          <Box>
            <Typography variant="h5" align="center" gutterBottom sx={{ mt: 2, mb: 3, color: 'secondary.main' }}>
              Review Your Registration
            </Typography>
            <List sx={{ width: '100%' }}>
              <ListItem>
                <ListItemText primary="Username" secondary={username} />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText primary="Email" secondary={email} />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemText primary="Role" secondary={role.charAt(0).toUpperCase() + role.slice(1)} />
              </ListItem>
              {role === 'student' && (
                <>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText primary="Section" secondary={sections.find(s => s._id === selectedSection)?.name || 'N/A'} />
                  </ListItem>
                </>
              )}
            </List>
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setShowReview(false)}
                sx={{ mr: 2 }}
              >
                Back to Edit
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenConfirmDialog}
                disabled={loading}
              >
                Confirm & Register
              </Button>
            </Box>
          </Box>
        )}
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          Already have an account?{' '}
          <Button onClick={() => navigate('/login')} sx={{ textTransform: 'none', p: 0 }}>
            Login
          </Button>
        </Typography>
      </Paper>

      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">Confirm Registration and Freeze Data</DialogTitle>
        <DialogContent>
          <Typography id="confirm-dialog-description">
            Please review your details carefully. Once registered, you cannot change the details. You may need to contact administrator for modifications.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button onClick={handleConfirmRegistration} variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Register;
