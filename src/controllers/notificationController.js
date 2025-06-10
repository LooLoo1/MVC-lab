const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all notifications for the current user
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.session.userId })
            .populate('sender', 'name email')
            .populate('team', 'name')
            .populate('project', 'name')
            .populate('task', 'title')
            .sort({ createdAt: -1 });

        res.render('notifications/index', {
            notifications,
            title: 'Notifications',
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (error) {
        res.render('notifications/index', {
            notifications: [],
            title: 'Notifications',
            error: 'Failed to load notifications',
            success: null
        });
    }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ 
                success: false, 
                error: 'Notification not found' 
            });
        }

        if (notification.recipient.toString() !== req.session.userId) {
            return res.status(403).json({ 
                success: false, 
                error: 'Not authorized to mark this notification as read' 
            });
        }

        notification.read = true;
        await notification.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to mark notification as read' 
        });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { 
                recipient: req.session.userId,
                read: false 
            },
            { 
                $set: { read: true } 
            }
        );

        res.json({ 
            success: true,
            message: `Marked ${result.modifiedCount} notifications as read`
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to mark notifications as read' 
        });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ 
                success: false, 
                error: 'Notification not found' 
            });
        }

        if (notification.recipient.toString() !== req.session.userId) {
            return res.status(403).json({ 
                success: false, 
                error: 'Not authorized to delete this notification' 
            });
        }

        await notification.deleteOne();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete notification' 
        });
    }
};

// Helper function to create a notification
exports.createNotification = async (data) => {
    try {
        const notification = new Notification(data);
        await notification.save();
        return notification;
    } catch (error) {
        throw error;
    }
};

// Get unread notifications count
exports.getUnreadCount = async (req, res, next) => {
    try {
        if (req.session.userId) {
            const count = await Notification.countDocuments({
                recipient: req.session.userId,
                read: false
            });
            res.locals.unreadNotifications = count;
        }
        next();
    } catch (error) {
        res.locals.unreadNotifications = 0;
        next();
    }
}; 