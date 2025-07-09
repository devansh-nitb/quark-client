import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Box, Typography, Paper, Grid, Button, CircularProgress, Alert, Card, CardContent, CardActions, useTheme, Chip,
         Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import DownloadIcon from '@mui/icons-material/Download';

const StudentDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [availablePapers, setAvailablePapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();

  const [openViewPaperPasswordModal, setOpenViewPaperPasswordModal] = useState(false);
  const [currentPaperForView, setCurrentPaperForView] = useState(null);
  const [viewPaperPasswordInput, setViewPaperPasswordInput] = useState('');
  const [viewPasswordModalError, setViewPasswordModalError] = useState('');

  const [openDownloadPaperModal, setOpenDownloadPaperModal] = useState(false);
  const [currentPaperForDownload, setCurrentPaperForDownload] = useState(null);
  const [downloadOTP, setDownloadOTP] = useState('');
  const [downloadPaperSpecificPassword, setDownloadPaperSpecificPassword] = useState('');
  const [downloadModalError, setDownloadModalError] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [requestOTPLoading, setRequestOTPLoading] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');


  useEffect(() => {
    const fetchAvailablePapers = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://quark-server-4py2.onrender.com/api/papers/list', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setAvailablePapers(data);
        } else {
          setError(data.message || 'Failed to fetch available papers.');
        }
      } catch (err) {
        setError('Network error fetching papers.');
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchAvailablePapers();
    }
  }, [user, token]);

  const handleViewPaper = (paper) => {
    setCurrentPaperForView(paper);
    if (paper.requiresPassword) {
      setOpenViewPaperPasswordModal(true);
      setViewPaperPasswordInput('');
      setViewPasswordModalError('');
    } else {
      navigate(`/view-paper/${paper._id}`);
    }
  };

  const handleViewPaperPasswordSubmit = () => {
    if (!viewPaperPasswordInput) {
      setViewPasswordModalError('Please enter the paper password.');
      return;
    }
    navigate(`/view-paper/${currentPaperForView._id}`, { state: { paperPassword: viewPaperPasswordInput } });
    setOpenViewPaperPasswordModal(false);
  };

  const handleOpenDownloadPaperModal = (paper) => {
    setCurrentPaperForDownload(paper);
    setDownloadOTP('');
    setDownloadPaperSpecificPassword('');
    setDownloadModalError('');
    setRequestOTPLoading(false);
    setOpenDownloadPaperModal(true);
  };

  const handleRequestOTP = async () => {
    setRequestOTPLoading(true);
    setDownloadModalError('');
    try {
        const response = await fetch('https://quark-server-4py2.onrender.com/api/auth/request-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email: user.email }),
        });
        const data = await response.json();
        if (response.ok) {
            setSnackbarMessage('OTP sent to your registered email!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } else {
            setDownloadModalError(data.message || 'Failed to request OTP.');
            setSnackbarMessage(data.message || 'Failed to request OTP.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    } catch (err) {
        setDownloadModalError('Network error while requesting OTP.');
        setSnackbarMessage('Network error while requesting OTP.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
    } finally {
        setRequestOTPLoading(false);
    }
  };

  const handleConfirmDownloadPaper = async () => {
    if (!currentPaperForDownload || !downloadOTP) {
      setDownloadModalError('Please enter the OTP.');
      return;
    }
    if (currentPaperForDownload.requiresPassword && !downloadPaperSpecificPassword) {
        setDownloadModalError('This paper requires a paper-specific password.');
        return;
    }

    setDownloadLoading(true);
    setDownloadModalError('');

    try {
      const response = await fetch(`https://quark-server-4py2.onrender.com/api/papers/download/${currentPaperForDownload._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          otp: downloadOTP,
          paperPassword: currentPaperForDownload.requiresPassword ? downloadPaperSpecificPassword : undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const watermarkedPdfBase64 = data.content;
        const filename = `${currentPaperForDownload.title.replace(/\s/g, '_')}_Watermarked_${user?.username || 'user'}.pdf`;

        const link = document.createElement('a');
        link.href = watermarkedPdfBase64;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSnackbarMessage('Paper downloaded successfully with your user ID watermark!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setOpenDownloadPaperModal(false);
      } else {
        setDownloadModalError(data.message || 'Download failed.');
        setSnackbarMessage(data.message || 'Download failed.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      setDownloadModalError('Network error during download.');
      setSnackbarMessage('Network error during download.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setDownloadLoading(false);
    }
  };


  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'primary.dark', fontWeight: 'bold', mb: 4 }}>
        Student Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Access your assigned question papers and review for upcoming exams.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={4} sx={{ p: { xs: 2, md: 3 }, minHeight: 300, borderRadius: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'secondary.dark', fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider', pb: 1, mb: 3 }}>
          Available Question Papers
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : availablePapers.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            No question papers are currently available for you. Check back later or contact your instructor.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {availablePapers.map((paper) => (
              <Grid item xs={12} sm={6} md={4} key={paper._id}>
                <Card sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 3,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                  }
                }}>
                  <CardContent>
                    <Typography variant="h6" component="h3" sx={{ color: 'primary.dark', mb: 1, fontWeight: 'bold' }}>
                      {paper.title} {paper.requiresPassword && <Chip label="Password Protected" size="small" color="info" sx={{ ml: 1 }} />}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Subject: <Chip label={paper.subject?.name || 'N/A'} size="small" variant="outlined" sx={{ ml: 0.5 }} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Course: <Chip label={paper.course?.name || 'N/A'} size="small" variant="outlined" sx={{ ml: 0.5 }} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Semester: {paper.semester}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Available: {new Date(paper.validFrom).toLocaleDateString()} - {new Date(paper.validTo).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewPaper(paper)}
                      sx={{ borderRadius: 2 }}
                    >
                      View Paper
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleOpenDownloadPaperModal(paper)}
                        sx={{ borderRadius: 2, ml: 1 }}
                    >
                        Download
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Dialog open={openViewPaperPasswordModal} onClose={() => setOpenViewPaperPasswordModal(false)}>
        <DialogTitle>Enter Paper Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This paper is password protected. Please enter the password to view.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Paper Password"
            type="password"
            fullWidth
            variant="outlined"
            value={viewPaperPasswordInput}
            onChange={(e) => setViewPaperPasswordInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleViewPaperPasswordSubmit();
              }
            }}
            error={!!viewPasswordModalError}
            helperText={viewPasswordModalError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewPaperPasswordModal(false)}>Cancel</Button>
          <Button onClick={handleViewPaperPasswordSubmit} variant="contained">View Paper</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDownloadPaperModal} onClose={() => setOpenDownloadPaperModal(false)}>
        <DialogTitle>Download "{currentPaperForDownload?.title}"</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            To download, please enter the OTP sent to your registered email and the paper's password (if required).
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="OTP"
              type="text"
              fullWidth
              variant="outlined"
              value={downloadOTP}
              onChange={(e) => setDownloadOTP(e.target.value)}
              error={!!downloadModalError && downloadModalError.includes('OTP')}
              helperText={downloadModalError && downloadModalError.includes('OTP') ? downloadModalError : ''}
            />
            <Button
              variant="outlined"
              onClick={handleRequestOTP}
              disabled={requestOTPLoading}
              sx={{ flexShrink: 0, height: 'fit-content' }}
            >
              {requestOTPLoading ? <CircularProgress size={24} color="inherit" /> : 'Request OTP'}
            </Button>
          </Box>
          {currentPaperForDownload?.requiresPassword && (
            <TextField
              margin="dense"
              label="Paper Specific Password"
              type="password"
              fullWidth
              variant="outlined"
              value={downloadPaperSpecificPassword}
              onChange={(e) => setDownloadPaperSpecificPassword(e.target.value)}
              error={!!downloadModalError && downloadModalError.includes('paper-specific password')}
              helperText={downloadModalError && downloadModalError.includes('paper-specific password') ? downloadModalError : ''}
            />
          )}
          {downloadModalError && !downloadModalError.includes('OTP') && !downloadModalError.includes('paper-specific password') && (
            <Alert severity="error" sx={{ mt: 2 }}>{downloadModalError}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDownloadPaperModal(false)} disabled={downloadLoading}>Cancel</Button>
          <Button
            onClick={handleConfirmDownloadPaper}
            variant="contained"
            disabled={downloadLoading || !downloadOTP || (currentPaperForDownload?.requiresPassword && !downloadPaperSpecificPassword)}
          >
            {downloadLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Download'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%', borderRadius: 2 }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentDashboard;
