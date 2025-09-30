const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth.middleware');
const DoctorService = require('../services/doctorService');
const AppointmentService = require('../services/appointmentService');
const PatientService = require('../services/patientService');
const NotificationService = require('../services/notificationService');

// Get all doctors
router.get('/', auth, async (req, res) => {
    try {
        const { specialization, name } = req.query;
        const doctors = await DoctorService.getAllDoctors({ specialization, name });

        res.json({
            success: true,
            data: { doctors }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get doctor by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const doctor = await DoctorService.getDoctorById(req.params.id);

        res.json({
            success: true,
            data: { doctor }
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update doctor availability
router.patch('/:id/availability', auth, checkRole(['doctor']), async (req, res) => {
    try {
        const { availability } = req.body;
        const doctor = await DoctorService.updateDoctorAvailability(req.params.id, availability);

        res.json({
            success: true,
            data: { doctor }
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get doctor's statistics
router.get('/:id/stats', auth, checkRole(['doctor', 'admin']), async (req, res) => {
    try {
        const stats = await DoctorService.getDoctorStats(req.params.id);

        res.json({
            success: true,
            data: { stats }
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Set sample availability for all doctors (for testing)
router.post('/set-sample-availability', async (req, res) => {
    try {
        const sampleAvailability = [
            { day: 'Monday', startTime: '09:00', endTime: '17:00' },
            { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
            { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
            { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
            { day: 'Friday', startTime: '09:00', endTime: '17:00' },
            { day: 'Saturday', startTime: '10:00', endTime: '14:00' }
        ];

        const result = await DoctorService.setSampleAvailability(sampleAvailability);

        res.json({
            success: true,
            message: `Updated availability for ${result.modifiedCount} doctors`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Get doctor's upcoming appointments
router.get('/:id/appointments/upcoming', auth, checkRole(['doctor', 'admin']), async (req, res) => {
    try {
        const doctorId = req.params.id;

        // Check if the requesting user is the doctor themselves or an admin
        if (req.user.role === 'doctor' && req.user._id.toString() !== doctorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own appointments.'
            });
        }

        const appointments = await AppointmentService.getDoctorUpcomingAppointments(doctorId);

        res.json({
            success: true,
            data: { appointments }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get patients seen by doctor
router.get('/:id/patients', auth, checkRole(['doctor', 'admin']), async (req, res) => {
    try {
        const doctorId = req.params.id;

        // Check if the requesting user is the doctor themselves or an admin
        if (req.user.role === 'doctor' && req.user._id.toString() !== doctorId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own patients.'
            });
        }

        const patients = await PatientService.getDoctorPatients(doctorId);

        res.json({
            success: true,
            data: { patients }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update doctor's online status
router.patch('/:id/online', auth, checkRole(['doctor']), async (req, res) => {
    try {
        const { online } = req.body;
        const doctor = await DoctorService.updateDoctorOnlineStatus(req.params.id, online);

        res.json({
            success: true,
            data: { doctor }
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
