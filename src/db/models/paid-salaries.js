'use strict';
module.exports = (sequelize, DataTypes) => {
    const PaidSalaries = sequelize.define('PaidSalaries', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        transactionReferencs: DataTypes.STRING,
        amount: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        date: DataTypes.DATE,
        week: DataTypes.STRING,
        month: DataTypes.STRING,
        year: DataTypes.STRING,
        payee: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        staff: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Staffs',
                key: 'id'
            }
        },


    });
    PaidSalaries.associate = (models) => {
        PaidSalaries.belongsTo(models.Staff, {
            foreignKey: 'staff',
            onDelete: 'CASCADE',
        });
        PaidSalaries.belongsTo(models.User, { foreignKey: 'payee'});
    };
    return PaidSalaries;
};