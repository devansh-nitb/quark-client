// frontend/src/components/Paper/ViewPaper.js
// Component for viewing decrypted question papers with a dynamic watermark and download functionality.

import React, { useState, useEffect, useContext, useMemo } from 'react'; // Import useMemo
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { AuthContext } from '../../context/AuthContext';
import {
  Box, Typography, Paper, CircularProgress, Alert, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import DownloadIcon from '@mui/icons-material/Download';

// Import react-pdf components and worker
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'; // Essential for annotations like links in PDF
import 'react-pdf/dist/esm/Page/TextLayer.css'; // Essential for selectable text in PDF

// Set up the worker source for pdf.js. This is crucial for react-pdf to work.
// It now attempts a more robust path.
// You MUST copy 'pdf.worker.min.js' from 'node_modules/pdfjs-dist/build/' to 'frontend/public/'
pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.js`; // More robust path


const ViewPaper = () => {
  const { paperId } = useParams(); // Get paper ID from URL
  const navigate = useNavigate();
  const location = useLocation(); // Hook to access location object
  const { token, user } = useContext(AuthContext);

  const [paperTitle, setPaperTitle] = useState('');
  const [paperContent, setPaperContent] = useState(null); // base64 string
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(null); // State to store total number of pages in the PDF
  const [scale, setScale] = useState(1.0); // State for PDF zoom level

  // State for view paper password modal
  const [openViewPasswordModal, setOpenViewPasswordModal] = useState(false);
  const [currentPaperForView, setCurrentPaperForView] = useState(null); // To store paper details for modal
  const [viewPaperPassword, setViewPaperPassword] = useState('');
  const [viewModalError, setViewModalError] = useState('');

  // State for download functionality
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [downloadLoginPassword, setDownloadLoginPassword] = useState(''); // User's login password
  const [downloadPaperSpecificPassword, setDownloadPaperSpecificPassword] = useState(''); // Re-added for paper-specific password
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadModalError, setDownloadModalError] = useState('');

  // Snackbar for general feedback
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Store full paper details from the first successful fetch to use in download modal
  const [fullPaperDetails, setFullPaperDetails] = useState(null);

  // Log the worker source path to help diagnose loading issues
  console.log('PDF.js Worker Source (set in code):', pdfjs.GlobalWorkerOptions.workerSrc);

  // Function to fetch paper content, now accepts a paperPassword parameter
  const fetchPaper = async (attemptPaperPassword = null) => {
    setLoading(true);
    setError('');
    setViewModalError(''); // Clear any previous modal errors
    setDownloadModalError(''); // Clear download modal error here as well
    try {
      console.log(`ViewPaper: Attempting to fetch paper ${paperId}`);
      const response = await fetch(`https://quark-server-4py2.onrender.com/api/papers/view/${paperId}`, {
        method: 'POST', // Backend expects POST for view
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paperPassword: attemptPaperPassword }), // Send the password
      });

      const data = await response.json();

      if (response.ok) {
        console.log('ViewPaper: Paper fetched and decrypted successfully.');
        setPaperTitle(data.title);
        setPaperContent(data.content);
        setFullPaperDetails(data); // Store full details for download modal
        setOpenViewPasswordModal(false); // Close password modal on success
      } else {
        console.error('ViewPaper: Failed to fetch paper:', data.message || 'Unknown error');
        setError(data.message || 'Failed to retrieve paper. It might be corrupted or unauthorized.');
        // If the error is due to a missing/incorrect password, open the modal
        if (response.status === 401 && (data.message?.includes('password') || data.message?.includes('requires'))) {
            // Store paper details for the modal to know if it's password protected
            // This is crucial if we landed here without fullPaperDetails already set
            setFullPaperDetails(prev => ({ ...prev, requiresPassword: true })); // Ensure flag is set for modal logic
            setOpenViewPasswordModal(true);
            setViewModalError(data.message);
        } else {
            // For other errors, just show a snackbar/alert and don't open modal
            setSnackbarMessage(data.message || 'Failed to retrieve paper.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
      }
    } catch (err) {
      console.error('ViewPaper: Network error fetching paper:', err);
      setError('Network error while fetching paper. Please try again later.');
      setSnackbarMessage('Network error. Please try again later.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      console.log('ViewPaper: Paper fetch finished.');
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

    // Check if pdf.worker.min.js is properly set.
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        console.warn('PDF.js worker source is NOT set. Ensure "pdf.worker.min.js" is copied to your "public" directory and the path is correct.');
        setError('PDF viewer not initialized. Please ensure PDF.js worker file is correctly deployed.');
        setLoading(false);
        return; // Stop execution if worker is not configured
    }

    // Check if paper password was passed via navigation state (from dashboard)
    const passwordFromState = location.state?.paperPassword;
    console.log('ViewPaper: passwordFromState:', passwordFromState ? 'present' : 'absent');

    fetchPaper(passwordFromState);

    // Clean up navigation state after use to avoid issues if navigating back/forth
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


  // Callback function when the PDF document is successfully loaded by react-pdf
  const onDocumentLoadSuccess = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages);
    console.log(`PDF loaded successfully with ${nextNumPages} pages.`);
  };

  // Handlers for zoom functionality
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 2.0)); // Max zoom 2.0
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5)); // Min zoom 0.5
  };

  // Handler for submitting password in the ViewPaper's internal modal
  const handleConfirmViewPassword = () => {
    if (!viewPaperPassword) {
      setViewModalError('Password is required to view this paper.');
      return;
    }
    fetchPaper(viewPaperPassword); // Retry fetch with the entered password
    // The modal will be closed by fetchPaper on success
  };

  // Handlers for download dialog
  const handleOpenDownloadDialog = () => {
    setOpenDownloadDialog(true);
    setDownloadLoginPassword(''); // Clear login password field on open
    setDownloadPaperSpecificPassword(''); // Clear paper password field on open
    setDownloadModalError(''); // Clear previous errors
    setSnackbarOpen(false); // Close any existing snackbars
  };

  const handleCloseDownloadDialog = () => {
    setOpenDownloadDialog(false);
    setDownloadLoginPassword('');
    setDownloadPaperSpecificPassword('');
    setDownloadLoading(false);
    setDownloadModalError('');
  };

  const handleDownloadConfirm = async () => {
    setDownloadLoading(true);
    setDownloadModalError(''); // Clear previous errors

    if (!downloadLoginPassword) {
      setDownloadModalError('Your login password is required.');
      setDownloadLoading(false);
      return;
    }
    // Conditionally check for paper-specific password for download
    if (fullPaperDetails?.requiresPassword && !downloadPaperSpecificPassword) {
        setDownloadModalError('This paper requires a paper-specific password for download.');
        setDownloadLoading(false);
        return;
    }

    try {
      console.log(`ViewPaper: Attempting to download paper ${paperId} with login password.`);
      const response = await fetch(`https://quark-server-4py2.onrender.com/api/papers/download/${paperId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            password: downloadLoginPassword, // User's login password
            // Conditionally send paperPassword if required by the paper
            paperPassword: fullPaperDetails?.requiresPassword ? downloadPaperSpecificPassword : undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Backend should send the watermarked PDF content as base64 data URI
        const watermarkedPdfBase64 = data.content;
        const filename = `${paperTitle.replace(/\s/g, '_')}_Watermarked_${user?.username || 'user'}.pdf`;

        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = watermarkedPdfBase64;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSnackbarMessage('Paper downloaded successfully with your user ID watermark!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        console.log('ViewPaper: Paper download initiated.');
        handleCloseDownloadDialog(); // Close dialog after successful download
      } else {
        setDownloadModalError(data.message || 'Download failed. Please check credentials.');
        setSnackbarMessage(data.message || 'Download failed.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        console.error('ViewPaper: Download failed:', data.message);
      }
    } catch (err) {
      console.error('ViewPaper: Network error during download:', err);
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

  // Memoize the options object for the <Document /> component
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

  if (error && !openViewPasswordModal) { // Renamed from openViewPaperPasswordModal
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Alert severity="error" sx={{ width: '100%', maxWidth: 600, mb: 2 }}>
          Error: {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>Go Back</Button>
      </Box>
    );
  }

  // Generate watermark text dynamically
  const watermarkText = fullPaperDetails?.watermarkInfo
    ? `${fullPaperDetails.watermarkInfo.studentName} (${fullPaperDetails.watermarkInfo.studentId})\n${new Date(fullPaperDetails.watermarkInfo.timestamp).toLocaleString()}`
    : `User: ${user?.username || 'N/A'} (ID: ${user?._id || 'N/A'})\nTime: ${new Date().toLocaleString()}`;


  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px - (2 * 24px))', // Adjust height based on AppBar and padding
        p: 2,
        boxSizing: 'border-box',
      }}
    >
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.dark', mb: 2 }}>
        {paperTitle || 'View Question Paper'}
      </Typography>

      {/* Controls: Back button, Zoom controls, and Download button */}
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
          {/* <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            sx={{ ml: 2 }}
            onClick={handleOpenDownloadDialog}
            disabled={!paperContent} // Disable if no paper content is loaded
          >
            Download
          </Button> */}
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
        {/* Watermark Overlay - Non-blocking for interactions */}
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

        {/* PDF Content Display Area using react-pdf */}
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
                    marginBottom: '10px', // Spacing between pages
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
                    console.error('Error loading document:', e);
                    setError('Failed to load PDF document. It might be corrupted or malformed.');
                    setSnackbarMessage('Failed to load PDF. Please check the file.');
                    setSnackbarSeverity('error');
                    setSnackbarOpen(true);
                }}
                options={documentOptions} // Use memoized options here
                >
                {/* Render all pages */}
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

      {/* View Paper Password Confirmation Dialog */}
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


      {/* Download Password Confirmation Dialog */}
      <Dialog open={openDownloadDialog} onClose={handleCloseDownloadDialog}>
        <DialogTitle>Confirm Download</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter your login password to confirm the download of this question paper.
            {fullPaperDetails?.requiresPassword && " You will also need to enter the paper's specific password."}
            The downloaded PDF will include a watermark with your user ID for security.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Your Login Password"
            type="password"
            fullWidth
            variant="outlined"
            value={downloadLoginPassword}
            onChange={(e) => setDownloadLoginPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          {/* Conditionally render Paper Specific Password field */}
          {fullPaperDetails?.requiresPassword && (
            <TextField
              margin="dense"
              label="Paper Specific Password"
              type="password"
              fullWidth
              variant="outlined"
              value={downloadPaperSpecificPassword}
              onChange={(e) => setDownloadPaperSpecificPassword(e.target.value)}
            />
          )}
          {downloadModalError && (
            <Alert severity="error" sx={{ mt: 2 }}>{downloadModalError}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDownloadDialog} disabled={downloadLoading}>Cancel</Button>
          <Button
            onClick={handleDownloadConfirm}
            // Update disabled condition: If paper requires password, both fields must be filled
            disabled={downloadLoading || !downloadLoginPassword || (fullPaperDetails?.requiresPassword && !downloadPaperSpecificPassword)}
            variant="contained"
          >
            {downloadLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Download'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewPaper;
