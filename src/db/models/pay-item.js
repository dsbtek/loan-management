'use strict';
module.exports = (sequelize, DataTypes) => {
    const PayItem = sequelize.define('PayItem', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'earnings'
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
        staff: {
            type: DataTypes.UUID,
            foreignKey: true,
            references: {
                model: 'Staffs',
                key: 'id'
            }
        },
    });
    PayItem.associate = (models) => {
        PayItem.belongsTo(models.Staff, {
            foreignKey: 'staff',
            onDelete: 'CASCADE',
        });
        PayItem.belongsTo(models.User, { foreignKey: 'addedBy'});
    };
    return PayItem;
};