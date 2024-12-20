const prisma = require('../config/prisma');
const CustomError = require('../utils/CustomError');

class NotificationService {
    async getNotifications(userId) {
        return prisma.notification.findMany({
            where: {
                receiverId: userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
    }

    async markAsRead(notificationId, userId) {
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                receiverId: userId
            }
        });

        if (!notification) {
            throw new CustomError('Notificação não encontrada', 404);
        }

        return prisma.notification.update({
            where: { id: notificationId },
            data: { read: true }
        });
    }

    async getUnreadCount(userId) {
        return prisma.notification.count({
            where: {
                receiverId: userId,
                read: false
            }
        });
    }

    async deleteNotification(notificationId, userId) {
        try {
            const notification = await prisma.notification.findFirst({
                where: {
                    id: notificationId,
                    receiverId: userId
                }
            });

            if (!notification) {
                throw new CustomError('Notificação não encontrada', 404);
            }

            // Se for uma notificação de solicitação de amizade, deleta também a amizade
            if (notification.type === 'FRIEND_REQUEST' && notification.friendshipId) {
                await prisma.$transaction(async (tx) => {
                    await tx.friendship.delete({
                        where: {
                            id: notification.friendshipId
                        }
                    });

                    await tx.notification.delete({
                        where: {
                            id: notificationId
                        }
                    });
                });
            } else {
                // Se não for solicitação de amizade, apenas deleta a notificação
                await prisma.notification.delete({
                    where: {
                        id: notificationId
                    }
                });
            }

            return { message: 'Notificação deletada com sucesso' };
        } catch (error) {
            console.error('Erro ao deletar notificação:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Erro ao deletar notificação', 500);
        }
    }
}

module.exports = new NotificationService(); 