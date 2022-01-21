'use strict';

//to remove
module.exports = (sequelize, DataTypes) => {
    const StaffSalary = sequelize.define('StaffSalary', {
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
            type: DataTypes.NUMERIC,
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

    StaffSalary.associate = (models) => {
        StaffSalary.belongsTo(models.Staff, {
            foreignKey: 'staff',
            onDelete: 'CASCADE',
        });
        StaffSalary.belongsTo(models.User, { foreignKey: 'addedBy'});
    };
    


    return StaffSalary;


};