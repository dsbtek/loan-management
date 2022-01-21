'use strict';

module.exports = (sequelize, DataTypes) => {
    const ActivityLog = sequelize.define('ActivityLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        level: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        objectId: {
            type: DataTypes.UUID,
        },
        error: DataTypes.JSONB,
        status: DataTypes.STRING,
        action: DataTypes.STRING,
        category: DataTypes.STRING,
        type: DataTypes.STRING,
        message: DataTypes.STRING,
    });

    ActivityLog.associate = (models) => {
    };
    return ActivityLog;
};