'use strict';

module.exports = (sequelize, DataTypes) => {
    const Adashi = sequelize.define('Adashi', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        name: DataTypes.STRING,
        duration: DataTypes.STRING,
        amount: DataTypes.INTEGER,
        currency: DataTypes.STRING,
        numberOfParticipants: DataTypes.INTEGER,
        status: { 
            type: DataTypes.STRING, 
            defaultValue: 'inactive',
            values : ['inactive', 'active', 'blocked', 'in progress', 'completed']
        },
    });
    Adashi.associate = (models) => {
        Adashi.belongsToMany(models.User, { as: 'participants', through: 'AdashiParticipant'});

    };
    return Adashi;
};