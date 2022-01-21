'use strict';
module.exports = (sequelize, DataTypes) => {
    const AccountNumber = sequelize.define('AccountNumber', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
        },
        number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        bank: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    });
    return AccountNumber;
};