'use strict';
module.exports = (sequelize, DataTypes) => {
    const Staff = sequelize.define('Staff', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        dateJoined: DataTypes.DATE,
        staffId: DataTypes.STRING,
        PN: DataTypes.STRING,
        status: { 
            type: DataTypes.STRING, 
            defaultValue: 'inactive',
            values : ['inactive', 'active', 'blocked', 'disabled']
        },

    });
    return Staff;

       
};