import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const API_URL = process.env.REACT_APP_API;
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        console.log('AuthContext useEffect: token exists', !!token, 'userData exists', !!userData);

        if (token && userData) {
            const parsedUser = JSON.parse(userData);
            console.log('AuthContext: setting user', parsedUser);
            setUser(parsedUser);
        } else {
            console.log('AuthContext: no token or userData, user remains null');
        }
        setLoading(false);
    }, []);

    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.data.user));
                setUser(data.data.user);
            } else if (response.status === 401 || response.status === 403) {
                // Token invalid, logout
                logout();
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
            // Don't logout on network error, keep stored user
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            setUser(data.data.user);
            navigate('/dashboard');
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    };

    const register = async (formData) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!data.success) {
                return {
                    success: false,
                    message: data.message || 'Registration failed',
                };
            }

            return data;
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed',
            };
        }
    };

    const loginWithProvider = async (provider) => {
        // Placeholder for social login - implement OAuth flow
        alert(`${provider} login coming soon!`);
        return { success: false, message: 'Social login not implemented yet' };
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const updateUser = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            loginWithProvider,
            updateUser,
            refreshUser,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext; 