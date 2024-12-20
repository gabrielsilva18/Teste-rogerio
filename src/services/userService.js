const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const CustomError = require('../utils/CustomError');

class UserService {
    async create(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 8);
        
        try {
            const user = await prisma.user.create({
                data: {
                    ...userData,
                    password: hashedPassword
                },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            });
            return user;
        } catch (error) {
            if (error.code === 'P2002') {
                throw new CustomError('Email já cadastrado', 400);
            }
            throw error;
        }
    }

    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { email }
        });
    }
}

module.exports = new UserService(); 