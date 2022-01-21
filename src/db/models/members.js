'use strict';
module.exports = (sequelize, DataTypes) => {
    const Member = sequelize.define('Member', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        dateJoined: DataTypes.DATE,
        PN: DataTypes.STRING,
        memberId: DataTypes.STRING,
        status: { 
            type: DataTypes.STRING, 
            defaultValue: 'inactive',
            values : ['inactive', 'active', 'blocked', 'disabled']
        },

    });
    Member.associate = (models) => {
        Member.belongsTo(models.User, { as: 'addedBy', constraints: false }); 
        Member.belongsTo(models.User, { as: 'user', constraints: false, foreignKey: 'UserId' }); 
        Member.belongsTo(models.Company, { as: 'company', constraints: false, foreignKey: 'CompanyId' }); 
        Member.belongsTo(models.Contribution, { as: 'currentContribution', constraints: false }); 

    };
    return Member;


       
};