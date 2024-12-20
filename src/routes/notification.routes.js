const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/', notificationController.getNotifications);
router.post('/:notificationId/read', notificationController.markAsRead);
router.get('/unread-count', notificationController.getUnreadCount);
router.delete('/:notificationId', notificationController.deleteNotification);
router.get('/event-invites', notificationController.getEventInvites);

module.exports = router; 