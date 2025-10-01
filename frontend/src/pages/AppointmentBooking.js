import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Stepper,
    Step,
    StepLabel,
    Grid,
    Card,
    CardContent,
    Avatar,
    Chip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DoctorCalendar from '../components/DoctorCalendar';

const steps = ['Select Doctor', 'Choose Date & Time', 'Confirm & Pay'];

const AppointmentBooking = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [symptoms, setSymptoms] = useState('');
    const [appointmentType, setAppointmentType] = useState('in-person');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [bookingDialog, setBookingDialog] = useState(false);

    // Symptom to specialization mapping
    const symptomMappings = {
        'fever': ['Internal Medicine', 'General Physician', 'Pediatrics'],
        'headache': ['Neurology', 'Internal Medicine', 'General Physician'],
        'cough': ['Pulmonology', 'Internal Medicine', 'ENT'],
        'chest pain': ['Cardiology', 'Internal Medicine'],
        'stomach pain': ['Gastroenterology', 'Internal Medicine'],
        'back pain': ['Orthopedics', 'Neurology'],
        'joint pain': ['Orthopedics', 'Rheumatology'],
        'skin rash': ['Dermatology', 'Allergy'],
        'eye pain': ['Ophthalmology'],
        'ear pain': ['ENT'],
        'tooth pain': ['Dentistry'],
        'pregnancy': ['Obstetrics and Gynecology'],
        'mental health': ['Psychiatry', 'Psychology'],
        'diabetes': ['Endocrinology', 'Internal Medicine'],
        'hypertension': ['Cardiology', 'Internal Medicine']
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/doctors', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setDoctors(data.data.doctors);
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setError('Failed to load doctors');
        }
    };

    const filteredDoctors = doctors.filter(doctor => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchesName = doctor.name.toLowerCase().includes(lowerSearchTerm);
        const matchesSpecialization = doctor.specialization.toLowerCase().includes(lowerSearchTerm);

        // Check for symptom matches
        const symptomMatch = Object.keys(symptomMappings).some(symptom =>
            symptom.includes(lowerSearchTerm) && symptomMappings[symptom].includes(doctor.specialization)
        );

        const matchesSearch = matchesName || matchesSpecialization || symptomMatch;
        const matchesSpecializationFilter = !specialization || doctor.specialization === specialization;
        return matchesSearch && matchesSpecializationFilter;
    });

    const specializations = [...new Set(doctors.map(doctor => doctor.specialization))];

    const handleNext = () => {
        if (activeStep === 0 && !selectedDoctor) {
            setError('Please select a doctor');
            return;
        }
        if (activeStep === 1 && !selectedSlot) {
            setError('Please select a date and time');
            return;
        }
        setError('');
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
        setError('');
    };

    const handleBookAppointment = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    doctor: selectedDoctor._id,
                    dateTime: `${selectedSlot.date}T${selectedSlot.time}`,
                    type: appointmentType,
                    symptoms: symptoms,
                    paymentAmount: 500
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Appointment booked successfully!');
                setBookingDialog(true);
            } else {
                setError(data.message || 'Failed to book appointment');
            }
        } catch (error) {
            setError('An error occurred while booking the appointment');
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Select a Doctor
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Search by name, specialization, or symptoms"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Filter by Specialization</InputLabel>
                                        <Select
                                            value={specialization}
                                            label="Filter by Specialization"
                                            onChange={(e) => setSpecialization(e.target.value)}
                                        >
                                            <MenuItem value="">All Specializations</MenuItem>
                                            {specializations.map(spec => (
                                                <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                        <Grid container spacing={2}>
                            {filteredDoctors.map((doctor) => (
                                <Grid item key={doctor._id} xs={12} sm={6} md={4}>
                                    <Card
                                        sx={{
                                            cursor: 'pointer',
                                            border: selectedDoctor?._id === doctor._id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                            '&:hover': { boxShadow: 3 }
                                        }}
                                        onClick={() => setSelectedDoctor(doctor)}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Avatar
                                                    sx={{ width: 48, height: 48, mr: 2 }}
                                                    alt={doctor.name}
                                                    src={doctor.profilePicture}
                                                />
                                                <Box>
                                                    <Typography variant="h6">
                                                        Dr. {doctor.name}
                                                    </Typography>
                                                    <Chip
                                                        label={doctor.specialization}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                </Box>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Experience: {doctor.experience} years
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                );
            case 1:
            return (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Choose Date & Time
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Selected Doctor: Dr. {selectedDoctor?.name}
                    </Typography>
                    <DoctorCalendar
                        doctorId={selectedDoctor?._id}
                        onSlotSelect={(slot) => setSelectedSlot(slot)}
                    />
                    {selectedSlot && (
                        <Typography sx={{ mt: 2 }}>
                            Selected Slot: {selectedSlot.display}
                        </Typography>
                    )}
                </Box>
            );
            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Confirm Your Appointment
                        </Typography>
                        <Paper sx={{ p: 3, mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1">Doctor:</Typography>
                                    <Typography>Dr. {selectedDoctor?.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedDoctor?.specialization}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1">Date & Time:</Typography>
                                    <Typography>{selectedSlot?.display}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1">Appointment Type:</Typography>
                                    <FormControl fullWidth sx={{ mt: 1 }}>
                                        <Select
                                            value={appointmentType}
                                            onChange={(e) => setAppointmentType(e.target.value)}
                                        >
                                            <MenuItem value="in-person">In-Person</MenuItem>
                                            <MenuItem value="video">Video Call</MenuItem>
                                            <MenuItem value="phone">Phone Call</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1">Consultation Fee:</Typography>
                                    <Typography variant="h6" color="primary">₹500</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Symptoms (Optional)"
                                        value={symptoms}
                                        onChange={(e) => setSymptoms(e.target.value)}
                                        placeholder="Describe your symptoms or reason for visit"
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Book Appointment
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

            {/* Stepper */}
            <Box sx={{ mb: 4 }}>
                <Stepper activeStep={activeStep}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {/* Step Content */}
            <Paper sx={{ p: 3, minHeight: 400 }}>
                {renderStepContent(activeStep)}
            </Paper>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    onClick={activeStep === steps.length - 1 ? handleBookAppointment : handleNext}
                >
                    {activeStep === steps.length - 1 ? 'Book Appointment' : 'Next'}
                </Button>
            </Box>

            {/* Success Dialog */}
            <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)}>
                <DialogTitle>Appointment Booked Successfully!</DialogTitle>
                <DialogContent>
                    <Typography>
                        Your appointment with Dr. {selectedDoctor?.name} has been confirmed for {selectedSlot?.display}.
                    </Typography>
                    <Typography sx={{ mt: 1 }}>
                        You will receive a confirmation email shortly.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => navigate('/appointments')}>View My Appointments</Button>
                    <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AppointmentBooking;
