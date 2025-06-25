const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/user.model');
const { auth, checkRole } = require('../middleware/auth.middleware');

// Update user profile
router.patch('/profile', auth, [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().trim(),
    body('address').optional().isObject().withMessage('Address must be an object'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const allowedUpdates = ['name', 'phone', 'address', 'dateOfBirth', 'gender'];
        const updates = Object.keys(req.body)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true }
        ).select('-password');

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// Add medical history
router.post('/medical-history', auth, [
    body('condition').notEmpty().withMessage('Condition is required'),
    body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
    body('treatment').notEmpty().withMessage('Treatment is required'),
    body('diagnosedDate').isISO8601().withMessage('Invalid date format')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const user = await User.findById(req.user._id);
        user.medicalHistory.push(req.body);
        await user.save();

        res.status(201).json({
            success: true,
            data: { medicalHistory: user.medicalHistory }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding medical history',
            error: error.message
        });
    }
});

// Get medical history
router.get('/medical-history', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('medicalHistory');

        res.json({
            success: true,
            data: { medicalHistory: user.medicalHistory }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching medical history',
            error: error.message
        });
    }
});

// Delete medical history entry
router.delete('/medical-history/:entryId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.medicalHistory = user.medicalHistory.filter(
            entry => entry._id.toString() !== req.params.entryId
        );
        await user.save();

        res.json({
            success: true,
            message: 'Medical history entry deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting medical history entry',
            error: error.message
        });
    }
});

// Change password
router.post('/change-password', auth, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
});

module.exports = router; 