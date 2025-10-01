import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Box,
    Avatar,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Divider
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';

const DoctorList = () => {
    const [searchParams] = useSearchParams();
    const [doctors, setDoctors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [openBooking, setOpenBooking] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [myDoctorsMode, setMyDoctorsMode] = useState(false);
    const [myDoctors, setMyDoctors] = useState([]);

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
        }
    };

    useEffect(() => {
        fetchDoctors();
        if (searchParams.get('my') === 'true') {
            setMyDoctorsMode(true);
        }
    }, [searchParams]);

    const fetchAvailability = async (doctorId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/appointments/doctor/${doctorId}/availability`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                generateAvailableSlots(data.data.availability, data.data.bookedSlots);
            }
        } catch (error) {
            console.error('Error fetching availability:', error);
        }
    };

    const generateAvailableSlots = (availability, bookedSlots) => {
        const slots = [];
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        for (let date = new Date(today); date <= nextWeek; date.setDate(date.getDate() + 1)) {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const dayAvailability = availability.find(slot => slot.day === dayName);

            if (dayAvailability) {
                const startTime = new Date(`${date.toDateString()} ${dayAvailability.startTime}`);
                const endTime = new Date(`${date.toDateString()} ${dayAvailability.endTime}`);

                for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 30)) {
                    const slotTime = time.toTimeString().slice(0, 5);
                    const isBooked = bookedSlots.some(booked => {
                        const bookedTime = new Date(booked.dateTime);
                        return bookedTime.toDateString() === date.toDateString() &&
                               bookedTime.getHours() === time.getHours() &&
                               bookedTime.getMinutes() === time.getMinutes();
                    });

                    if (!isBooked) {
                        slots.push({
                            date: date.toISOString().split('T')[0],
                            time: slotTime,
                            display: `${date.toLocaleDateString()} ${slotTime}`
                        });
                    }
                }
            }
        }
        setAvailableSlots(slots);
    };

    const fetchMyDoctors = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5000/api/appointments/my-appointments', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                const uniqueDoctorIds = [...new Set(data.data.appointments.map(app => app.doctor._id))];
                const myDoctorList = doctors.filter(doctor => uniqueDoctorIds.includes(doctor._id));
                setMyDoctors(myDoctorList);
            }
        } catch (error) {
            console.error('Error fetching my doctors:', error);
        }
    }, [doctors]);

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
                    type: 'in-person',
                    symptoms: 'Regular checkup',
                    paymentAmount: 500
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Appointment booked successfully!');
                setOpenBooking(false);
                setSelectedDoctor(null);
                setSelectedSlot(null);
                setAvailableSlots([]);
            } else {
                setError(data.message || 'Failed to book appointment');
            }
        } catch (error) {
            setError('An error occurred while booking the appointment');
        }
    };

    const filteredDoctors = (myDoctorsMode ? myDoctors : doctors).filter(doctor => {
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

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Search and Filter Section */}
            <Box sx={{ mb: 4 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Search doctors by name or specialization"
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

            {/* Doctors Grid */}
            <Grid container spacing={3}>
                {filteredDoctors.map((doctor) => (
                    <Grid item key={doctor._id} xs={12} sm={6} md={4}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar
                                        sx={{ width: 56, height: 56, mr: 2 }}
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
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {doctor.qualification}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Experience: {doctor.experience} years
                                </Typography>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    onClick={() => {
                                        setSelectedDoctor(doctor);
                                        fetchAvailability(doctor._id);
                                        setOpenBooking(true);
                                    }}
                                >
                                    Book Appointment
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Booking Dialog */}
            <Dialog open={openBooking} onClose={() => setOpenBooking(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Book Appointment</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography gutterBottom>
                            Doctor: Dr. {selectedDoctor?.name}
                        </Typography>
                        <Typography gutterBottom>
                            Specialization: {selectedDoctor?.specialization}
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                            Available Slots
                        </Typography>
                        {availableSlots.length > 0 ? (
                            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                                {availableSlots.map((slot, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem disablePadding>
                                            <ListItemButton
                                                selected={selectedSlot === slot}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                <ListItemText primary={slot.display} />
                                            </ListItemButton>
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Typography color="text.secondary">
                                No available slots for the next 7 days.
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBooking(false)}>Cancel</Button>
                    <Button
                        onClick={handleBookAppointment}
                        variant="contained"
                        disabled={!selectedSlot}
                    >
                        Confirm Booking
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default DoctorList; 