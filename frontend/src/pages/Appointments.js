import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
    Tabs
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API;

const Appointments = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [openRescheduleDialog, setOpenRescheduleDialog] = useState(false);
    const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await fetch(`${API_URL}/api/appointments/my-appointments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setAppointments(data.data.appointments);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setError('Failed to load appointments');
        }
    };

    const handleCancelAppointment = async () => {
        try {
            const response = await fetch(`${API_URL}/api/appointments/${selectedAppointment._id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: 'cancelled' })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Appointment cancelled successfully');
                fetchAppointments();
                setOpenCancelDialog(false);
            } else {
                setError(data.message || 'Failed to cancel appointment');
            }
        } catch (error) {
            setError('An error occurred while cancelling the appointment');
        }
    };

    const handleRescheduleAppointment = async () => {
        try {
            const response = await fetch(`${API_URL}/api/appointments/${selectedAppointment._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    dateTime: `${newDate}T${newTime}:00`
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Appointment rescheduled successfully');
                fetchAppointments();
                setOpenRescheduleDialog(false);
            } else {
                setError(data.message || 'Failed to reschedule appointment');
            }
        } catch (error) {
            setError('An error occurred while rescheduling the appointment');
        }
    };

    const handleMarkCompleted = async () => {
        try {
            const response = await fetch(`${API_URL}/api/appointments/${selectedAppointment._id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: 'completed' })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Appointment marked as completed');
                fetchAppointments();
                setOpenDetailsDialog(false);
            } else {
                setError(data.message || 'Failed to update appointment status');
            }
        } catch (error) {
            setError('An error occurred while updating appointment status');
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

    const filteredAppointments = appointments.filter(appointment => {
        if (tabValue === 0) return true; // All appointments
        if (tabValue === 1) return appointment.status === 'scheduled';
        if (tabValue === 2) return appointment.status === 'completed';
        if (tabValue === 3) return appointment.status === 'cancelled';
        return true;
    });

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                My Appointments
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

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label="All" />
                    <Tab label="Upcoming" />
                    <Tab label="Completed" />
                    <Tab label="Cancelled" />
                </Tabs>
            </Box>

            {/* Appointments Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date & Time</TableCell>
                            <TableCell>{user?.role === 'doctor' ? 'Patient' : 'Doctor'}</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAppointments.map((appointment) => (
                            <TableRow key={appointment._id}>
                                <TableCell>
                                    {new Date(appointment.dateTime).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    {user?.role === 'doctor'
                                        ? appointment.patient.name
                                        : `Dr. ${appointment.doctor.name}`}
                                </TableCell>
                                <TableCell>{appointment.type}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={appointment.status}
                                        color={getStatusColor(appointment.status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {appointment.status === 'scheduled' && (
                                        <>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    setSelectedAppointment(appointment);
                                                    setOpenDetailsDialog(true);
                                                }}
                                                sx={{ mr: 1 }}
                                            >
                                                Details
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    setSelectedAppointment(appointment);
                                                    setOpenRescheduleDialog(true);
                                                }}
                                                sx={{ mr: 1 }}
                                            >
                                                Reschedule
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setSelectedAppointment(appointment);
                                                    setOpenCancelDialog(true);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Details Dialog */}
            <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Appointment Details</DialogTitle>
                <DialogContent dividers>
                    {selectedAppointment ? (
                        <>
                            <Typography variant="subtitle1" gutterBottom>
                                Symptoms:
                            </Typography>
                            <Typography paragraph>
                                {selectedAppointment.symptoms || 'Not provided'}
                            </Typography>
                            <Typography variant="subtitle1" gutterBottom>
                                Notes:
                            </Typography>
                            <Typography paragraph>
                                {selectedAppointment.notes || 'Not provided'}
                            </Typography>
                            <Typography variant="subtitle1" gutterBottom>
                                Diagnosis:
                            </Typography>
                            <Typography paragraph>
                                {selectedAppointment.diagnosis || 'Not provided'}
                            </Typography>
                            <Typography variant="subtitle1" gutterBottom>
                                Prescription:
                            </Typography>
                            <Typography paragraph>
                                {selectedAppointment.prescription || 'Not provided'}
                            </Typography>
                        </>
                    ) : (
                        <Typography>Loading...</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
                    {selectedAppointment && selectedAppointment.status === 'scheduled' && (
                        <Button onClick={handleMarkCompleted} color="success">
                            Mark as Completed
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Cancel Dialog */}
            <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
                <DialogTitle>Cancel Appointment</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to cancel this appointment?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCancelDialog(false)}>No</Button>
                    <Button onClick={handleCancelAppointment} color="error">
                        Yes, Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reschedule Dialog */}
            <Dialog open={openRescheduleDialog} onClose={() => setOpenRescheduleDialog(false)}>
                <DialogTitle>Reschedule Appointment</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        type="date"
                        label="New Date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        sx={{ mt: 2 }}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        fullWidth
                        type="time"
                        label="New Time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        sx={{ mt: 2 }}
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRescheduleDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleRescheduleAppointment}
                        color="primary"
                        disabled={!newDate || !newTime}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Appointments;
