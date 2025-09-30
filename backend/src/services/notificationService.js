const Notification = require('../models/notification.model');

class NotificationService {
    static async createNotification(userId, type, message) {
        const notification = new Notification({
            user: userId,
            type,
            message
        });
        await notification.save();
        return notification;
    }

    static async getUserNotifications(userId, unreadOnly = false) {
        const filter = { user: userId };
        if (unreadOnly) {
            filter.read = false;
        }
        return Notification.find(filter).sort({ createdAt: -1 });
    }

    static async markAsRead(notificationId) {
        return Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
    }
}

module.exports = NotificationService;
