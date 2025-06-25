const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Validation middleware
const appointmentValidation = [
    body('doctor').notEmpty().withMessage('Doctor ID is required'),
    body('dateTime').isISO8601().withMessage('Valid date and time is required'),
    body('type').isIn(['in-person', 'video-consultation']).withMessage('Invalid appointment type'),
    body('symptoms').notEmpty().withMessage('Symptoms are required'),
    body('paymentAmount').isNumeric().withMessage('Valid payment amount is required')
];

// Create appointment
router.post('/', auth, appointmentValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const doctor = await User.findOne({ _id: req.body.doctor, role: 'doctor' });
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Check for existing appointments at the same time
        const existingAppointment = await Appointment.findOne({
            doctor: req.body.doctor,
            dateTime: req.body.dateTime,
            status: 'scheduled'
        });

        if (existingAppointment) {
            return res.status(400).json({
                success: false,
                message: 'This time slot is already booked'
            });
        }

        const appointment = new Appointment({
            ...req.body,
            patient: req.user._id
        });

        await appointment.save();

        res.status(201).json({
            success: true,
            data: { appointment }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating appointment',
            error: error.message
        });
    }
});

// Get user's appointments
router.get('/my-appointments', auth, async (req, res) => {
    try {
        const appointments = await Appointment.find({
            [req.user.role === 'doctor' ? 'doctor' : 'patient']: req.user._id
        })
        .populate('doctor', 'name specialization')
        .populate('patient', 'name')
        .sort({ dateTime: -1 });

        res.json({
            success: true,
            data: { appointments }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching appointments',
            error: error.message
        });
    }
});

// Update appointment status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check if user has permission to update
        if (
            req.user.role !== 'admin' &&
            appointment.doctor.toString() !== req.user._id.toString() &&
            appointment.patient.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this appointment'
            });
        }

        // Validate status change
        if (status === 'cancelled' && !appointment.canBeCancelled()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel appointment less than 24 hours before scheduled time'
            });
        }

        appointment.status = status;
        await appointment.save();

        res.json({
            success: true,
            data: { appointment }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating appointment status',
            error: error.message
        });
    }
});

// Get doctor's availability
router.get('/doctor/:doctorId/availability', auth, async (req, res) => {
    try {
        const doctor = await User.findOne({
            _id: req.params.doctorId,
            role: 'doctor'
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Get booked appointments for next 7 days
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);

        const bookedSlots = await Appointment.find({
            doctor: doctor._id,
            dateTime: { $gte: startDate, $lte: endDate },
            status: 'scheduled'
        }).select('dateTime duration');

        res.json({
            success: true,
            data: {
                availability: doctor.availability,
                bookedSlots
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor availability',
            error: error.message
        });
    }
});

module.exports = router; 