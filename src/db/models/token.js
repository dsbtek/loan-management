'use strict';
module.exports = (sequelize, DataTypes) => {
    const Token = sequelize.define('Token', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        value: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        type: DataTypes.STRING,
        verified: DataTypes.BOOLEAN,
        dateCreated: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
    });
    Token.associate = (models) => {
        // Token.belongsTo(models.User, {
        //     foreignKey: 'userId',
        //     onDelete: 'CASCADE',
        // });
    };
  
    return Token;
};