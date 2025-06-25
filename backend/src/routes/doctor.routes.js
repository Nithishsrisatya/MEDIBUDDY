const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Get all doctors
router.get('/', auth, async (req, res) => {
    try {
        const { specialization, name } = req.query;
        let query = { role: 'doctor' };

        if (specialization) {
            query.specialization = new RegExp(specialization, 'i');
        }

        if (name) {
            query.name = new RegExp(name, 'i');
        }

        const doctors = await User.find(query)
            .select('name specialization qualification experience availability')
            .sort('name');

        res.json({
            success: true,
            data: { doctors }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctors',
            error: error.message
        });
    }
});

// Get doctor by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const doctor = await User.findOne({
            _id: req.params.id,
            role: 'doctor'
        }).select('-password');

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.json({
            success: true,
            data: { doctor }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor details',
            error: error.message
        });
    }
});

// Update doctor availability
router.patch('/:id/availability', auth, checkRole(['doctor']), async (req, res) => {
    try {
        const { availability } = req.body;
        
        if (!Array.isArray(availability)) {
            return res.status(400).json({
                success: false,
                message: 'Availability must be an array'
            });
        }

        // Validate each availability slot
        for (const slot of availability) {
            if (!slot.day || !slot.startTime || !slot.endTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Each availability slot must have day, startTime, and endTime'
                });
            }
        }

        const doctor = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                role: 'doctor'
            },
            { availability },
            { new: true }
        ).select('-password');

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.json({
            success: true,
            data: { doctor }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating doctor availability',
            error: error.message
        });
    }
});

// Get doctor's statistics
router.get('/:id/stats', auth, checkRole(['doctor', 'admin']), async (req, res) => {
    try {
        const doctor = await User.findOne({
            _id: req.params.id,
            role: 'doctor'
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Get appointment statistics
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const stats = await Appointment.aggregate([
            {
                $match: {
                    doctor: doctor._id,
                    dateTime: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: { stats }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor statistics',
            error: error.message
        });
    }
});

module.exports = router; 