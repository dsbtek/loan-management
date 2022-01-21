'use strict';
module.exports = (sequelize, DataTypes) => {
    const Email = sequelize.define('Email', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING,
            validate: { isEmail: true },
            allowNull: false,
        },
        verified: DataTypes.BOOLEAN,
        dateVerified: DataTypes.DATE,
    });
    return Email;
};