import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  TextField, Button, Typography, Box, Paper, CircularProgress, Snackbar, Alert,
  FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles'; 

const UploadPaper = () => {
  const theme = useTheme(); 
  //console.log('Component function executed.');

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
  const [accessToIds, setAccessToIds] = useState([]); 
  const [paperPassword, setPaperPassword] = useState(''); 
  const [confirmPaperPassword, setConfirmPaperPassword] = useState(''); 

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]); 
  const [sections, setSections] = useState([]); 
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [metadataError, setMetadataError] = useState('');

  useEffect(() => {
    //console.log('useEffect for initial metadata fetch triggered. Token:', token);
    const fetchMetadata = async () => {
      //console.log('fetchMetadata started.');
      setLoadingMetadata(true);
      setMetadataError(''); 
      try {
        const headers = { Authorization: `Bearer ${token}` };

        //console.log('Fetching subjects...');
        const subjectsResponse = await fetch('https://quark-server-4py2.onrender.com/api/misc/subjects', { headers });
        const subjectsData = await subjectsResponse.json();
        if (subjectsResponse.ok) {
          setSubjects(subjectsData);
          //console.log('Subjects fetched successfully, count:', subjectsData.length);
        } else {
          console.error('Failed to fetch subjects:', subjectsData.message || 'Unknown error');
          setMetadataError(prev => prev + `Failed to load subjects: ${subjectsData.message || 'Unknown error'}. `);
        }


        //console.log('Fetching users...');
        const usersResponse = await fetch('https://quark-server-4py2.onrender.com/api/auth/users/all', { headers });
        const usersData = await usersResponse.json();
        if (usersResponse.ok) {
          setStudents(usersData.filter(u => u.role === 'student')); 
          //console.log('Students fetched successfully, count:', usersData.filter(u => u.role === 'student').length);
        } else {
          console.error('Failed to fetch users:', usersData.message || 'Unknown error');
          setMetadataError(prev => prev + `Failed to load users: ${usersData.message || 'Unknown error'}. `);
        }

        //console.log('Fetching sections...');
        const sectionsResponse = await fetch('https://quark-server-4py2.onrender.com/api/misc/sections', { headers });
        const sectionsData = await sectionsResponse.json();
        if (sectionsResponse.ok) {
          setSections(sectionsData);
          //console.log('Sections fetched successfully, count:', sectionsData.length);
        } else {
          console.error('Failed to fetch sections:', sectionsData.message || 'Unknown error');
          setMetadataError(prev => prev + `Failed to load sections: ${sectionsData.message || 'Unknown error'}. `);
        }

      } catch (err) {
        console.error('Network/parsing error during initial metadata fetch:', err);
        setMetadataError(prev => prev + `Network error fetching academic data: ${err.message}. `);
      } finally {
        setLoadingMetadata(false);
        //console.log('fetchMetadata finished, loadingMetadata set to false.');
      }
    };

    if (token) {
      fetchMetadata();
    } else {
      //console.log('No authentication token found, skipping metadata fetch.');
      setLoadingMetadata(false);
      setMetadataError('Authentication token missing. Please log in again.');
    }
  }, [token]);

  useEffect(() => {
    //console.log('useEffect for courses triggered. Subject ID:', subjectId);
    if (subjectId) {
      const fetchCourses = async () => {
        try {
          //console.log(`Fetching courses for subject ID: ${subjectId}...`);
          const response = await fetch(`https://quark-server-4py2.onrender.com/api/misc/courses/${subjectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (response.ok) {
            setCourses(data);
            //console.log('Courses fetched successfully, count:', data.length);
          } else {
            console.error('Failed to fetch courses:', data.message || 'Unknown error');
            setMetadataError(prev => prev + `Failed to load courses for selected subject: ${data.message || 'Unknown error'}. `);
          }
        } catch (err) {
          console.error('Network/parsing error fetching courses:', err);
          setMetadataError(prev => prev + `Network error fetching courses: ${err.message}. `);
        }
      };
      fetchCourses();
    } else {
      setCourses([]);
      setCourseId('');
      //console.log('No subject selected, clearing courses.');
    }
  }, [subjectId, token]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Content = reader.result.split(',')[1];
        setContentBase64(base64Content);
        //console.log('File read as Base64.');
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setContentBase64('');
      //console.log('No file selected or file cleared.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSnackbarOpen(false);
    //console.log('Form submission started.');

    if (!contentBase64) {
      setSnackbarMessage('Please select a file to upload.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setLoading(false);
      //console.log('No file selected for upload.');
      return;
    }

    if (paperPassword && paperPassword !== confirmPaperPassword) {
        setSnackbarMessage('Paper password and confirmation do not match.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
        return;
    }
    if (paperPassword && paperPassword.length < 4) { 
        setSnackbarMessage('Paper password must be at least 4 characters long.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
        return;
    }


    try {
      //console.log('Sending paper upload request...');
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
          accessToIds,
          paperPassword: paperPassword || undefined,
        }),
      });

      const data = await response.json();
      //console.log('Paper upload response received:', data);

      if (response.ok) {
        setSnackbarMessage('Paper uploaded and encrypted successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setTitle('');
        setSubjectId('');
        setSemester('');
        setCourseId('');
        setValidFrom('');
        setValidTo('');
        setSelectedFile(null);
        setContentBase64(''); 
        setAccessToIds([]); 
        setPaperPassword(''); 
        setConfirmPaperPassword('');
        //console.log('Paper uploaded successfully,.');
        if (user.role === 'teacher') navigate('/teacher-dashboard');
        else if (user.role === 'admin') navigate('/admin-dashboard');
      } else {
        setSnackbarMessage(data.message || 'Failed to upload paper.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        console.error('Paper upload failed:', data.message);
      }
    } catch (err) {
      console.error('Network error during paper upload:', err);
      setSnackbarMessage('Network error. Please try again later.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      //console.log('Form submission finished, loading set to false.');
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const getDisplayValue = (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return '';
    return selectedIds.map(id => {
      const student = students.find(s => s._id === id);
      const section = sections.find(sec => sec._id === id);
      if (student) return `Student: ${student.username}`;
      if (section) return `Section: ${section.name}`;
      return id; 
    }).join(', ');
  };

  if (loadingMetadata) {
    //console.log('Rendering loading state.');
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.primary' }}>Loading academic data...</Typography>
      </Box>
    );
  }

  if (metadataError) {
    console.error('Rendering error state. Error:', metadataError);
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
  //console.log('check main form.');
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
            placeholder="e.g., Sem 1 2023 - CS101"
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
                disabled={!paperPassword} 
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
            {/* <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Leave empty for access by all students within the time window.
            </Typography> */}
          </FormControl>


          <Box sx={{ mt: 2, mb: 3 }}>
            <InputLabel shrink htmlFor="paper-file-upload">Question Paper File (PDF/DOCX)</InputLabel>
            <input
              type="file"
              accept=".pdf"
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
              fontWeight: theme.typography.button.fontWeight,
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
