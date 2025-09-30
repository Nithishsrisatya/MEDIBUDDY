const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth.middleware');
const NotificationService = require('../services/notificationService');

// Get user notifications
router.get('/', auth, async (req, res) => {
    try {
        const { unreadOnly } = req.query;
        const notifications = await NotificationService.getUserNotifications(
            req.user._id,
            unreadOnly === 'true'
        );

        res.json({
            success: true,
            data: { notifications }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
    try {
        const notification = await NotificationService.markAsRead(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            data: { notification }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
