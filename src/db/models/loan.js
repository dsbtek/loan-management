'use strict';

module.exports = (sequelize, DataTypes) => {
    const Loan = sequelize.define('Loan', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        lender: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        assets: DataTypes.STRING,
        type: {type: DataTypes.STRING,  defaultValue: 'money',}, //money or other assets
        amount: DataTypes.INTEGER,
        quantity: DataTypes.INTEGER,
        cleared: {type: DataTypes.BOOLEAN,  defaultValue: false,}, // lender clears
        dateTaken: DataTypes.DATE,
        lenderNotification: DataTypes.JSONB, // notify and reminder date
        userNotification: DataTypes.JSONB,
        lenderCleared: DataTypes.JSONB,
        userCleared: DataTypes.JSONB, // c
        duration: DataTypes.JSONB, // notify and reminder date {days before} number of days before and once, on every day 
        dateToRepay: DataTypes.DATE,
        dateCleared: DataTypes.DATE,
        repaymentType: DataTypes.STRING, //once 1, several(repeated) 2, several(custom)3
        allowClaim: {type: DataTypes.BOOLEAN,  defaultValue: true,}, // other user accepted loan
        allowDiscovery: {type: DataTypes.BOOLEAN,  defaultValue: true,}, // other user accepted loan
        claimed: {type: DataTypes.BOOLEAN,  defaultValue: false,}, // other user accepted loan
        // allowEdit: {type: DataTypes.BOOLEAN,  defaultValue: false,}, // allow other user modify loan details
        repaymentOptions: DataTypes.JSONB,
        security: DataTypes.STRING,
        urgency: DataTypes.STRING,
        status: DataTypes.STRING,
        dateRequested: DataTypes.DATE,
        approvalDate: DataTypes.DATE,
        approvalStatus: DataTypes.STRING,
        approvalComments: DataTypes.STRING,
        confirmed: {type: DataTypes.BOOLEAN,  defaultValue: false,}, // lender clears
        deleted: {type: DataTypes.BOOLEAN,  defaultValue: false,}, // lender clears
        lenderDeleted: {type: DataTypes.BOOLEAN,  defaultValue: false,}, // lender clears
        dateConfirmed: DataTypes.DATE,
        //add approver (for cooperatives)
    }); 


    Loan.associate = (models) => {
        Loan.belongsTo(models.User, { as: 'creator', onDelete: 'CASCADE'});

        Loan.belongsTo(models.User, { as: 'User', foreignKey: 'userId', onDelete: 'CASCADE'});
        Loan.belongsTo(models.User, { as: 'Lender', foreignKey: 'lender', onDelete: 'CASCADE' });

        Loan.hasMany(models.Offset, {
            foreignKey: 'loanId',
            as: 'offsets',
        });
    };
    Loan.prototype.isOwner = function (userId){
        return this.userId === userId;
    };
    
    return Loan;
};