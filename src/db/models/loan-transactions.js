'use strict';

module.exports = (sequelize, DataTypes) => {
    const LoanTransaction = sequelize.define('LoanTransaction', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        cleared: {type: DataTypes.BOOLEAN,  defaultValue: false,}, // lender clears
        notify: DataTypes.BOOLEAN, // notify and reminder date
        notification: DataTypes.JSONB, // notify and reminder date {days before} number of days before and once, on every day 
        dateCleared: DataTypes.DATE,
        remarks: DataTypes.STRING,
        deleted: {type: DataTypes.BOOLEAN,  defaultValue: false,},
        dateDeleted: {type: DataTypes.BOOLEAN,  defaultValue: false,},
        dateRequested: DataTypes.DATE,
        approvalDate: DataTypes.DATE,
        approvalStatus: DataTypes.STRING,
        approvalComments: DataTypes.STRING,
        confirmed: {type: DataTypes.BOOLEAN,  defaultValue: false,}, // lender clears
        dateConfirmed: DataTypes.DATE,
    }); 

    LoanTransaction.associate = (models) => {
        // LoanTransaction.belongsTo(models.Loan, );
        LoanTransaction.belongsTo(models.User, {foreignKey: 'userId'});
        
    };
    return LoanTransaction;
};