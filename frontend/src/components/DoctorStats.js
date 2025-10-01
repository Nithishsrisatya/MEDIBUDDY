import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Grid,
    Box,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Divider,
    Chip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const DoctorStats = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalPatients: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        scheduledAppointments: 0,
        cancelledAppointments: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        recentAppointments: []
    });

    const fetchDoctorStats = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/doctors/${user._id}/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setStats(prevStats => ({
                    ...prevStats,
                    totalAppointments: data.data.stats.reduce((sum, stat) => sum + stat.count, 0),
                    completedAppointments: data.data.stats.find(stat => stat._id === 'completed')?.count || 0,
                    scheduledAppointments: data.data.stats.find(stat => stat._id === 'scheduled')?.count || 0,
                    cancelledAppointments: data.data.stats.find(stat => stat._id === 'cancelled')?.count || 0,
                }));
            }
        } catch (error) {
            console.error('Error fetching doctor stats:', error);
        }
    };

    useEffect(() => {
        if (user?.role === 'doctor') {
            fetchDoctorStats();
        }
    }, [user, fetchDoctorStats]);

    const StatCard = ({ title, value, subtitle, color = 'primary' }) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography color="textSecondary" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="h4" component="div" color={color}>
                    {typeof value === 'number' && title.toLowerCase().includes('revenue')
                        ? `$${value.toLocaleString()}`
                        : value.toLocaleString()}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="textSecondary">
                        {subtitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );

    if (user?.role !== 'doctor') {
        return null;
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Practice Statistics
            </Typography>

            {/* Key Metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Patients"
                        value={stats.totalPatients}
                        subtitle="Unique patients served"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Appointments"
                        value={stats.totalAppointments}
                        subtitle="All time appointments"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Revenue"
                        value={stats.totalRevenue}
                        subtitle="All time earnings"
                        color="success.main"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Monthly Revenue"
                        value={stats.monthlyRevenue}
                        subtitle="Current month earnings"
                        color="success.main"
                    />
                </Grid>
            </Grid>

            {/* Appointment Status Breakdown */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Appointment Status
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemText
                                    primary="Scheduled"
                                    secondary={`${stats.scheduledAppointments} appointments`}
                                />
                                <Chip
                                    label={stats.scheduledAppointments}
                                    color="primary"
                                    size="small"
                                />
                            </ListItem>
                            <Divider />
                            <ListItem>
                                <ListItemText
                                    primary="Completed"
                                    secondary={`${stats.completedAppointments} appointments`}
                                />
                                <Chip
                                    label={stats.completedAppointments}
                                    color="success"
                                    size="small"
                                />
                            </ListItem>
                            <Divider />
                            <ListItem>
                                <ListItemText
                                    primary="Cancelled"
                                    secondary={`${stats.cancelledAppointments} appointments`}
                                />
                                <Chip
                                    label={stats.cancelledAppointments}
                                    color="error"
                                    size="small"
                                />
                            </ListItem>
                        </List>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Appointments
                        </Typography>
                        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {stats.recentAppointments.map((appointment, index) => (
                                <React.Fragment key={appointment._id}>
                                    <ListItem>
                                        <ListItemText
                                            primary={`${appointment.patient.name} - ${new Date(appointment.dateTime).toLocaleDateString()}`}
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" color="textSecondary">
                                                        Status: {appointment.status}
                                                    </Typography>
                                                    {appointment.paymentAmount && (
                                                        <Typography variant="body2" color="textSecondary">
                                                            Revenue: ${appointment.paymentAmount}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < stats.recentAppointments.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                            {stats.recentAppointments.length === 0 && (
                                <ListItem>
                                    <ListItemText
                                        primary="No recent appointments"
                                        secondary="Recent appointments will appear here"
                                    />
                                </ListItem>
                            )}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DoctorStats;
