
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Validation middleware
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['patient', 'doctor']).withMessage('Invalid role')
];

const loginValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

// Register route
router.post('/register', registerValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            name,
            email,
            password,
            role,
            phone,
            dateOfBirth,
            gender,
            bloodGroup,
            address,
            medicalHistory,
            specialization,
            qualification,
            experience,
            clinicName,
            consultationFee,
            availability,
            registrationNumber,
            bio,
            location,
            languages,
            emergencyContact,
            videoConsultation,
            verified,
            certificates,
            specialAchievements
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Parse availability if it's a string
        let parsedAvailability = [];
        if (role === 'doctor') {
            if (typeof availability === 'string' && availability.trim()) {
                // Map day abbreviations to full names
                const dayMap = {
                    'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday',
                    'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
                };
                const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

                const slots = availability.split(',');
                for (const slot of slots) {
                    const trimmedSlot = slot.trim();
                    const parts = trimmedSlot.split(' ');
                    if (parts.length >= 2) {
                        const dayPart = parts[0];
                        const timeRange = parts.slice(1).join(' ');
                        const [startTimeStr, endTimeStr] = timeRange.split('-');
                        if (startTimeStr && endTimeStr) {
                            const startTime = startTimeStr.trim();
                            const endTime = endTimeStr.trim();
                            // Handle day ranges like "Mon-Fri"
                            if (dayPart.includes('-')) {
                                const [startDayAbbr, endDayAbbr] = dayPart.split('-');
                                const startDay = dayMap[startDayAbbr.trim()];
                                const endDay = dayMap[endDayAbbr.trim()];
                                if (startDay && endDay) {
                                    const startIndex = fullDays.indexOf(startDay);
                                    const endIndex = fullDays.indexOf(endDay);
                                    if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
                                        for (let i = startIndex; i <= endIndex; i++) {
                                            parsedAvailability.push({
                                                day: fullDays[i],
                                                startTime: startTime,
                                                endTime: endTime
                                            });
                                        }
                                    }
                                }
                            } else {
                                // Single day
                                const fullDay = dayMap[dayPart] || dayPart;
                                if (fullDays.includes(fullDay)) {
                                    parsedAvailability.push({
                                        day: fullDay,
                                        startTime: startTime,
                                        endTime: endTime
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // If no slots parsed or empty, set default availability
            if (parsedAvailability.length === 0) {
                parsedAvailability = [
                    { day: 'Monday', startTime: '09:00', endTime: '17:00' },
                    { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
                    { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
                    { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
                    { day: 'Friday', startTime: '09:00', endTime: '17:00' }
                ];
            }
        }

        // Create user
        const user = new User({
            name,
            email,
            password,
            role,
            phone,
            dateOfBirth: role === 'patient' ? dateOfBirth : undefined,
            gender: role === 'patient' ? gender : undefined,
            bloodGroup: role === 'patient' ? bloodGroup : undefined,
            address: role === 'patient' ? {
                street: address?.street,
                city: address?.city,
                state: address?.state,
                zipCode: address?.zip
            } : undefined,
            medicalHistory: role === 'patient' ? medicalHistory : undefined,
            specialization: role === 'doctor' ? specialization : undefined,
            qualification: role === 'doctor' ? qualification : undefined,
            experience: role === 'doctor' ? experience : undefined,
            clinicName: role === 'doctor' ? clinicName : undefined,
            consultationFee: role === 'doctor' ? consultationFee : undefined,
            availability: role === 'doctor' ? parsedAvailability : undefined,
            licenseNumber: role === 'doctor' ? registrationNumber : undefined,
            bio: role === 'doctor' ? bio : undefined,
            location: role === 'doctor' ? location : undefined,
        });

        await user.save();

        // Generate token for auto-login
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user without password
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            address: user.address,
            medicalHistory: user.medicalHistory,
            specialization: user.specialization,
            qualification: user.qualification,
            experience: user.experience,
            clinicName: user.clinicName,
            consultationFee: user.consultationFee,
            availability: user.availability,
            licenseNumber: user.licenseNumber,
            bio: user.bio,
            location: user.location,
            bloodGroup: user.bloodGroup
        };

        res.status(201).json({ 
            success: true, 
            data: { 
                user: userResponse,
                token 
            },
            message: 'User registered successfully' 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;
        console.log("Entered Email:", email);
        const user = await User.findOne({ email: email.toLowerCase() });
        console.log("DB User:", user);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await user.comparePassword(password);
        console.log("Password Match:", isMatch);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return full user details without password
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            bloodGroup: user.bloodGroup,
            address: user.address,
            medicalHistory: user.medicalHistory,
            specialization: user.specialization,
            qualification: user.qualification,
            experience: user.experience,
            clinicName: user.clinicName,
            consultationFee: user.consultationFee,
            availability: user.availability,
            licenseNumber: user.licenseNumber,
            bio: user.bio,
            location: user.location
        };

        res.json({
            success: true,
            data: {
                user: userResponse,
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in login',
            error: error.message
        });
    }
});

// Get current user route
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data'
        });
    }
});

module.exports = router; 