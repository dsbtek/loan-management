'use strict';

module.exports = (sequelize, DataTypes) => {
    const Offset = sequelize.define('Offset', {
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
        parent: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Offsets',
                key: 'id'
            }
        },
        amount: DataTypes.INTEGER,
        date: DataTypes.DATE,
        dateToRepay: DataTypes.DATE,
        remarks: DataTypes.STRING,
        cleared: {type: DataTypes.BOOLEAN,  defaultValue: false,},
    });

    Offset.associate = (models) => {
        Offset.belongsTo(models.Loan, {
            foreignKey: 'loanId',
            onDelete: 'CASCADE',
        });
        Offset.belongsTo(models.Offset, {
            foreignKey: 'parent',
            onDelete: 'CASCADE',
        });
    };
    return Offset;
};