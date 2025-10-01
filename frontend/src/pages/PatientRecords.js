import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Box,
    Tab,
    Tabs,
    List,
    ListItem,
    Divider,
    Grid,
    Card,
    CardContent
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const PatientRecords = () => {
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientAppointments, setPatientAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [openRecordsDialog, setOpenRecordsDialog] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [updateData, setUpdateData] = useState({
        diagnosis: '',
        prescription: '',
        notes: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tabValue, setTabValue] = useState(0);

    const fetchPatients = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/doctors/${user._id}/patients`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setPatients(data.data.patients);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
            setError('Failed to load patients');
        }
    };

    useEffect(() => {
        if (user?.role === 'doctor') {
            fetchPatients();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchPatientAppointments = async (patientId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/appointments/patient/${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setPatientAppointments(data.data.appointments);
            }
        } catch (error) {
            console.error('Error fetching patient appointments:', error);
            setError('Failed to load patient appointments');
        }
    };

    const handleViewRecords = (patient) => {
        setSelectedPatient(patient);
        fetchPatientAppointments(patient._id);
        setOpenRecordsDialog(true);
    };

    const handleUpdateAppointment = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/appointments/${selectedAppointment._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Appointment updated successfully');
                fetchPatientAppointments(selectedPatient._id);
                setOpenUpdateDialog(false);
                setUpdateData({ diagnosis: '', prescription: '', notes: '' });
            } else {
                setError(data.message || 'Failed to update appointment');
            }
        } catch (error) {
            setError('An error occurred while updating the appointment');
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

    const filteredAppointments = patientAppointments.filter(appointment => {
        if (tabValue === 0) return true; // All appointments
        if (tabValue === 1) return appointment.status === 'completed';
        if (tabValue === 2) return appointment.status === 'scheduled';
        return true;
    });

    if (user?.role !== 'doctor') {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error">
                    Access denied. This page is only available to doctors.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Patient Records
            </Typography>

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

            {/* Patients List */}
            <Grid container spacing={3}>
                {patients.map((patient) => (
                    <Grid item key={patient._id} xs={12} sm={6} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {patient.name}
                                </Typography>
                                <Typography color="textSecondary" gutterBottom>
                                    {patient.email}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Phone: {patient.phone || 'Not provided'}
                                </Typography>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    onClick={() => handleViewRecords(patient)}
                                >
                                    View Records
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Patient Records Dialog */}
            <Dialog open={openRecordsDialog} onClose={() => setOpenRecordsDialog(false)} maxWidth="lg" fullWidth>
                <DialogTitle>
                    Patient Records - {selectedPatient?.name}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedPatient && (
                        <>
                            {/* Patient Info */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Patient Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography><strong>Email:</strong> {selectedPatient.email}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography><strong>Phone:</strong> {selectedPatient.phone || 'Not provided'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography><strong>Date of Birth:</strong> {
                                            selectedPatient.dateOfBirth
                                                ? new Date(selectedPatient.dateOfBirth).toLocaleDateString()
                                                : 'Not provided'
                                        }</Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            {/* Appointments Tabs */}
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                                    <Tab label="All Appointments" />
                                    <Tab label="Completed" />
                                    <Tab label="Upcoming" />
                                </Tabs>
                            </Box>

                            {/* Appointments List */}
                            <List>
                                {filteredAppointments.map((appointment) => (
                                    <React.Fragment key={appointment._id}>
                                        <ListItem
                                            sx={{
                                                border: 1,
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                mb: 2,
                                                flexDirection: 'column',
                                                alignItems: 'flex-start'
                                            }}
                                        >
                                            <Box sx={{ width: '100%', mb: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="subtitle1">
                                                        {new Date(appointment.dateTime).toLocaleString()}
                                                    </Typography>
                                                    <Chip
                                                        label={appointment.status}
                                                        color={getStatusColor(appointment.status)}
                                                        size="small"
                                                    />
                                                </Box>

                                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                                    Type: {appointment.type}
                                                </Typography>

                                                <Typography variant="body2" gutterBottom>
                                                    <strong>Symptoms:</strong> {appointment.symptoms || 'Not provided'}
                                                </Typography>

                                                <Typography variant="body2" gutterBottom>
                                                    <strong>Diagnosis:</strong> {appointment.diagnosis || 'Not provided'}
                                                </Typography>

                                                <Typography variant="body2" gutterBottom>
                                                    <strong>Prescription:</strong> {appointment.prescription || 'Not provided'}
                                                </Typography>

                                                <Typography variant="body2">
                                                    <strong>Notes:</strong> {appointment.notes || 'Not provided'}
                                                </Typography>
                                            </Box>

                                            {appointment.status === 'completed' && (
                                                <Box sx={{ width: '100%', mt: 2 }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => {
                                                            setSelectedAppointment(appointment);
                                                            setUpdateData({
                                                                diagnosis: appointment.diagnosis || '',
                                                                prescription: appointment.prescription || '',
                                                                notes: appointment.notes || ''
                                                            });
                                                            setOpenUpdateDialog(true);
                                                        }}
                                                    >
                                                        Update Diagnosis/Prescription
                                                    </Button>
                                                </Box>
                                            )}
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                                {filteredAppointments.length === 0 && (
                                    <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                                        No appointments found for this patient.
                                    </Typography>
                                )}
                            </List>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRecordsDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Update Appointment Dialog */}
            <Dialog open={openUpdateDialog} onClose={() => setOpenUpdateDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Update Appointment Details</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Diagnosis"
                        value={updateData.diagnosis}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, diagnosis: e.target.value }))}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Prescription"
                        value={updateData.prescription}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, prescription: e.target.value }))}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Notes"
                        value={updateData.notes}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUpdateDialog(false)}>Cancel</Button>
                    <Button onClick={handleUpdateAppointment} variant="contained">
                        Update
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default PatientRecords;
