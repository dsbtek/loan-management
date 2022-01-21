'use strict';
module.exports = (sequelize, DataTypes) => {
    const Address = sequelize.define('Address', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        street: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        houseNumber: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        state: DataTypes.STRING,
        lga: DataTypes.STRING,
        country: DataTypes.STRING,
    });
    return Address;
};