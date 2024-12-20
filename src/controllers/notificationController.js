const notificationService = require('../services/notificationService');
const prisma = require('../config/prisma');

class NotificationController {
    async getNotifications(req, res, next) {
        try {
            const notifications = await notificationService.getNotifications(req.userId);
            res.json(notifications);
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req, res, next) {
        try {
            const { notificationId } = req.params;
            await notificationService.markAsRead(notificationId, req.userId);
            res.json({ message: 'Notificação marcada como lida' });
        } catch (error) {
            next(error);
        }
    }

    async getUnreadCount(req, res, next) {
        try {
            const count = await notificationService.getUnreadCount(req.userId);
            res.json({ count });
        } catch (error) {
            next(error);
        }
    }

    async deleteNotification(req, res, next) {
        try {
            const { notificationId } = req.params;
            await notificationService.deleteNotification(notificationId, req.userId);
            res.json({ message: 'Notificação deletada com sucesso' });
        } catch (error) {
            next(error);
        }
    }

    async getEventInvites(req, res, next) {
        try {
            const invites = await prisma.notification.findMany({
                where: {
                    receiverId: req.userId,
                    type: 'EVENT_INVITE',
                    read: false,
                    secretSantaId: { not: null }
                },
                include: {
                    sender: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    secretSanta: {
                        select: {
                            name: true,
                            date: true,
                            budget: true
                        }
                    }
                }
            });
            console.log('Convites encontrados:', invites);
            res.json(invites);
        } catch (error) {
            console.error('Erro ao buscar convites:', error);
            next(error);
        }
    }
}

module.exports = new NotificationController(); 