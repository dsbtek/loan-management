'use strict';

//to remove
module.exports = (sequelize, DataTypes) => {
    const Contribution = sequelize.define('Contribution', {
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

    Contribution.associate = (models) => {
        Contribution.belongsTo(models.Staff, {
            foreignKey: 'member',
            onDelete: 'CASCADE',
        });

        Contribution.belongsTo(models.User, { foreignKey: 'addedBy'});
    };
    


    return Contribution;


};