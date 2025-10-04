import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Grid,
    Card,
    CardContent
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineOppositeContent,
    TimelineDot
} from '@mui/lab';
import {
    UploadFile as UploadIcon,
    MedicalServices as MedicalIcon,
    Description as ReportIcon,
    LocalHospital as HospitalIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const MedicalHistory = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [medicalHistory, setMedicalHistory] = useState([]);
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadDescription, setUploadDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMedicalHistory();
    }, []);

    const fetchMedicalHistory = async () => {
        try {
            const response = await fetch(`${API_URL}/api/appointments/my-appointments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                const appointments = data.data.appointments;
                setAppointments(appointments);

                // Transform appointments into timeline format
                const timelineData = appointments
                    .filter(apt => apt.status === 'completed')
                    .map(apt => ({
                        id: apt._id,
                        date: new Date(apt.dateTime),
                        type: 'appointment',
                        title: `Appointment with Dr. ${apt.doctor.name}`,
                        description: apt.diagnosis || 'Medical consultation',
                        details: {
                            symptoms: apt.symptoms,
                            diagnosis: apt.diagnosis,
                            prescription: apt.prescription,
                            notes: apt.notes,
                            doctor: apt.doctor.name,
                            specialization: apt.doctor.specialization
                        }
                    }))
                    .sort((a, b) => b.date - a.date);

                setMedicalHistory(timelineData);
            }
        } catch (error) {
            console.error('Error fetching medical history:', error);
            setError('Failed to load medical history');
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('description', uploadDescription);

        try {
            const response = await fetch(`${API_URL}/api/medical-records/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Medical report uploaded successfully');
                setOpenUploadDialog(false);
                setSelectedFile(null);
                setUploadDescription('');
                fetchMedicalHistory(); // Refresh the timeline
            } else {
                setError(data.message || 'Failed to upload report');
            }
        } catch (error) {
            setError('An error occurred while uploading the report');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Check file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                setError('Please select a PDF or image file (JPEG, PNG)');
                return;
            }

            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }

            setSelectedFile(file);
            setError('');
        }
    };

    const getTimelineIcon = (type) => {
        switch (type) {
            case 'appointment':
                return <MedicalIcon />;
            case 'report':
                return <ReportIcon />;
            default:
                return <HospitalIcon />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled':
                return 'primary';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    if (user?.role !== 'patient') {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error">
                    Access denied. This page is only available to patients.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4">
                    Medical History
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setOpenUploadDialog(true)}
                >
                    Upload Report
                </Button>
            </Box>

            {/* Success/Error Messages */}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Medical History Timeline */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Your Medical Timeline
                </Typography>

                {medicalHistory.length > 0 ? (
                    <Timeline position="alternate">
                        {medicalHistory.map((item, index) => (
                            <TimelineItem key={item.id}>
                                <TimelineOppositeContent
                                    sx={{ m: 'auto 0' }}
                                    align="right"
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {item.date.toLocaleDateString()}
                                    <br />
                                    {item.date.toLocaleTimeString()}
                                </TimelineOppositeContent>
                                <TimelineSeparator>
                                    <TimelineConnector />
                                    <TimelineDot color="primary">
                                        {getTimelineIcon(item.type)}
                                    </TimelineDot>
                                    <TimelineConnector />
                                </TimelineSeparator>
                                <TimelineContent sx={{ py: '12px', px: 2 }}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" component="h2">
                                                {item.title}
                                            </Typography>
                                            <Typography color="textSecondary" gutterBottom>
                                                {item.description}
                                            </Typography>

                                            {item.type === 'appointment' && item.details && (
                                                <Box sx={{ mt: 2 }}>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12} sm={6}>
                                                            <Typography variant="body2">
                                                                <strong>Doctor:</strong> Dr. {item.details.doctor}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                <strong>Specialization:</strong> {item.details.specialization}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6}>
                                                            <Typography variant="body2">
                                                                <strong>Symptoms:</strong> {item.details.symptoms || 'Not specified'}
                                                            </Typography>
                                                        </Grid>
                                                        {item.details.diagnosis && (
                                                            <Grid item xs={12}>
                                                                <Typography variant="body2">
                                                                    <strong>Diagnosis:</strong> {item.details.diagnosis}
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                        {item.details.prescription && (
                                                            <Grid item xs={12}>
                                                                <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 1 }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                                        Prescription:
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                                        {item.details.prescription}
                                                                    </Typography>
                                                                </Paper>
                                                            </Grid>
                                                        )}
                                                        {item.details.notes && (
                                                            <Grid item xs={12}>
                                                                <Typography variant="body2">
                                                                    <strong>Notes:</strong> {item.details.notes}
                                                                </Typography>
                                                            </Grid>
                                                        )}
                                                    </Grid>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                    </Timeline>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <MedicalIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary">
                            No medical history available
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Your completed appointments and uploaded reports will appear here.
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Upload Report Dialog */}
            <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Upload Medical Report</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <input
                            accept=".pdf,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            id="file-upload"
                            type="file"
                            onChange={handleFileSelect}
                        />
                        <label htmlFor="file-upload">
                            <Button
                                variant="outlined"
                                component="span"
                                startIcon={<CloudUploadIcon />}
                                fullWidth
                                sx={{ mb: 2 }}
                            >
                                Select File (PDF or Image)
                            </Button>
                        </label>

                        {selectedFile && (
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </Typography>
                        )}

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description (Optional)"
                            value={uploadDescription}
                            onChange={(e) => setUploadDescription(e.target.value)}
                            placeholder="Describe what this report contains..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleFileUpload}
                        variant="contained"
                        disabled={!selectedFile || loading}
                    >
                        {loading ? 'Uploading...' : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default MedicalHistory;
