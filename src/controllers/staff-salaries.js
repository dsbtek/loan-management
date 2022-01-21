'use strict';
module.exports = (sequelize, DataTypes) => {
    const Salary = sequelize.define('Salaries', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL,
            allowNull: false,
        },
        effectiveDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        paid: DataTypes.BOOLEAN,
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

    Salary.associate = (models) => {
        Salary.belongsTo(models.Staff, {
            foreignKey: 'staff',
            onDelete: 'CASCADE',
        });
        Salary.belongsTo(models.User, { foreignKey: 'addedBy'});
    };
    


    return Salary;


};