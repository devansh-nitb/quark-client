// frontend/src/components/Paper/UploadPaper.js
// Component for teachers/admins to upload question papers, now with student/section selection.

import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  TextField, Button, Typography, Box, Paper, CircularProgress, Snackbar, Alert,
  FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles'; // Import useTheme for theme access

const UploadPaper = () => {
  const theme = useTheme(); // Access the current theme
  console.log('UploadPaper: Component function executed.');

  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [semester, setSemester] = useState('');
  const [courseId, setCourseId] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [contentBase64, setContentBase64] = useState('');
  const [accessToIds, setAccessToIds] = useState([]); // Array of user/section IDs for access
  const [paperPassword, setPaperPassword] = useState(''); // New state for paper password
  const [confirmPaperPassword, setConfirmPaperPassword] = useState(''); // New state for paper password confirmation

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]); // List of only student users
  const [sections, setSections] = useState([]); // List of all sections
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [metadataError, setMetadataError] = useState('');

  useEffect(() => {
    console.log('UploadPaper: useEffect for initial metadata fetch triggered. Token:', token);
    const fetchMetadata = async () => {
      console.log('UploadPaper: fetchMetadata started.');
      setLoadingMetadata(true);
      setMetadataError(''); // Clear previous errors
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Subjects
        console.log('UploadPaper: Fetching subjects...');
        const subjectsResponse = await fetch('https://quark-server-4py2.onrender.com/api/misc/subjects', { headers });
        const subjectsData = await subjectsResponse.json();
        if (subjectsResponse.ok) {
          setSubjects(subjectsData);
          console.log('UploadPaper: Subjects fetched successfully, count:', subjectsData.length);
        } else {
          console.error('UploadPaper: Failed to fetch subjects:', subjectsData.message || 'Unknown error');
          setMetadataError(prev => prev + `Failed to load subjects: ${subjectsData.message || 'Unknown error'}. `);
        }

        // Fetch all users and filter for students
        console.log('UploadPaper: Fetching users...');
        const usersResponse = await fetch('https://quark-server-4py2.onrender.com/api/auth/users/all', { headers });
        const usersData = await usersResponse.json();
        if (usersResponse.ok) {
          setStudents(usersData.filter(u => u.role === 'student')); // Filter to only get students
          console.log('UploadPaper: Students fetched successfully, count:', usersData.filter(u => u.role === 'student').length);
        } else {
          console.error('UploadPaper: Failed to fetch users:', usersData.message || 'Unknown error');
          setMetadataError(prev => prev + `Failed to load users: ${usersData.message || 'Unknown error'}. `);
        }

        // Fetch Sections
        console.log('UploadPaper: Fetching sections...');
        const sectionsResponse = await fetch('https://quark-server-4py2.onrender.com/api/misc/sections', { headers });
        const sectionsData = await sectionsResponse.json();
        if (sectionsResponse.ok) {
          setSections(sectionsData);
          console.log('UploadPaper: Sections fetched successfully, count:', sectionsData.length);
        } else {
          console.error('UploadPaper: Failed to fetch sections:', sectionsData.message || 'Unknown error');
          setMetadataError(prev => prev + `Failed to load sections: ${sectionsData.message || 'Unknown error'}. `);
        }

      } catch (err) {
        console.error('UploadPaper: Network/parsing error during initial metadata fetch:', err);
        setMetadataError(prev => prev + `Network error fetching academic data: ${err.message}. `);
      } finally {
        setLoadingMetadata(false);
        console.log('UploadPaper: fetchMetadata finished, loadingMetadata set to false.');
      }
    };

    if (token) {
      fetchMetadata();
    } else {
      console.log('UploadPaper: No authentication token found, skipping metadata fetch.');
      setLoadingMetadata(false);
      setMetadataError('Authentication token missing. Please log in again.');
    }
  }, [token]);

  useEffect(() => {
    console.log('UploadPaper: useEffect for courses triggered. Subject ID:', subjectId);
    if (subjectId) {
      const fetchCourses = async () => {
        try {
          console.log(`UploadPaper: Fetching courses for subject ID: ${subjectId}...`);
          const response = await fetch(`https://quark-server-4py2.onrender.com/api/misc/courses/${subjectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (response.ok) {
            setCourses(data);
            console.log('UploadPaper: Courses fetched successfully, count:', data.length);
          } else {
            console.error('UploadPaper: Failed to fetch courses:', data.message || 'Unknown error');
            setMetadataError(prev => prev + `Failed to load courses for selected subject: ${data.message || 'Unknown error'}. `);
          }
        } catch (err) {
          console.error('UploadPaper: Network/parsing error fetching courses:', err);
          setMetadataError(prev => prev + `Network error fetching courses: ${err.message}. `);
        }
      };
      fetchCourses();
    } else {
      setCourses([]);
      setCourseId('');
      console.log('UploadPaper: No subject selected, clearing courses.');
    }
  }, [subjectId, token]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data URI prefix (e.g., "data:application/pdf;base64,")
        const base64Content = reader.result.split(',')[1];
        setContentBase64(base64Content);
        console.log('UploadPaper: File read as Base64.');
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setContentBase64('');
      console.log('UploadPaper: No file selected or file cleared.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSnackbarOpen(false);
    console.log('UploadPaper: Form submission started.');

    if (!contentBase64) {
      setSnackbarMessage('Please select a file to upload.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setLoading(false);
      console.log('UploadPaper: No file selected for upload.');
      return;
    }

    // New: Validate paper passwords if provided
    if (paperPassword && paperPassword !== confirmPaperPassword) {
        setSnackbarMessage('Paper password and confirmation do not match.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
        return;
    }
    // If a paper password is provided, ensure it meets some basic length requirements (e.g., > 0)
    if (paperPassword && paperPassword.length < 4) { // Example: minimum 4 characters for paper password
        setSnackbarMessage('Paper password must be at least 4 characters long.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
        return;
    }


    try {
      console.log('UploadPaper: Sending paper upload request...');
      const response = await fetch('https://quark-server-4py2.onrender.com/api/papers/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          subjectId,
          semester,
          courseId,
          validFrom,
          validTo,
          contentBase64,
          accessToIds, // Send the combined array of student/section IDs
          paperPassword: paperPassword || undefined, // Only send if not empty
        }),
      });

      const data = await response.json();
      console.log('UploadPaper: Paper upload response received:', data);

      if (response.ok) {
        setSnackbarMessage('Paper uploaded and encrypted successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        // Clear form fields
        setTitle('');
        setSubjectId('');
        setSemester('');
        setCourseId('');
        setValidFrom('');
        setValidTo('');
        setSelectedFile(null);
        setContentBase64(''); // Corrected from contentBase66
        setAccessToIds([]); // Clear selection
        setPaperPassword(''); // Clear paper password
        setConfirmPaperPassword(''); // Clear confirmation
        console.log('UploadPaper: Paper uploaded successfully, form cleared.');
        if (user.role === 'teacher') navigate('/teacher-dashboard');
        else if (user.role === 'admin') navigate('/admin-dashboard');
      } else {
        setSnackbarMessage(data.message || 'Failed to upload paper.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        console.error('UploadPaper: Paper upload failed:', data.message);
      }
    } catch (err) {
      console.error('UploadPaper: Network error during paper upload:', err);
      setSnackbarMessage('Network error. Please try again later.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      console.log('UploadPaper: Form submission finished, loading set to false.');
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Helper function to get display name for selected user/section IDs
  const getDisplayValue = (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return '';
    return selectedIds.map(id => {
      const student = students.find(s => s._id === id);
      const section = sections.find(sec => sec._id === id);
      if (student) return `Student: ${student.username}`;
      if (section) return `Section: ${section.name}`;
      return id; // Fallback if ID not found
    }).join(', ');
  };


  // Render loading state
  if (loadingMetadata) {
    console.log('UploadPaper: Rendering loading state.');
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.primary' }}>Loading academic data...</Typography>
      </Box>
    );
  }

  // Render error state if metadata loading failed
  if (metadataError) {
    console.error('UploadPaper: Rendering error state. Error:', metadataError);
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Alert severity="error" sx={{ width: '100%', maxWidth: 600, mb: 2 }}>
          Error loading required data: {metadataError}
          <br />Please ensure the backend is running, your token is valid, and you have necessary permissions.
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()} color="primary">Retry</Button>
      </Box>
    );
  }

  // If not loading and no errors, render the main form
  console.log('UploadPaper: Rendering main form.');
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 3, width: '100%', maxWidth: 600 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
          Upload Question Paper
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Paper Title"
            fullWidth
            margin="normal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            variant="outlined"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth margin="normal" required sx={{ mb: 2 }}>
            <InputLabel id="subject-label">Course</InputLabel>
            <Select
              labelId="subject-label"
              value={subjectId}
              label="Subject Name"
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {subjects.length === 0 ? (
                <MenuItem disabled value="">No courses available. Contact the administrator.</MenuItem>
              ) : (
                subjects.map((sub) => (
                  <MenuItem key={sub._id} value={sub._id}>
                    {sub.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required sx={{ mb: 2 }}>
            <InputLabel id="course-label">Subject</InputLabel>
            <Select
              labelId="course-label"
              value={courseId}
              label="Course"
              onChange={(e) => setCourseId(e.target.value)}
              disabled={!subjectId || courses.length === 0}
            >
              {courses.length === 0 ? (
                <MenuItem disabled value="">No courses available for this subject.</MenuItem>
              ) : (
                courses.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <TextField
            label="Semester & Course"
            fullWidth
            margin="normal"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            required
            variant="outlined"
            placeholder="e.g., Fall 2023 - CS101"
            sx={{ mb: 2 }}
          />

          <TextField
            label="Valid From"
            type="datetime-local"
            fullWidth
            margin="normal"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            required
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Valid To"
            type="datetime-local"
            fullWidth
            margin="normal"
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            required
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 3 }}>
            <TextField
                label="Paper Password (Optional)"
                type="password"
                fullWidth
                margin="normal"
                value={paperPassword}
                onChange={(e) => setPaperPassword(e.target.value)}
                variant="outlined"
                sx={{ mb: 1 }}
            />
            <TextField
                label="Confirm Paper Password"
                type="password"
                fullWidth
                margin="normal"
                value={confirmPaperPassword}
                onChange={(e) => setConfirmPaperPassword(e.target.value)}
                variant="outlined"
                disabled={!paperPassword} // Disable if no primary password is set
                helperText={paperPassword && confirmPaperPassword && paperPassword !== confirmPaperPassword ? "Passwords do not match" : ""}
                error={paperPassword && confirmPaperPassword && paperPassword !== confirmPaperPassword}
                sx={{ mb: 2 }}
            />
          </Box>

          <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
            <InputLabel id="access-to-label">Allow Specific Students/Sections (Optional)</InputLabel>
            <Select
              labelId="access-to-label"
              multiple
              value={accessToIds}
              onChange={(e) => setAccessToIds(e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((id) => {
                    const student = students.find(s => s._id === id);
                    const section = sections.find(sec => sec._id === id);
                    if (student) return <Chip key={id} label={`Student: ${student.username}`} size="small" />;
                    if (section) return <Chip key={id} label={`Section: ${section.name}`} size="small" color="secondary" />;
                    return null;
                  })}
                </Box>
              )}
              label="Allow Specific Students/Sections (Optional)"
            >
              {/* Students */}
              <MenuItem disabled>
                <Typography variant="subtitle2" color="text.secondary" sx={{ py: 1 }}>
                  -- Students --
                </Typography>
              </MenuItem>
              {students.length === 0 ? (
                <MenuItem disabled value="">No students available. Admin needs to register users.</MenuItem>
              ) : (
                students.map((studentOption) => (
                  <MenuItem key={studentOption._id} value={studentOption._id}>
                    Student: {studentOption.username} ({studentOption.email})
                  </MenuItem>
                ))
              )}
              {/* Sections */}
              <MenuItem disabled sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ py: 1 }}>
                  -- Sections --
                </Typography>
              </MenuItem>
              {sections.length === 0 ? (
                <MenuItem disabled value="">No sections available. Add via Admin Dashboard.</MenuItem>
              ) : (
                sections.map((sectionOption) => (
                  <MenuItem key={sectionOption._id} value={sectionOption._id}>
                    Section: {sectionOption.name} ({sectionOption.students.length} students)
                  </MenuItem>
                ))
              )}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Leave empty for access by all students within the time window.
            </Typography>
          </FormControl>


          <Box sx={{ mt: 2, mb: 3 }}>
            <InputLabel shrink htmlFor="paper-file-upload">Question Paper File (PDF/DOCX)</InputLabel>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              required
              id="paper-file-upload" // Link label to input
              style={{ display: 'block', marginTop: '8px' }}
            />
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Selected File: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{
              mt: 3,
              py: 1.5,
              fontWeight: theme.typography.button.fontWeight, // Ensure button text is visible
              fontSize: theme.typography.button.fontSize,
            }}
            disabled={loading || !selectedFile || (paperPassword && paperPassword !== confirmPaperPassword)}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Upload & Encrypt Paper'}
          </Button>
        </form>
      </Paper>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UploadPaper;
