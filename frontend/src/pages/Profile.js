import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    Box,
    Avatar,
    Divider,
    Alert,
    List,
    ListItem,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API;

const Profile = () => {
    const { user, updateUser, refreshUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || {},
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [tabValue, setTabValue] = useState(0);
    const [prescriptions, setPrescriptions] = useState([]);
    const [reports, setReports] = useState([]);

    useEffect(() => {
        console.log('Profile useEffect: user', user);
        // Temporarily disabled refreshUser to prevent logout on backend issues
        // if (user) {
        //     console.log('Profile: calling refreshUser');
        //     refreshUser();
        // } else {
        //     console.log('Profile: no user, not calling refreshUser');
        // }

        // Fetch prescriptions from completed appointments
        if (user?.role === 'patient') {
            fetchPrescriptions();
        }

        // Reports from medicalRecords
        if (user?.medicalRecords) {
            setReports(user.medicalRecords.map(record => ({
                title: record.fileName || `Report - ${record.uploadDate}`,
                date: record.uploadDate,
                type: record.type || 'Medical Report'
            })));
        }
    }, [user]);

    useEffect(() => {
        setFormData({
            name: user?.name || '',
            phone: user?.phone || '',
            address: user?.address || {},
            dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
        });
    }, [user]);

    const fetchPrescriptions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/appointments/my-appointments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                const completedAppointments = data.data.appointments.filter(app => app.status === 'completed');
                const allPrescriptions = completedAppointments.flatMap(app => 
                    (app.prescriptions || []).map(pres => ({
                        medication: pres.medication,
                        dosage: pres.dosage,
                        doctor: app.doctor.name,
                        date: app.dateTime
                    }))
                );
                setPrescriptions(allPrescriptions);
            }
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting formData:', formData);
        try {
            const response = await fetch(`${API_URL}/api/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                updateUser(data.data.user);
                setSuccess('Profile updated successfully');
                setEditing(false);
            } else {
                console.error('Profile update failed:', data);
                setError(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error during profile update:', error);
            setError('An error occurred while updating profile');
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/users/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Password changed successfully');
                setOpenPasswordDialog(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                setError(data.message || 'Failed to change password');
            }
        } catch (error) {
            setError('An error occurred while changing password');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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

            <Grid container spacing={3}>
                {/* Profile Overview */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Avatar
                            sx={{
                                width: 100,
                                height: 100,
                                margin: '0 auto',
                                mb: 2
                            }}
                            alt={user?.name}
                            src={user?.profilePicture}
                        />
                        <Typography variant="h5" gutterBottom>
                            {user?.name}
                        </Typography>
                        <Typography color="textSecondary" gutterBottom>
                            {user?.email}
                        </Typography>
                        <Typography color="textSecondary">
                            {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
                        </Typography>
                        <Button
                            variant="outlined"
                            sx={{ mt: 2 }}
                            onClick={() => setOpenPasswordDialog(true)}
                        >
                            Change Password
                        </Button>
                    </Paper>
                </Grid>

                {/* Profile Details */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">Profile Details</Typography>
                                {!editing && (
                                    <Button
                                        variant="contained"
                                        onClick={() => setEditing(true)}
                                    >
                                        Edit Profile
                                    </Button>
                                )}
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            
                            {editing ? (
                                <form onSubmit={handleSubmit}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Full Name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Phone Number"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Street Address"
                                                name="address.street"
                                                value={formData.address.street || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="City"
                                                name="address.city"
                                                value={formData.address.city || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="State"
                                                name="address.state"
                                                value={formData.address.state || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="ZIP Code"
                                                name="address.zipCode"
                                                value={formData.address.zipCode || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                type="date"
                                                label="Date of Birth"
                                                name="dateOfBirth"
                                                value={formData.dateOfBirth}
                                                onChange={handleInputChange}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            type="submit"
                                        >
                                            Save Changes
                                        </Button>
                                    </Box>
                                </form>
                            ) : (
                                <List>
                                    <ListItem>
                                        <ListItemText
                                            primary="Phone Number"
                                            secondary={user?.phone || 'Not provided'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Address"
                                            secondary={
                                                user?.address
                                                    ? `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.state || ''} ${user.address.zipCode || ''}`
                                                    : 'Not provided'
                                            }
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Date of Birth"
                                            secondary={
                                                user?.dateOfBirth
                                                    ? new Date(user.dateOfBirth).toLocaleDateString()
                                                    : 'Not provided'
                                            }
                                        />
                                    </ListItem>
                                </List>
                            )}
                    </Paper>
                </Grid>

                {/* Patient Tabs */}
                {user?.role === 'patient' && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                                <Tab label="Profile & History" />
                                <Tab label="Prescriptions" />
                                <Tab label="Reports" />
                            </Tabs>
                            <Divider sx={{ mb: 3 }} />

                            {tabValue === 0 && (
                                <List>
                                    <ListItem>
                                        <ListItemText
                                            primary="Medical History"
                                            secondary="Uploaded medical records and history"
                                        />
                                    </ListItem>
                                    {user?.medicalRecords?.map((record, index) => (
                                        <ListItem key={index} sx={{ pl: 4 }}>
                                            <ListItemText
                                                primary={record.fileName || `Record ${index + 1}`}
                                                secondary={`Uploaded: ${new Date(record.uploadDate).toLocaleDateString()} - ${record.type || 'Document'}`}
                                            />
                                        </ListItem>
                                    ))}
                                    {(!user?.medicalRecords || user.medicalRecords.length === 0) && (
                                        <ListItem sx={{ pl: 4 }}>
                                            <ListItemText primary="No medical records available" />
                                        </ListItem>
                                    )}
                                </List>
                            )}

                            {tabValue === 1 && (
                                <List>
                                    <ListItem>
                                        <ListItemText
                                            primary="Current Prescriptions"
                                            secondary="Active medications"
                                        />
                                    </ListItem>
                                    {prescriptions.length > 0 ? prescriptions.map((prescription, index) => (
                                        <ListItem key={index} sx={{ pl: 4 }}>
                                            <ListItemText
                                                primary={`${prescription.medication} - ${prescription.dosage}`}
                                                secondary={`Prescribed by Dr. ${prescription.doctor} on ${new Date(prescription.date).toLocaleDateString()}`}
                                            />
                                        </ListItem>
                                    )) : (
                                        <ListItem sx={{ pl: 4 }}>
                                            <ListItemText primary="No active prescriptions" />
                                        </ListItem>
                                    )}
                                </List>
                            )}

                            {tabValue === 2 && (
                                <List>
                                    <ListItem>
                                        <ListItemText
                                            primary="Medical Reports"
                                            secondary="Test results and reports"
                                        />
                                    </ListItem>
                                    {reports.length > 0 ? reports.map((report, index) => (
                                        <ListItem key={index} sx={{ pl: 4 }}>
                                            <ListItemText
                                                primary={report.title}
                                                secondary={`Date: ${new Date(report.date).toLocaleDateString()} - ${report.type}`}
                                            />
                                        </ListItem>
                                    )) : (
                                        <ListItem sx={{ pl: 4 }}>
                                            <ListItemText primary="No reports available" />
                                        </ListItem>
                                    )}
                                </List>
                            )}
                        </Paper>
                    </Grid>
                )}
            </Grid>

            {/* Change Password Dialog */}
            <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        type="password"
                        label="Current Password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            currentPassword: e.target.value
                        }))}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        type="password"
                        label="New Password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            newPassword: e.target.value
                        }))}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        type="password"
                        label="Confirm New Password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            confirmPassword: e.target.value
                        }))}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handlePasswordChange}
                        color="primary"
                        disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    >
                        Change Password
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Profile; 