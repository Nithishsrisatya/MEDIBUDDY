import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navigation = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    return (
        <AppBar position="static" sx={{ mb: 2 }}>
            <Toolbar>
                <Typography
                    variant="h6"
                    sx={{ flexGrow: 1, cursor: 'pointer' }}
                    onClick={() => handleNavigation('/dashboard')}
                >
                    MediBuddy
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        color="inherit"
                        onClick={() => handleNavigation('/dashboard')}
                    >
                        Dashboard
                    </Button>
                    <Button
                        color="inherit"
                        onClick={() => handleNavigation('/appointments')}
                    >
                        Appointments
                    </Button>
                    {user?.role === 'patient' && (
                        <Button
                            color="inherit"
                            onClick={() => handleNavigation('/doctors')}
                        >
                            Doctors
                        </Button>
                    )}
                    {user?.role === 'doctor' && (
                        <Button
                            color="inherit"
                            onClick={() => handleNavigation('/patient-records')}
                        >
                            Patient Records
                        </Button>
                    )}
                    <Button
                        color="inherit"
                        onClick={() => handleNavigation('/profile')}
                    >
                        Profile
                    </Button>
                    <Button
                        color="inherit"
                        onClick={handleLogout}
                        startIcon={<LogoutIcon />}
                    >
                        Logout
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navigation;
