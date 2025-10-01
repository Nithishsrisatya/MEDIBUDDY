import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Button,
    Card,
    CardContent,
    CardActions,
    TextField,
    Avatar,
    Chip,
    InputAdornment,
    Switch,
    FormControlLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DoctorCalendar from '../components/DoctorCalendar';
import DoctorStats from '../components/DoctorStats';
import Notifications from '../components/Notifications';
import { updateDoctorOnlineStatus } from '../utils/api';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        upcoming: 0,
        completed: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [online, setOnline] = useState(user?.online || false);

    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5000/api/appointments/my-appointments', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                const appointments = data.data.appointments;
                const upcoming = appointments
                    .filter(app => new Date(app.dateTime) > new Date())
                    .slice(0, 5); // Show up to 5
                setUpcomingAppointments(upcoming);

                setStats({
                    total: appointments.length,
                    upcoming: appointments.filter(app => app.status === 'scheduled').length,
                    completed: appointments.filter(app => app.status === 'completed').length
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleSearch = async (term) => {
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }
        setLoadingSearch(true);
        try {
            const response = await fetch(`http://localhost:5000/api/doctors?search=${encodeURIComponent(term)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                const results = data.data.doctors.filter(doctor =>
                    doctor.name.toLowerCase().includes(term.toLowerCase()) ||
                    doctor.specialization.toLowerCase().includes(term.toLowerCase()) ||
                    commonSymptoms.includes(term.toLowerCase())
                );
                setSearchResults(results.slice(0, 5)); // Top 5 results
            }
        } catch (error) {
            console.error('Error searching doctors:', error);
        }
        setLoadingSearch(false);
    };

    const commonSymptoms = ['headache', 'fever', 'cough', 'pain', 'cold']; // Simple list for symptom matching

    const handleBookDoctor = (doctorId) => {
        navigate(`/doctors?selected=${doctorId}`);
    };

    const handleJoinAppointment = (appointmentId) => {
        // For now, navigate to appointments details
        navigate(`/appointments?view=${appointmentId}`);
    };

    const handleReschedule = (appointmentId) => {
        navigate(`/appointments?reschedule=${appointmentId}`);
    };

    const handleToggleOnline = async (event) => {
        const newOnlineStatus = event.target.checked;
        setOnline(newOnlineStatus);
        try {
            await updateDoctorOnlineStatus(user._id, newOnlineStatus);
        } catch (error) {
            console.error('Failed to update online status:', error);
        }
    };

    const QuickActionCard = ({ title, description, action, buttonText }) => (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2">
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            </CardContent>
            <CardActions>
                <Button size="small" color="primary" onClick={action}>
                    {buttonText}
                </Button>
            </CardActions>
        </Card>
    );

    const DoctorSearchCard = ({ doctor }) => (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Grid container spacing={2} alignItems="center">
                    <Grid item>
                        <Avatar src={doctor.profilePicture || '/default-avatar.png'} alt={doctor.name}>
                            {doctor.name.charAt(0)}
                        </Avatar>
                    </Grid>
                    <Grid item xs>
                        <Typography variant="h6">{doctor.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{doctor.specialization}</Typography>
                        <Chip label={doctor.experience + ' years exp'} size="small" color="primary" sx={{ mt: 1 }} />
                    </Grid>
                </Grid>
            </CardContent>
            <CardActions>
                <Button size="small" color="primary" onClick={() => handleBookDoctor(doctor._id)}>
                    Book Appointment
                </Button>
            </CardActions>
        </Card>
    );

    const UpcomingAppointmentCard = ({ appointment }) => (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Grid container spacing={2} alignItems="center">
                    <Grid item>
                        <Avatar src={appointment.doctor.profilePicture || '/default-avatar.png'} alt={appointment.doctor.name}>
                            {appointment.doctor.name.charAt(0)}
                        </Avatar>
                    </Grid>
                    <Grid item xs>
                        <Typography variant="h6">{appointment.doctor.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{appointment.doctor.specialization}</Typography>
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body1"><strong>Date:</strong> {new Date(appointment.dateTime).toLocaleDateString()}</Typography>
                            <Typography variant="body1"><strong>Time:</strong> {new Date(appointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                            {appointment.symptoms && <Typography variant="body2"><strong>Symptoms:</strong> {appointment.symptoms}</Typography>}
                        </Box>
                        <Chip label={appointment.status} color={appointment.status === 'scheduled' ? 'primary' : 'success'} sx={{ mt: 1 }} />
                    </Grid>
                </Grid>
            </CardContent>
            <CardActions>
                <Button size="small" color="primary" onClick={() => handleJoinAppointment(appointment._id)}>
                    Join
                </Button>
                <Button size="small" color="secondary" onClick={() => handleReschedule(appointment._id)}>
                    Reschedule
                </Button>
            </CardActions>
        </Card>
    );

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Welcome Section */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4" gutterBottom>
                            Welcome back, {user?.name}!
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {user?.role === 'patient' ? 'Manage your health with ease.' : 'Manage your practice efficiently.'}
                        </Typography>
                        {user?.role === 'doctor' && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={online}
                                        onChange={handleToggleOnline}
                                        color="primary"
                                    />
                                }
                                label={online ? 'Online' : 'Offline'}
                                sx={{ mt: 2 }}
                            />
                        )}
                    </Paper>
                </Grid>

                {/* Notifications */}
                {user?.role === 'doctor' && (
                    <Grid item xs={12} sx={{ textAlign: 'right' }}>
                        <Notifications />
                    </Grid>
                )}

                {/* Statistics */}
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">Total Appointments</Typography>
                        <Typography variant="h3">{stats.total}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">Upcoming</Typography>
                        <Typography variant="h3" color="primary">{stats.upcoming}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">Completed</Typography>
                        <Typography variant="h3" color="success">{stats.completed}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">Pending</Typography>
                        <Typography variant="h3" color="warning">{stats.total - stats.upcoming - stats.completed}</Typography>
                    </Paper>
                </Grid>

                {/* Doctor Calendar for Doctors */}
                {user?.role === 'doctor' && (
                    <Grid item xs={12}>
                        <DoctorCalendar />
                    </Grid>
                )}

                {/* Quick Actions */}
                <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                        Quick Actions
                    </Typography>
                </Grid>
                {user?.role === 'patient' ? (
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <QuickActionCard
                                title="Book Appointment"
                                description="Schedule a new appointment with a doctor"
                                action={() => navigate('/doctors')}
                                buttonText="Find Doctors"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <QuickActionCard
                                title="View Prescriptions"
                                description="View your prescriptions from completed appointments"
                                action={() => navigate('/appointments')}
                                buttonText="View Prescriptions"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <QuickActionCard
                                title="My Doctors"
                                description="View doctors you've consulted"
                                action={() => navigate('/doctors?my=true')}
                                buttonText="View Doctors"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <QuickActionCard
                                title="My Reports"
                                description="View your medical reports and history"
                                action={() => navigate('/profile')}
                                buttonText="View Reports"
                            />
                        </Grid>
                    </>
                ) : (
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <QuickActionCard
                                title="View Schedule"
                                description="View your appointment schedule"
                                action={() => navigate('/appointments')}
                                buttonText="View Schedule"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <QuickActionCard
                                title="Patient Records"
                                description="Access patient appointment history and records"
                                action={() => navigate('/patient-records')}
                                buttonText="View Patients"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <QuickActionCard
                                title="Update Profile"
                                description="Update your personal information and preferences"
                                action={() => navigate('/profile')}
                                buttonText="Edit Profile"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <QuickActionCard
                                title="Statistics"
                                description="View your practice statistics"
                                action={() => {}}
                                buttonText="View Stats"
                            />
                        </Grid>
                    </>
                )}

                {/* Doctor Search Bar for Patients */}
                {user?.role === 'patient' && (
                    <>
                        <Grid item xs={12}>
                            <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                                Quick Doctor Search
                            </Typography>
                            <Paper sx={{ p: 2 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Search doctors by name, specialization, or symptoms (e.g., headache, fever)"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        handleSearch(e.target.value);
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ mb: 2 }}
                                />
                                {loadingSearch ? (
                                    <Typography>Loading...</Typography>
                                ) : searchResults.length > 0 ? (
                                    <Grid container spacing={2}>
                                        {searchResults.map(doctor => (
                                            <Grid item xs={12} sm={6} md={4} key={doctor._id}>
                                                <DoctorSearchCard doctor={doctor} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : searchTerm && (
                                    <Typography color="text.secondary">No doctors found. Try a different search term.</Typography>
                                )}
                            </Paper>
                        </Grid>
                    </>
                )}

                {/* Doctor Statistics for Doctors */}
                {user?.role === 'doctor' && (
                    <Grid item xs={12}>
                        <DoctorStats />
                    </Grid>
                )}

                {/* Upcoming Appointments */}
                <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                        Upcoming Appointments
                    </Typography>
                    {upcomingAppointments.length > 0 ? (
                        <Grid container spacing={2}>
                            {upcomingAppointments.map(appointment => (
                                <Grid item xs={12} sm={6} md={4} key={appointment._id}>
                                    <UpcomingAppointmentCard appointment={appointment} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                No upcoming appointments. Book one today!
                            </Typography>
                            <Button variant="contained" onClick={() => navigate('/doctors')} sx={{ mt: 2 }}>
                                Book Appointment
                            </Button>
                        </Paper>
                    )}
                </Grid>

                {/* View All Appointments */}
                <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Button variant="outlined" onClick={() => navigate('/appointments')}>
                            View All Appointments
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;
