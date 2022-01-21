'use strict';

module.exports = (sequelize, DataTypes) => {
    const Config = sequelize.define('UserConfig', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        guarantor: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        reminderDays: {type: DataTypes.INTEGER, defaultValue: 7},
        currency: {type: DataTypes.STRING},
        notification: {type: DataTypes.BOOLEAN, defaultValue: true },
        acceptedInactiveDays: {type:DataTypes.INTEGER, defaultValue: 30},
        sendDetailsToGuarantor: {type: DataTypes.BOOLEAN, defaultValue: true },

    });

    Config.associate = (models) => {
       
    };
    return Config;
};