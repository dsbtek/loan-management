'use strict';

module.exports = (sequelize, DataTypes) => {
    const Guarantor = sequelize.define('Guarantor', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        loanId: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Loans',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Loans',
                key: 'id'
            }
        },
        amount: DataTypes.INTEGER,
        dateToRepay: DataTypes.DATE,
        remarks: DataTypes.STRING,
    });

    Guarantor.associate = (models) => {
        Guarantor.belongsTo(models.Loan, {
            foreignKey: 'loanId',
            onDelete: 'CASCADE',
        });
        Guarantor.belongsTo(models.User, {
            foreignKey: 'userId',
            onDelete: 'CASCADE',
        });

    };
    return Guarantor;
};