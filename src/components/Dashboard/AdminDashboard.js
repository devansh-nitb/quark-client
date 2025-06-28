import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import {
  Box, Typography, Paper, Grid, Button, CircularProgress, Alert, Snackbar,
  Modal, Backdrop, Fade, FormControl, InputLabel, Select, MenuItem, TextField, Chip,
  List, ListItem, ListItemText, IconButton, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Import new icon

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  // State for Academic Data Management (keeping original backend terminology for state variables)
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]); // This holds backend 'Subject' data, will be displayed as 'Courses'
  const [courses, setCourses] = useState([]); // This holds backend 'Course' data, will be displayed as 'Subjects (with Course Code)'
  const [sections, setSections] = useState([]);
  const [loadingAcademicData, setLoadingAcademicData] = useState(true);
  const [academicDataError, setAcademicDataError] = useState('');

  // Modals for adding academic data
  const [openAddDeptModal, setOpenAddDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  // For 'Add New Course' (was 'Add New Subject')
  const [openAddCourseSingleModal, setOpenAddCourseSingleModal] = useState(false); // Renamed to avoid confusion
  const [newCourseNameSingle, setNewCourseNameSingle] = useState(''); // New Course Name (was Subject Name)
  const [newCourseDeptSingle, setNewCourseDeptSingle] = useState(''); // Course's Department (was Subject's Department)
  // For 'Add New Subject (with Course Code)' (was 'Add New Course')
  const [openAddSubjectSingleModal, setOpenAddSubjectSingleModal] = useState(false); // Renamed to avoid confusion
  const [selectedDepartmentForSubjectSingle, setSelectedDepartmentForSubjectSingle] = useState(''); // New state for chained dropdown
  const [newSubjectCodeSingle, setNewSubjectCodeSingle] = useState(''); // New Subject Code (was Course Name)
  const [newSubjectCourseSingle, setNewSubjectCourseSingle] = useState(''); // Subject's Course (was Course's Subject)
  const [openAddSectionModal, setOpenAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionStudents, setNewSectionStudents] = useState([]); // Initialize as array

  // State for Bulk User Upload (CSV)
  const [openBulkUploadModal, setOpenBulkUploadModal] = useState(false);
  const [selectedBulkFile, setSelectedBulkFile] = useState(null);
  const [parsedTableHeaders, setParsedTableHeaders] = useState([]);
  const [parsedTableData, setParsedTableData] = useState([]);
  const [bulkUploadError, setBulkUploadError] = useState('');
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);

  // State for Bulk Academic Data Upload (using new UI terminology for local state)
  const [openBulkAcademicModal, setOpenBulkAcademicModal] = useState(false);
  const [newBulkDepartmentId, setNewBulkDepartmentId] = useState('');
  // New state for selecting an existing Course (backend Subject) in bulk upload
  const [selectedParentCourseId, setSelectedParentCourseId] = useState('');
  // New state for the array of new Subject Codes (backend Courses)
  const [newSubjectCodesInput, setNewSubjectCodesInput] = useState(['']);
  // This will store objects like { name: 'CODE', subject: 'PARENT_SUBJECT_ID' }
  const [bulkAcademicEntries, setBulkAcademicEntries] = useState([]);
  const [showAcademicReview, setShowAcademicReview] = useState(false);
  const [academicBulkUploadLoading, setAcademicBulkUploadLoading] = useState(false);
  const [academicBulkUploadError, setAcademicBulkUploadError] = useState('');
  const [academicBulkUploadResults, setAcademicBulkUploadResults] = useState(null);


  // --- Data Fetching Functions ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('https://quark-server-4py2.onrender.com/api/auth/users/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        setError(data.message || 'Failed to fetch users.');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Network error fetching users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch('https://quark-server-4py2.onrender.com/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setLogs(data);
      } else {
        setError(data.message || 'Failed to fetch logs.');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Network error fetching logs.');
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchAcademicData = async () => {
    setLoadingAcademicData(true);
    setAcademicDataError('');
    try {
      const [deptsRes, subjectsRes, coursesRes, sectionsRes] = await Promise.all([
        fetch('https://quark-server-4py2.onrender.com/api/misc/departments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://quark-server-4py2.onrender.com/api/misc/subjects', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://quark-server-4py2.onrender.com/api/misc/courses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('https://quark-server-4py2.onrender.com/api/misc/sections', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const deptsData = await deptsRes.json();
      if (deptsRes.ok) setDepartments(deptsData); else throw new Error(deptsData.message || 'Failed to fetch departments');

      const subjectsData = await subjectsRes.json(); // This is backend's 'Subjects'
      if (subjectsRes.ok) setSubjects(subjectsData); else throw new Error(subjectsData.message || 'Failed to fetch subjects');

      const coursesData = await coursesRes.json(); // This is backend's 'Courses'
      if (coursesRes.ok) setCourses(coursesData); else throw new Error(coursesData.message || 'Failed to fetch courses');

      const sectionsData = await sectionsRes.json();
      if (sectionsRes.ok) setSections(sectionsData); else throw new Error(sectionsData.message || 'Failed to fetch sections');

    } catch (err) {
      console.error('Error fetching academic data:', err);
      setAcademicDataError(`Error loading academic data: ${err.message}. Please ensure backend is running and data exists.`);
    } finally {
      setLoadingAcademicData(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchUsers();
      fetchLogs();
      fetchAcademicData();
    }
  }, [user, token]);

  // --- Role Management Handlers ---
  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setOpenRoleModal(true);
  };

  const handleCloseRoleModal = () => {
    setOpenRoleModal(false);
    setSelectedUser(null);
    setNewRole('');
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      const response = await fetch('https://quark-server-4py2.onrender.com/api/admin/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUser._id, newRole }),
      });

      const data = await response.json();
      if (response.ok) {
        setSnackbarMessage('Role updated successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchUsers(); // Refresh user list
        fetchLogs(); // Refresh logs
        handleCloseRoleModal();
      } else {
        setSnackbarMessage(data.message || 'Failed to update role.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error assigning role:', err);
      setSnackbarMessage('Network error while assigning role.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // --- Academic Data Management Handlers ---

  const handleAddAcademicData = async (type, data) => {
    try {
      const response = await fetch('https://quark-server-4py2.onrender.com/api/admin/manage-academic-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, action: 'add', data }),
      });
      const result = await response.json();
      if (response.ok) {
        setSnackbarMessage(`${type} added successfully!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchAcademicData(); // Refresh all academic data
        return true;
      } else {
        setSnackbarMessage(result.message || `Failed to add ${type}.`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return false;
      }
    } catch (err) {
      console.error(`Error adding ${type}:`, err);
      setSnackbarMessage(`Network error adding ${type}.`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return false;
    }
  };

  const handleSubmitDepartment = async () => {
    if (!newDeptName) return;
    const success = await handleAddAcademicData('department', { name: newDeptName });
    if (success) {
      setOpenAddDeptModal(false);
      setNewDeptName('');
    }
  };

  // Handles adding a 'Course' (which is a backend 'Subject')
  const handleSubmitCourseSingle = async () => {
    if (!newCourseNameSingle || !newCourseDeptSingle) return;
    const success = await handleAddAcademicData('subject', { name: newCourseNameSingle, department: newCourseDeptSingle });
    if (success) {
      setOpenAddCourseSingleModal(false);
      setNewCourseNameSingle('');
      setNewCourseDeptSingle('');
    }
  };

  // Handles adding a 'Subject (with Course Code)' (which is a backend 'Course')
  const handleSubmitSubjectSingle = async () => {
    if (!newSubjectCodeSingle || !newSubjectCourseSingle) return;
    const success = await handleAddAcademicData('course', { name: newSubjectCodeSingle, subject: newSubjectCourseSingle });
    if (success) {
      setOpenAddSubjectSingleModal(false);
      setNewSubjectCodeSingle('');
      setNewSubjectCourseSingle('');
      setSelectedDepartmentForSubjectSingle(''); // Reset department selection
    }
  };

  const handleSubmitSection = async () => {
    if (!newSectionName) return;
    const success = await handleAddAcademicData('section', { name: newSectionName, students: newSectionStudents });
    if (success) {
      setOpenAddSectionModal(false);
      setNewSectionName('');
      setNewSectionStudents([]);
    }
  };


  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // --- Bulk User Upload Handlers ---
  const handleOpenBulkUploadModal = () => {
    setOpenBulkUploadModal(true);
    setSelectedBulkFile(null);
    setParsedTableHeaders([]);
    setParsedTableData([]);
    setBulkUploadError('');
  };

  const handleCloseBulkUploadModal = () => {
    setOpenBulkUploadModal(false);
    setSelectedBulkFile(null);
    setParsedTableHeaders([]);
    setParsedTableData([]);
    setBulkUploadError('');
  };

  const handleBulkFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedBulkFile(file);
    setParsedTableHeaders([]);
    setParsedTableData([]);
    setBulkUploadError('');

    if (file) {
      if (file.type !== 'text/csv') {
        setBulkUploadError('Invalid file type. Please upload a CSV file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          const lines = text.split('\n').filter(line => line.trim() !== ''); // Filter out empty lines
          if (lines.length === 0) {
            setBulkUploadError('CSV file is empty.');
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim());
          // Validate required headers
          const requiredHeaders = ['username', 'email', 'password'];
          const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
          if (missingHeaders.length > 0) {
              setBulkUploadError(`Missing required CSV headers: ${missingHeaders.join(', ')}. Please ensure 'username', 'email', 'password' are present.`);
              return;
          }

          const data = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length !== headers.length) {
                // Skip malformed rows but log a warning if needed
                console.warn(`Skipping malformed row ${i + 1}: column count mismatch.`);
                continue;
            }
            const rowObject = {};
            headers.forEach((header, index) => {
              rowObject[header] = values[index];
            });
            data.push(rowObject);
          }

          setParsedTableHeaders(headers);
          setParsedTableData(data);
          if (data.length === 0) {
              setBulkUploadError('No valid data rows found in CSV after headers.');
          }

        } catch (parseError) {
          console.error('Error parsing CSV:', parseError);
          setBulkUploadError('Error parsing CSV file. Please check file format.');
        }
      };
      reader.onerror = () => {
        setBulkUploadError('Failed to read file.');
      };
      reader.readAsText(file);
    }
  };

  const handleBulkUploadSubmit = async () => {
    if (!parsedTableData || parsedTableData.length === 0) {
      setBulkUploadError('No user data parsed from the file to upload.');
      return;
    }

    // Map parsed CSV data to the format expected by the backend
    const usersToUpload = parsedTableData.map(row => ({
      username: row.username,
      email: row.email,
      password: row.password,
      // Default role to 'student' if not provided in CSV or if role column is missing
      role: row.role && ['student', 'teacher', 'admin'].includes(row.role.toLowerCase()) ? row.role.toLowerCase() : 'student',
      // Include section if present in CSV
      section: row.section ? row.section.trim() : undefined,
    }));

    setBulkUploadLoading(true);
    setBulkUploadError('');

    try {
      const response = await fetch('https://quark-server-4py2.onrender.com/api/auth/users/bulk-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ users: usersToUpload }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage(`Bulk upload completed: ${data.successful} users added, ${data.failed} failed.`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        handleCloseBulkUploadModal();
        fetchUsers(); // Refresh user list
        fetchLogs(); // Refresh logs
      } else {
        setBulkUploadError(data.message || 'Bulk upload failed.');
        setSnackbarMessage(`Bulk upload failed: ${data.message || 'Unknown error'}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error during bulk upload:', err);
      setBulkUploadError('Network error or invalid data format sent to server.');
      setSnackbarMessage('Network error during bulk upload.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setBulkUploadLoading(false);
    }
  };

  // --- Bulk Academic Data Handlers ---
  const handleOpenBulkAcademicModal = () => {
    setOpenBulkAcademicModal(true);
    setNewBulkDepartmentId('');
    setSelectedParentCourseId(''); // Reset selected parent course
    setNewSubjectCodesInput(['']); // Reset new subject codes input
    setBulkAcademicEntries([]);
    setShowAcademicReview(false);
    setAcademicBulkUploadError('');
    setAcademicBulkUploadResults(null);
  };

  const handleCloseBulkAcademicModal = () => {
    setOpenBulkAcademicModal(false);
    setNewBulkDepartmentId('');
    setSelectedParentCourseId(''); // Reset selected parent course
    setNewSubjectCodesInput(['']); // Reset new subject codes input
    setBulkAcademicEntries([]);
    setShowAcademicReview(false);
    setAcademicBulkUploadError('');
    setAcademicBulkUploadResults(null);
  };

  const handleAddSubjectCodeField = () => {
    setNewSubjectCodesInput([...newSubjectCodesInput, '']);
  };

  const handleSubjectCodeChange = (index, value) => {
    const updatedCodes = [...newSubjectCodesInput];
    updatedCodes[index] = value;
    setNewSubjectCodesInput(updatedCodes);
  };

  const handleRemoveSubjectCodeField = (index) => {
    const updatedCodes = newSubjectCodesInput.filter((_, i) => i !== index);
    setNewSubjectCodesInput(updatedCodes);
  };

  const handleAddSubjectCodesToBulkList = () => {
    if (!selectedParentCourseId) {
        setAcademicBulkUploadError('Please select a Course.');
        return;
    }
    const validSubjectCodes = newSubjectCodesInput.filter(code => code.trim() !== '');
    if (validSubjectCodes.length === 0) {
        setAcademicBulkUploadError('Please add at least one Subject (with Subject Code).');
        return;
    }

    const newEntries = validSubjectCodes.map(code => ({
        name: code.trim(), // This will be Course.name (UI: Subject (with Subject Code))
        subject: selectedParentCourseId, // This will be Course.subject (linking to Subject._id, UI: Course)
    }));

    setBulkAcademicEntries(prevEntries => [...prevEntries, ...newEntries]);
    setNewSubjectCodesInput(['']); // Reset input fields
    // Keep selectedParentCourseId so user can add more to the same course
    setAcademicBulkUploadError('');
  };

  const handleRemoveAcademicEntry = (index) => {
    const updatedEntries = bulkAcademicEntries.filter((_, i) => i !== index);
    setBulkAcademicEntries(updatedEntries);
  };

  const handleConfirmAcademicUpload = async () => {
    if (bulkAcademicEntries.length === 0) {
        setAcademicBulkUploadError('No subjects added for upload.');
        return;
    }

    setAcademicBulkUploadLoading(true);
    setAcademicBulkUploadError('');
    setAcademicBulkUploadResults(null);

    let successfulCount = 0;
    let failedCount = 0;
    const failedDetails = [];

    // Loop through each entry and send an individual 'add course' request
    for (const entry of bulkAcademicEntries) {
        try {
            // Changed type from 'bulk_subjects_courses' to 'course' as each entry is a single Course (backend model)
            // The 'course' type corresponds to the backend Course model which represents a Subject (with Code)
            const success = await handleAddAcademicData('course', { name: entry.name, subject: entry.subject });
            if (success) {
                successfulCount++;
            } else {
                failedCount++;
                // If handleAddAcademicData returns false (failed but no network error)
                failedDetails.push({ entry: entry, reason: `Failed to add ${entry.name}.` });
            }
        } catch (err) {
            console.error(`Error adding subject ${entry.name}:`, err);
            failedCount++;
            failedDetails.push({ entry: entry, reason: err.message || 'Network or unknown error' });
        }
    }

    setAcademicBulkUploadResults({
        successful: successfulCount,
        failed: failedCount,
        details: failedDetails,
    });

    if (failedCount > 0) {
        setSnackbarMessage(`Bulk academic upload completed with errors: ${successfulCount} successful, ${failedCount} failed.`);
        setSnackbarSeverity('warning');
    } else {
        setSnackbarMessage(`Bulk academic upload completed successfully: ${successfulCount} items added.`);
        setSnackbarSeverity('success');
    }
    setSnackbarOpen(true);
    fetchAcademicData(); // Refresh academic data after upload
    setAcademicBulkUploadLoading(false);
  };


  const getDepartmentNameById = (deptId) => {
    const dept = departments.find(d => d._id === deptId);
    return dept ? dept.name : 'Unknown Department';
  };

  // Helper to get backend Subject Name (now conceptually a 'Course') by its ID
  const getCourseNameBySubjectId = (subjectId) => {
    const subj = subjects.find(s => s._id === subjectId);
    return subj ? subj.name : 'N/A';
  };


  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'primary.dark', fontWeight: 'bold', mb: 4 }}>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* User Management Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={4} sx={{ p: 3, minHeight: 400, display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'secondary.dark', fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider', pb: 1, mb: 2 }}>
              User Management
            </Typography>
            {loadingUsers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : users.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No users found.</Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflowY: 'auto', flexGrow: 1, mb: 2 }}>
                {users.map((u) => (
                  <Box key={u._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #eee', py: 1.5, '&:last-child': { borderBottom: 'none' } }}>
                    <Typography variant="body1" sx={{ color: 'text.primary' }}>
                      <Box component="span" sx={{ fontWeight: 'medium' }}>{u.username}</Box> ({u.email}) - <Chip label={u.role} size="small" color={u.role === 'admin' ? 'error' : u.role === 'teacher' ? 'primary' : 'default'} sx={{ textTransform: 'capitalize' }} />
                    </Typography>
                    <Button size="small" variant="outlined" onClick={() => handleOpenRoleModal(u)} sx={{ borderRadius: 2 }}>
                      Change Role
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto', pt: 2, borderTop: '1px solid #eee' }}>
                <Button variant="contained" color="primary" sx={{ px: 3, py: 1 }} onClick={fetchUsers}>
                    Refresh Users
                </Button>
                <Button variant="outlined" color="secondary" sx={{ px: 3, py: 1 }} onClick={handleOpenBulkUploadModal}>
                    Bulk Upload Users
                </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Audit Logs Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={4} sx={{ p: 3, minHeight: 400, display: 'flex', flexDirection: 'column', borderRadius: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'secondary.dark', fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider', pb: 1, mb: 2 }}>
              Audit Logs
            </Typography>
            {loadingLogs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : logs.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No audit logs found.</Typography>
            ) : (
              <Box sx={{ maxHeight: 300, overflowY: 'auto', flexGrow: 1, mb: 2 }}>
                {logs.map((log) => (
                  <Box key={log._id} sx={{ borderBottom: '1px dashed #eee', py: 1.5, '&:last-child': { borderBottom: 'none' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      {new Date(log.timestamp).toLocaleString()} - <Chip label={log.action.replace(/_/g, ' ')} size="small" variant="outlined" color="info" />
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      User: <Box component="span" sx={{ fontWeight: 'medium' }}>{log.userId?.username || 'N/A'}</Box> | IP: {log.ipAddress}
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mt: 0.5 }}>{log.details}</Typography>
                  </Box>
                ))}
              </Box>
            )}
            <Button variant="contained" color="primary" sx={{ mt: 'auto', alignSelf: 'flex-start', px: 3, py: 1 }} onClick={fetchLogs}>
              Refresh Logs
            </Button>
          </Paper>
        </Grid>

        {/* Academic Data Management Section */}
        <Grid item xs={12}>
          <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'secondary.dark', fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider', pb: 1, mb: 2 }}>
              Academic Data Management
            </Typography>
            {loadingAcademicData ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 150 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : academicDataError ? (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {academicDataError}
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {/* Department Card */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 2, border: '1px solid #ddd' }}>
                    <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>Departments</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}>{departments.length}</Typography>
                    <Box sx={{ maxHeight: 80, overflowY: 'auto', mb: 1, p: 0.5, backgroundColor: 'background.default', borderRadius: 1 }}>
                      {departments.map(d => <Typography key={d._id} variant="body2" color="text.secondary">{d.name}</Typography>)}
                    </Box>
                    <Button variant="contained" size="small" fullWidth onClick={() => setOpenAddDeptModal(true)} sx={{ mt: 'auto', borderRadius: 2 }}>
                      Add Department
                    </Button>
                  </Paper>
                </Grid>
                {/* Courses Card (was Subject) */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 2, border: '1px solid #ddd' }}>
                    <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>Courses</Typography> {/* Renamed from Subjects */}
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}>{subjects.length}</Typography> {/* Still uses 'subjects' state for backend Subjects */}
                    <Box sx={{ maxHeight: 80, overflowY: 'auto', mb: 1, p: 0.5, backgroundColor: 'background.default', borderRadius: 1 }}>
                      {subjects.map(s => <Typography key={s._id} variant="body2" color="text.secondary">{s.name} ({s.department?.name || 'N/A'})</Typography>)}
                    </Box>
                    <Button variant="contained" size="small" fullWidth onClick={() => setOpenAddCourseSingleModal(true)} disabled={departments.length === 0} sx={{ mt: 'auto', borderRadius: 2 }}> {/* Calls new modal state */}
                      Add Course
                    </Button>
                    {departments.length === 0 && <Typography variant="caption" color="error" sx={{ textAlign: 'center', mt: 0.5 }}>Add a Department first</Typography>}
                  </Paper>
                </Grid>
                {/* Subjects (with Course Code) Card (was Courses) */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 2, border: '1px solid #ddd' }}>
                    <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>Subjects (with Course Code)</Typography> {/* Renamed from Courses */}
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}>{courses.length}</Typography> {/* Still uses 'courses' state for backend Courses */}
                    <Box sx={{ maxHeight: 80, overflowY: 'auto', mb: 1, p: 0.5, backgroundColor: 'background.default', borderRadius: 1 }}>
                      {courses.map(c => <Typography key={c._id} variant="body2" color="text.secondary">{c.name} ({getCourseNameBySubjectId(c.subject?._id)})</Typography>)} {/* Use helper for new Course Name */}
                    </Box>
                    <Button variant="contained" size="small" fullWidth onClick={() => setOpenAddSubjectSingleModal(true)} disabled={subjects.length === 0} sx={{ mt: 'auto', borderRadius: 2 }}> {/* Calls new modal state */}
                      Add Subject
                    </Button>
                    {subjects.length === 0 && <Typography variant="caption" color="error" sx={{ textAlign: 'center', mt: 0.5 }}>Add a Course first</Typography>} {/* Text adjusted */}
                  </Paper>
                </Grid>
                {/* Section Card */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 2, border: '1px solid #ddd' }}>
                    <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>Sections</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2 }}>{sections.length}</Typography>
                    <Box sx={{ maxHeight: 80, overflowY: 'auto', mb: 1, p: 0.5, backgroundColor: 'background.default', borderRadius: 1 }}>
                      {sections.map(sec => <Typography key={sec._id} variant="body2" color="text.secondary">{sec.name} ({sec.students.length} students)</Typography>)}
                    </Box>
                    <Button variant="contained" size="small" fullWidth onClick={() => setOpenAddSectionModal(true)} disabled={users.length === 0} sx={{ mt: 'auto', borderRadius: 2 }}>
                      Add Section
                    </Button>
                    {users.length === 0 && <Typography variant="caption" color="error" sx={{ textAlign: 'center', mt: 0.5 }}>Add Users first</Typography>}
                  </Paper>
                </Grid>
              </Grid>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="outlined" color="primary" sx={{ px: 3, py: 1, mr: 2 }} onClick={fetchAcademicData}>
                Refresh Academic Data
              </Button>
              <Button variant="contained" color="secondary" sx={{ px: 3, py: 1 }} onClick={handleOpenBulkAcademicModal}>
                Bulk Add Courses/Subjects
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%', borderRadius: 2 }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Role Assignment Modal */}
      <Modal
        aria-labelledby="role-modal-title"
        aria-describedby="role-modal-description"
        open={openRoleModal}
        onClose={handleCloseRoleModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openRoleModal}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4,
          }}>
            <Typography id="role-modal-title" variant="h6" component="h2" gutterBottom sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
              Change Role for {selectedUser?.username}
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel id="new-role-label">New Role</InputLabel>
              <Select
                labelId="new-role-label"
                id="new-role-select"
                value={newRole}
                label="New Role"
                onChange={(e) => setNewRole(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button onClick={handleCloseRoleModal} sx={{ mr: 2 }}>Cancel</Button>
              <Button variant="contained" onClick={handleAssignRole}>Assign Role</Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Add Department Modal */}
      <Modal
        aria-labelledby="add-dept-modal-title"
        open={openAddDeptModal}
        onClose={() => setOpenAddDeptModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openAddDeptModal}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4,
          }}>
            <Typography id="add-dept-modal-title" variant="h6" component="h2" gutterBottom sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
              Add New Department
            </Typography>
            <TextField
              label="Department Name"
              fullWidth
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              margin="normal"
              required
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button onClick={() => setOpenAddDeptModal(false)} sx={{ mr: 2 }}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmitDepartment}>Add Department</Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Add Course Modal (was Add Subject) */}
      <Modal
        aria-labelledby="add-course-modal-title"
        open={openAddCourseSingleModal}
        onClose={() => setOpenAddCourseSingleModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openAddCourseSingleModal}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4,
          }}>
            <Typography id="add-course-modal-title" variant="h6" component="h2" gutterBottom sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
              Add New Course
            </Typography>
            <TextField
              label="Course Name" /* Changed label */
              fullWidth
              value={newCourseNameSingle}
              onChange={(e) => setNewCourseNameSingle(e.target.value)}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="select-dept-label">Department</InputLabel>
              <Select
                labelId="select-dept-label"
                value={newCourseDeptSingle}
                label="Department"
                onChange={(e) => setNewCourseDeptSingle(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button onClick={() => setOpenAddCourseSingleModal(false)} sx={{ mr: 2 }}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmitCourseSingle}>Add Course</Button> {/* Calls new handler */}
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Add Subject (with Course Code) Modal (was Add Course) */}
      <Modal
        aria-labelledby="add-subject-modal-title"
        open={openAddSubjectSingleModal}
        onClose={() => {
          setOpenAddSubjectSingleModal(false);
          setSelectedDepartmentForSubjectSingle(''); // Reset department selection on close
          setNewSubjectCodeSingle('');
          setNewSubjectCourseSingle('');
        }}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openAddSubjectSingleModal}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4,
          }}>
            <Typography id="add-subject-modal-title" variant="h6" component="h2" gutterBottom sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
              Add New Subject (with Course Code)
            </Typography>
            {/* Department Dropdown for filtering Courses (Subjects from backend) */}
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="select-dept-for-subject-label">Department</InputLabel>
              <Select
                labelId="select-dept-for-subject-label"
                value={selectedDepartmentForSubjectSingle}
                label="Department"
                onChange={(e) => {
                  setSelectedDepartmentForSubjectSingle(e.target.value);
                  setNewSubjectCourseSingle(''); // Clear selected course when department changes
                }}
                sx={{ borderRadius: 2 }}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Subject Code (e.g., ECE24304)" /* Changed label */
              fullWidth
              value={newSubjectCodeSingle}
              onChange={(e) => setNewSubjectCodeSingle(e.target.value)}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="select-course-label">Course</InputLabel> {/* Changed label */}
              <Select
                labelId="select-course-label"
                value={newSubjectCourseSingle}
                label="Course" /* Changed label */
                onChange={(e) => setNewSubjectCourseSingle(e.target.value)}
                sx={{ borderRadius: 2 }}
                disabled={!selectedDepartmentForSubjectSingle} // Disable until department is selected
              >
                {subjects
                  .filter(sub => sub.department?._id === selectedDepartmentForSubjectSingle) // Corrected filter here
                  .map((sub) => ( /* Still maps over 'subjects' state (backend subjects) */
                    <MenuItem key={sub._id} value={sub._id}>
                      {sub.name}
                    </MenuItem>
                  ))}
              </Select>
              {!selectedDepartmentForSubjectSingle && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>Select a Department first to see Courses.</Typography>
              )}
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button onClick={() => {
                setOpenAddSubjectSingleModal(false);
                setSelectedDepartmentForSubjectSingle('');
                setNewSubjectCodeSingle('');
                setNewSubjectCourseSingle('');
              }} sx={{ mr: 2 }}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmitSubjectSingle}>Add Subject</Button> {/* Calls new handler */}
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Add Section Modal */}
      <Modal
        aria-labelledby="add-section-modal-title"
        open={openAddSectionModal}
        onClose={() => setOpenAddSectionModal(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openAddSectionModal}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4,
          }}>
            <Typography id="add-section-modal-title" variant="h6" component="h2" gutterBottom sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
              Add New Section
            </Typography>
            <TextField
              label="Section Name (e.g., CS101A, Fall2023_Sec1)"
              fullWidth
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="select-students-label">Assign Students (Optional)</InputLabel>
              <Select
                labelId="select-students-label"
                multiple
                value={newSectionStudents}
                onChange={(e) => setNewSectionStudents(e.target.value)}
                renderValue={(selected) => selected.map(id => users.find(u => u._id === id)?.username || id).join(', ')}
                label="Assign Students (Optional)"
                sx={{ borderRadius: 2 }}
              >
                {users.filter(u => u.role === 'student').map((s) => ( // Only list students
                  <MenuItem key={s._id} value={s._id}>
                    {s.username} ({s.email})
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Select students to include in this section.
              </Typography>
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button onClick={() => setOpenAddSectionModal(false)} sx={{ mr: 2 }}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmitSection}>Add Section</Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Bulk User Upload Modal */}
      <Modal
        aria-labelledby="bulk-upload-modal-title"
        open={openBulkUploadModal}
        onClose={handleCloseBulkUploadModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openBulkUploadModal}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 600, md: 700 }, // Wider for table preview
            bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4,
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <Typography id="bulk-upload-modal-title" variant="h6" component="h2" gutterBottom sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
              Bulk Upload Users (CSV)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a CSV file with `username`, `email`, `password`, `role` (optional), and `section` (optional) columns.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Example CSV content:
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: theme => theme.palette.grey[100], overflowX: 'auto' }}>
                <pre style={{ margin: 0, fontSize: '0.8rem', color: theme => theme.palette.grey[800] }}>
{`username,email,password,role,section
john.doe,john@example.com,Password123,student,SectionA
jane.smith,jane@example.com,SecurePass456,teacher,
mike.jones,mike@example.com,MikePass789,student,SectionB`}
                </pre>
            </Paper>

            <Box sx={{ mb: 2 }}>
                <InputLabel shrink htmlFor="bulk-user-file-upload">Select CSV File</InputLabel>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkFileChange}
                    id="bulk-user-file-upload"
                    style={{ display: 'block', marginTop: '8px' }}
                />
                {selectedBulkFile && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        Selected: {selectedBulkFile.name} ({(selectedBulkFile.size / 1024).toFixed(2)} KB)
                    </Typography>
                )}
            </Box>

            {bulkUploadError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {bulkUploadError}
              </Alert>
            )}

            {parsedTableData.length > 0 && !bulkUploadError && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main' }}>
                  Preview ({parsedTableData.length} rows loaded):
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #eee', borderRadius: 2 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {parsedTableHeaders.map((header) => (
                          <TableCell key={header} sx={{ fontWeight: 'bold', bgcolor: theme => theme.palette.grey[200] }}>{header}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parsedTableData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {parsedTableHeaders.map((header) => (
                            <TableCell key={`${rowIndex}-${header}`}>{row[header] || ''}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button onClick={handleCloseBulkUploadModal} sx={{ mr: 2 }}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleBulkUploadSubmit}
                disabled={bulkUploadLoading || !!bulkUploadError || parsedTableData.length === 0}
              >
                {bulkUploadLoading ? <CircularProgress size={24} color="inherit" /> : 'Upload Users'}
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Bulk Academic Data Upload Modal */}
      <Modal
        aria-labelledby="bulk-academic-modal-title"
        open={openBulkAcademicModal}
        onClose={handleCloseBulkAcademicModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openBulkAcademicModal}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 600, md: 700 }, // Wider for review table
            bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4,
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <Typography id="bulk-academic-modal-title" variant="h6" component="h2" gutterBottom sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
              Bulk Add Subjects (with Course Codes) {/* Updated title */}
            </Typography>

            {!showAcademicReview ? (
                // Input Form
                <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Select a department, then a course, and add multiple subjects with their course codes.
                    </Typography>
                    <FormControl fullWidth margin="normal" required sx={{ mb: 2 }}>
                        <InputLabel id="select-bulk-dept-label">Department</InputLabel>
                        <Select
                            labelId="select-bulk-dept-label"
                            value={newBulkDepartmentId}
                            label="Department"
                            onChange={(e) => {
                                setNewBulkDepartmentId(e.target.value);
                                setSelectedParentCourseId(''); // Reset selected course when department changes
                                setNewSubjectCodesInput(['']); // Reset subject codes input
                                setAcademicBulkUploadError(''); // Clear error
                            }}
                            sx={{ borderRadius: 2 }}
                            disabled={departments.length === 0}
                        >
                            {departments.length === 0 ? (
                                <MenuItem disabled value="">No departments available. Add via Admin Dashboard.</MenuItem>
                            ) : (
                                departments.map((dept) => (
                                    <MenuItem key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                        {departments.length === 0 && <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>Please add at least one Department first.</Typography>}
                    </FormControl>

                    {/* New: Select Existing Course (Backend Subject) */}
                    <FormControl fullWidth margin="normal" required sx={{ mb: 2 }}>
                        <InputLabel id="select-parent-course-label">Select Course</InputLabel>
                        <Select
                            labelId="select-parent-course-label"
                            value={selectedParentCourseId}
                            label="Select Course"
                            onChange={(e) => {
                                setSelectedParentCourseId(e.target.value);
                                setNewSubjectCodesInput(['']); // Reset subject codes when course changes
                                setAcademicBulkUploadError(''); // Clear error
                            }}
                            sx={{ borderRadius: 2 }}
                            disabled={!newBulkDepartmentId}
                        >
                            {subjects // These are backend 'Subject' records, which are 'Courses' in UI
                                .filter(s => s.department?._id === newBulkDepartmentId) // Corrected filter here
                                .map((sub) => (
                                    <MenuItem key={sub._id} value={sub._id}>
                                        {sub.name}
                                    </MenuItem>
                                ))}
                        </Select>
                        {!newBulkDepartmentId && <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>Select a Department first to see Courses.</Typography>}
                        {newBulkDepartmentId && subjects.filter(s => s.department?._id === newBulkDepartmentId).length === 0 && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>No Courses found for this Department. Add via "Add Course" first.</Typography>
                        )}
                    </FormControl>


                    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: theme => theme.palette.grey[50], borderRadius: 2 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Add Subject (with Course Code)</Typography> {/* Updated text */}

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>Subjects (with Subject Code):</Typography> {/* Updated label */}
                        {newSubjectCodesInput.map((code, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TextField
                                    label={`Subject (with Subject Code) ${index + 1}`}
                                    fullWidth
                                    value={code}
                                    onChange={(e) => handleSubjectCodeChange(index, e.target.value)}
                                    size="small"
                                    required
                                />
                                {newSubjectCodesInput.length > 1 && (
                                    <IconButton onClick={() => handleRemoveSubjectCodeField(index)} color="error" sx={{ ml: 1 }}>
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </Box>
                        ))}
                        <Button
                            variant="outlined"
                            startIcon={<AddCircleOutlineIcon />}
                            onClick={handleAddSubjectCodeField}
                            sx={{ mt: 1, mb: 2 }}
                        >
                            Add More Subject (with Code)
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleAddSubjectCodesToBulkList}
                            disabled={!selectedParentCourseId || newSubjectCodesInput.filter(c => c.trim() !== '').length === 0}
                        >
                            Add Subjects to List
                        </Button>
                    </Paper>

                    {academicBulkUploadError && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                            {academicBulkUploadError}
                        </Alert>
                    )}

                    {bulkAcademicEntries.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main' }}>
                                Entries to be Uploaded:
                            </Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #eee', borderRadius: 2 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: theme => theme.palette.grey[200] }}>Course Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: theme => theme.palette.grey[200] }}>Subject (with Course Code)</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', bgcolor: theme => theme.palette.grey[200] }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {bulkAcademicEntries.map((entry, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{getCourseNameBySubjectId(entry.subject)}</TableCell> {/* Display parent course name */}
                                                <TableCell>{entry.name}</TableCell> {/* Display new subject code */}
                                                <TableCell>
                                                    <IconButton onClick={() => handleRemoveAcademicEntry(index)} color="error" size="small">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button onClick={handleCloseBulkAcademicModal} sx={{ mr: 2 }}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={() => setShowAcademicReview(true)}
                            disabled={bulkAcademicEntries.length === 0}
                        >
                            Review & Upload
                        </Button>
                    </Box>
                </>
            ) : (
                // Review Section
                <>
                    <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                        Please review the academic data before final upload.
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Department: {getDepartmentNameById(newBulkDepartmentId)}
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 2, mb: 3 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme => theme.palette.grey[200] }}>Course Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme => theme.palette.grey[200] }}>Subjects (with Course Code)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bulkAcademicEntries.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {getCourseNameBySubjectId(entry.subject)} ({getDepartmentNameById(newBulkDepartmentId)})
                                        </TableCell>
                                        <TableCell>
                                            <List dense>
                                                <ListItem disablePadding>
                                                    <ListItemText primary={`- ${entry.name}`} />
                                                </ListItem>
                                            </List>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {academicBulkUploadResults && (
                        <Alert severity={academicBulkUploadResults.failed > 0 ? 'warning' : 'success'} sx={{ mb: 2, borderRadius: 2 }}>
                            Upload Summary: {academicBulkUploadResults.successful} successful, {academicBulkUploadResults.failed} failed.
                            {academicBulkUploadResults.failed > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Failed Details:</Typography>
                                    <List dense sx={{ maxHeight: 100, overflowY: 'auto' }}>
                                        {academicBulkUploadResults.details?.map((fail, idx) => {
                                            const failedItemName = `${fail.entry.name} (for Course: ${getCourseNameBySubjectId(fail.entry.subject)})`;
                                            return (
                                                <ListItem key={idx} disablePadding>
                                                    <ListItemText primary={`- ${failedItemName}: ${fail.reason}`} />
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                </Box>
                            )}
                        </Alert>
                    )}
                    {academicBulkUploadError && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                            {academicBulkUploadError}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button onClick={() => setShowAcademicReview(false)} sx={{ mr: 2 }}>Back to Edit</Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleConfirmAcademicUpload}
                            disabled={academicBulkUploadLoading}
                        >
                            {academicBulkUploadLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Upload'}
                        </Button>
                    </Box>
                </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default AdminDashboard;
