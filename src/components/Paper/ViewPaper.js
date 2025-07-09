import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  Box, Typography, Paper, CircularProgress, Alert, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import DownloadIcon from '@mui/icons-material/Download';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.js`;

const ViewPaper = () => {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useContext(AuthContext);

  const [paperTitle, setPaperTitle] = useState('');
  const [paperContent, setPaperContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);

  const [openViewPasswordModal, setOpenViewPasswordModal] = useState(false);
  const [viewPaperPassword, setViewPaperPassword] = useState('');
  const [viewModalError, setViewModalError] = useState('');

  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [downloadOTP, setDownloadOTP] = useState('');
  const [downloadPaperSpecificPassword, setDownloadPaperSpecificPassword] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [requestOTPLoading, setRequestOTPLoading] = useState(false);
  const [downloadModalError, setDownloadModalError] = useState('');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [fullPaperDetails, setFullPaperDetails] = useState(null);

  const fetchPaper = async (attemptPaperPassword = null) => {
    setLoading(true);
    setError('');
    setViewModalError('');
    setDownloadModalError('');
    try {
      const response = await fetch(`http://localhost:5000/api/papers/view/${paperId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paperPassword: attemptPaperPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setPaperTitle(data.title);
        setPaperContent(data.content);
        setFullPaperDetails(data);
        setOpenViewPasswordModal(false);
      } else {
        setError(data.message || 'Failed to retrieve paper. It might be corrupted or unauthorized.');
        if (response.status === 401 && (data.message?.includes('password') || data.message?.includes('requires'))) {
            setFullPaperDetails(prev => ({ ...prev, requiresPassword: true }));
            setOpenViewPasswordModal(true);
            setViewModalError(data.message);
        } else {
            setSnackbarMessage(data.message || 'Failed to retrieve paper.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
      }
    } catch (err) {
      setError('Network error while fetching paper. Please try again later.');
      setSnackbarMessage('Network error. Please try again later.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !token) {
      setSnackbarMessage('Authentication required. Redirecting to login...');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        setError('PDF viewer not initialized. Please ensure PDF.js worker file is correctly deployed.');
        setLoading(false);
        return;
    }

    const passwordFromState = location.state?.paperPassword;
    fetchPaper(passwordFromState);

    if (location.state?.paperPassword) {
      const stateCopy = { ...location.state };
      delete stateCopy.paperPassword;
      window.history.replaceState(stateCopy, '', location.pathname);
    }

    return () => {
        setPaperContent(null);
        setNumPages(null);
    };

  }, [paperId, token, user, navigate, location.state]);

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages);
  };

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  const handleConfirmViewPassword = () => {
    if (!viewPaperPassword) {
      setViewModalError('Password is required to view this paper.');
      return;
    }
    fetchPaper(viewPaperPassword);
  };

  const handleOpenDownloadDialog = () => {
    setOpenDownloadDialog(true);
    setDownloadOTP('');
    setDownloadPaperSpecificPassword('');
    setDownloadModalError('');
    setSnackbarOpen(false);
  };

  const handleCloseDownloadDialog = () => {
    setOpenDownloadDialog(false);
    setDownloadOTP('');
    setDownloadPaperSpecificPassword('');
    setDownloadLoading(false);
    setRequestOTPLoading(false);
    setDownloadModalError('');
  };

  const handleRequestOTP = async () => {
    setRequestOTPLoading(true);
    setDownloadModalError('');
    try {
        const response = await fetch('http://localhost:5000/api/auth/request-otp', {
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

  const handleDownloadConfirm = async () => {
    setDownloadLoading(true);
    setDownloadModalError('');

    if (!downloadOTP) {
      setDownloadModalError('OTP is required.');
      setDownloadLoading(false);
      return;
    }
    if (fullPaperDetails?.requiresPassword && !downloadPaperSpecificPassword) {
        setDownloadModalError('This paper requires a paper-specific password for download.');
        setDownloadLoading(false);
        return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/papers/download/${paperId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            otp: downloadOTP,
            paperPassword: fullPaperDetails?.requiresPassword ? downloadPaperSpecificPassword : undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const watermarkedPdfBase64 = data.content;
        const filename = `${paperTitle.replace(/\s/g, '_')}_Watermarked_${user?.username || 'user'}.pdf`;

        const link = document.createElement('a');
        link.href = watermarkedPdfBase64;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSnackbarMessage('Paper downloaded successfully with your user ID watermark!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        handleCloseDownloadDialog();
      } else {
        setDownloadModalError(data.message || 'Download failed. Please check credentials.');
        setSnackbarMessage(data.message || 'Download failed.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      setDownloadModalError('Network error during download. Please try again later.');
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

  const documentOptions = useMemo(() => ({
    workerSrc: pdfjs.GlobalWorkerOptions.workerSrc,
  }), [pdfjs.GlobalWorkerOptions.workerSrc]);


  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading paper content...</Typography>
      </Box>
    );
  }

  if (error && !openViewPasswordModal) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Alert severity="error" sx={{ width: '100%', maxWidth: 600, mb: 2 }}>
          Error: {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>Go Back</Button>
      </Box>
    );
  }

  const watermarkText = fullPaperDetails?.watermarkInfo
    ? `${fullPaperDetails.watermarkInfo.studentName} (${fullPaperDetails.watermarkInfo.studentId})\n${new Date(fullPaperDetails.watermarkInfo.timestamp).toLocaleString()}`
    : `User: ${user?.username || 'N/A'} (ID: ${user?._id || 'N/A'})\nTime: ${new Date().toLocaleString()}`;


  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px - (2 * 24px))',
        p: 2,
        boxSizing: 'border-box',
      }}
    >
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.dark', mb: 2 }}>
        {paperTitle || 'View Question Paper'}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back to Dashboard
        </Button>
        <Box>
          <IconButton onClick={handleZoomOut} disabled={scale <= 0.5}>
            <ZoomOutIcon />
          </IconButton>
          <Typography variant="body1" component="span" sx={{ mx: 1 }}>
            {(scale * 100).toFixed(0)}%
          </Typography>
          <IconButton onClick={handleZoomIn} disabled={scale >= 2.0}>
            <ZoomInIcon />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            sx={{ ml: 2 }}
            onClick={handleOpenDownloadDialog}
            disabled={!paperContent}
          >
            Download
          </Button>
        </Box>
      </Box>

      <Paper
        elevation={6}
        sx={{
          flexGrow: 1,
          p: 2,
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            pointerEvents: 'none',
            opacity: 0.1,
            color: 'text.primary',
            textAlign: 'center',
            transform: 'rotate(-30deg)',
            userSelect: 'none',

            '@media print': {
              opacity: 0.5,
              color: 'text.primary',
              fontSize: '2rem',
            },
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              whiteSpace: 'pre-line',
              wordBreak: 'break-all',
              '@media print': {
                fontSize: '2.5rem',
              },
            }}
          >
            {watermarkText}
          </Typography>
        </Box>

        {paperContent ? (
            <Box
            sx={{
                flexGrow: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                zIndex: 5,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                '& .react-pdf__Document': {
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                },
                '& .react-pdf__Page': {
                    marginBottom: '10px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    '& canvas': {
                        width: '100% !important',
                        height: 'auto !important',
                    },
                },
            }}
            >
                <Document
                file={paperContent}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(e) => {
                    setError('Failed to load PDF document. It might be corrupted or malformed.');
                    setSnackbarMessage('Failed to load PDF. Please check the file.');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                }}
                options={documentOptions}
                >
                {Array.from({ length: numPages }, (_, i) => (
                    <Page
                        key={`page_${i + 1}`}
                        pageNumber={i + 1}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                    />
                ))}
                </Document>
            </Box>
        ) : (
          <Typography variant="body1" color="error" align="center" sx={{ mt: 5 }}>
            No paper content available.
          </Typography>
        )}
      </Paper>

      <Dialog open={openViewPasswordModal} onClose={() => setOpenViewPasswordModal(false)}>
        <DialogTitle>Enter Paper Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This paper requires a password to view.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Paper Password"
            type="password"
            fullWidth
            variant="outlined"
            value={viewPaperPassword}
            onChange={(e) => setViewPaperPassword(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleConfirmViewPassword();
              }
            }}
            error={!!viewModalError}
            helperText={viewModalError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewPasswordModal(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirmViewPassword} disabled={loading || !viewPaperPassword} variant="contained">
            {loading ? <CircularProgress size={24} color="inherit" /> : 'View Paper'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDownloadDialog} onClose={handleCloseDownloadDialog}>
        <DialogTitle>Confirm Download</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter the OTP sent to your registered email to confirm the download of this question paper.
            {fullPaperDetails?.requiresPassword && " You will also need to enter the paper's specific password."}
            The downloaded PDF will include a watermark with your user ID for security.
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

          {fullPaperDetails?.requiresPassword && (
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
          <Button onClick={handleCloseDownloadDialog} disabled={downloadLoading}>Cancel</Button>
          <Button
            onClick={handleDownloadConfirm}
            disabled={downloadLoading || !downloadOTP || (fullPaperDetails?.requiresPassword && !downloadPaperSpecificPassword)}
            variant="contained"
          >
            {downloadLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Download'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewPaper;
