'use strict';
module.exports = (sequelize, DataTypes) => {
    const ContributionPayItem = sequelize.define('ContributionPayItem', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'earnings',
            //deposits, withdrawals, deductions, earnings
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        transactionReference: {
            type: DataTypes.STRING,
        },
        timeInterval: {
            type: DataTypes.DECIMAL,
        },
        timeUnit: {
            type: DataTypes.STRING,
        },
        rate: {
            type: DataTypes.DECIMAL,
        },
        amount: {
            type: DataTypes.DECIMAL,
        },
        date: DataTypes.DATE,
        week: DataTypes.STRING,
        month: DataTypes.STRING,
        year: DataTypes.STRING,
        startDate: DataTypes.DATE,
        endDate: DataTypes.DATE,
        addedBy: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        member: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Members',
                key: 'id'
            }
        },
    });
    ContributionPayItem.associate = (models) => {
        ContributionPayItem.belongsTo(models.Staff, {
            foreignKey: 'member',
            onDelete: 'CASCADE',
        });
        ContributionPayItem.belongsTo(models.User, { foreignKey: 'addedBy'});
    };
    return ContributionPayItem;
};