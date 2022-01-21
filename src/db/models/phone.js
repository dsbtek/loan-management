'use strict';
module.exports = (sequelize, DataTypes) => {
    const Phone = sequelize.define('Phone', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        verified: DataTypes.BOOLEAN,
        dateVerified: DataTypes.DATE,

    });
    return Phone;
};