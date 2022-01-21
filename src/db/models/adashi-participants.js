'use strict';
module.exports = (sequelize, DataTypes) => {
    const AdashiParticipant = sequelize.define('AdashiParticipant', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        dateJoined: DataTypes.DATE,
        position: DataTypes.INTEGER,
        
    });
    return AdashiParticipant;
};