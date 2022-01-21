'use strict';

module.exports = (sequelize, DataTypes) => {
    const Company = sequelize.define('Company', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        name: DataTypes.STRING,
        mision: DataTypes.STRING,
        vision: DataTypes.STRING,
        dateIncorporated: DataTypes.DATE,
        dateStarted: DataTypes.DATE,
        cac: DataTypes.STRING,
        PN: DataTypes.STRING,
        // admins: [{ type: DataTypes.BOOLEAN, defaultValue: false}],
        // complianceOfficers: [{ type: DataTypes.BOOLEAN, defaultValue: false}],
        status: { 
            type: DataTypes.STRING, 
            defaultValue: 'inactive',
            values : ['inactive', 'active', 'blocked', 'disabled']
        },
    });

    Company.associate = (db) => {
        db.Company.belongsTo(db.User, { as: 'user', foreignKey: 'userId'}); 
        db.Company.belongsToMany(db.User, { as: 'staff', through: 'Staff'});

        db.Company.belongsTo(db.Address, { as: 'currentAddress', constraints: false }); 
        db.Company.belongsTo(db.Email, { as: 'email', constraints: false }); 
        db.Company.belongsTo(db.Phone, { as: 'phone', constraints: false }); 

        // Company.belongsTo(models.User, { as: 'user', foreignKey: 'userId'}); 
        // Company.belongsToMany(models.User, { as: 'member', through: 'Staff'});
    };
    return Company;
};