import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    console.log('ProtectedRoute: isAuthenticated', isAuthenticated);

    if (!isAuthenticated) {
        console.log('ProtectedRoute: redirecting to /login');
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute; 