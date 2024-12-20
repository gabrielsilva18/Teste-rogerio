const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Participant extends Model {}

Participant.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    secretSantaId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'SecretSantas',
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    targetUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    wishList: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Participant'
});

module.exports = Participant; 