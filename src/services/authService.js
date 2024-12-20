/**
 * Serviço responsável pela autenticação e gerenciamento de usuários
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const CustomError = require('../utils/CustomError');

class AuthService {
    /**
     * Gera tokens JWT para autenticação
     * @param {string} userId - ID do usuário
     * @returns {Object} Tokens de acesso e refresh
     */
    generateTokens(userId) {
        const token = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            { id: userId },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
        );

        return { token, refreshToken };
    }

    /**
     * Registra um novo usuário
     * @param {Object} userData - Dados do usuário
     * @returns {Object} Usuário criado e tokens
     */
    async register(userData) {
        // Validação básica dos dados
        if (!userData.email || !userData.password || !userData.name) {
            throw new CustomError('Dados incompletos', 400);
        }

        // Validação de senha
        if (userData.password.length < 6) {
            throw new CustomError('A senha deve ter no mínimo 6 caracteres', 400);
        }

        try {
            const hashedPassword = await bcrypt.hash(userData.password, 8);
            
            const user = await prisma.user.create({
                data: {
                    name: userData.name,
                    email: userData.email.toLowerCase(),
                    password: hashedPassword
                },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            });

            const tokens = this.generateTokens(user.id);

            return {
                user,
                ...tokens
            };
        } catch (error) {
            if (error.code === 'P2002') {
                throw new CustomError('Email já cadastrado', 400);
            }
            throw new CustomError('Erro ao criar usuário', 500);
        }
    }

    /**
     * Realiza o login do usuário
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     * @returns {Object} Dados do usuário e tokens
     */
    async login(email, password) {
        if (!email || !password) {
            throw new CustomError('Email e senha são obrigatórios', 400);
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            throw new CustomError('Credenciais inválidas', 401);
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            throw new CustomError('Credenciais inválidas', 401);
        }

        const tokens = this.generateTokens(user.id);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            ...tokens
        };
    }

    /**
     * Atualiza o token de acesso usando o refresh token
     * @param {string} refreshToken - Refresh token atual
     * @returns {Object} Novos tokens
     */
    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (!user) {
                throw new CustomError('Usuário não encontrado', 404);
            }

            return this.generateTokens(user.id);
        } catch (error) {
            throw new CustomError('Refresh token inválido', 401);
        }
    }
}

module.exports = new AuthService(); 