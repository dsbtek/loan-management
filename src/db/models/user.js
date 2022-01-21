'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV1,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING,
            validate: { isEmail: true },
        },
        phoneNumber: {
            type: DataTypes.STRING,
        },
        firstName: DataTypes.STRING,
        middleName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        dateOfBirth: DataTypes.DATE,
        username: DataTypes.STRING,
        salutation: DataTypes.STRING,
        isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false},
        isSuperadmin: { type: DataTypes.BOOLEAN, defaultValue: false},
        gender: DataTypes.STRING,
        maritalStatus: DataTypes.STRING,
        acceptedTerms: { type: DataTypes.BOOLEAN, defaultValue: false},
        bvn: DataTypes.STRING,
        nin: DataTypes.STRING,
        pics: DataTypes.STRING,
        token: DataTypes.STRING,
        tokenCreatedAt: DataTypes.DATE,
        attemptCount: DataTypes.INTEGER,
        timeLocked: DataTypes.DATE,
        accountLocked: DataTypes.BOOLEAN,
        numbers: DataTypes.STRING,
        emails: DataTypes.STRING,
        verifiedNumbers: DataTypes.STRING,
        verifiedEmails: DataTypes.STRING,
        status: { 
            type: DataTypes.STRING, 
            defaultValue: 'inactive',
            values : ['inactive', 'active', 'blocked', 'disabled']
        },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
        lastLogin: DataTypes.DATE,
        type: { type: DataTypes.STRING, defaultValue: 'user' },
        password: {
            type: DataTypes.STRING,
            allowNULL: false,
            validate:{len: [8, 64]}
        },
        deleted: { type: DataTypes.BOOLEAN, defaultValue: false},
        dateDeleted: DataTypes.DATE,
    },
    {
        hooks: {
            beforeCreate: async function(user) {
                if (!user.password ) return;
                user.password = await bcrypt.hash(user.password, 8);
                // user = convertArrayToStrings(user);
            },
            // beforeSave: function(user) {
            //     user = convertArrayToStrings(user);
            // },
            // beforeUpdate: function(user) {
            //     user = convertArrayToStrings(user);
            // },
            beforeUpsert: function(user) {
                user = convertArrayToStrings(user);
            },
            afterFind: function(result) {
                if (! result) return ;
                if(result.constructor === Array) {
                    for (let val of result) {
                        // if (val.emails) val.emails = val.emails.split(',');
                        // else val.emails = [];
                        // if (val.numbers) val.numbers = val.numbers.split(',');
                        // else val.numbers = [];
                        val = convertStringsToArray(val);
                    }
                } else {
                    // if (result.emails) result.emails = result.emails.split(',');
                    // else result.emails = [];
                    // if (result.numbers) result.numbers = result.numbers.split(',');
                    // else result.numbers = [];

                }
                return result;
            }
        },
   
    });

    User.associate = (models) => {
        User.hasOne(User, {as: 'creator'});
        //contacts
        // User.hasMany(models.Email, { foreignKey: 'userId' });

        // User.hasMany(models.Phone, { foreignKey: 'userId' });
        // User.belongsTo(models.Phone, { as: 'phoneNumber', constraints: false }); 
        User.hasOne(models.UserConfig, {foreignKey: 'config', onDelete: 'cascade'});
        
        User.hasMany(models.Address, { foreignKey: 'userId' });
        
        User.belongsTo(models.Address, { as: 'currentAddress', constraints: false }); 
        
        //accounts
        User.belongsTo(models.AccountNumber, { as: 'currentAccount', constraints: false });
        
     
        
        // company
        User.belongsToMany(models.Company, { as: 'company', through: 'Staff'});
    

        // adashi
        User.hasOne(models.Adashi, {as: 'initiator'});
        User.belongsToMany(models.Adashi, { as: 'adashi', through: 'AdashiParticipant' });

        User.hasMany(models.ActivityLog, { foreignKey: 'userId' });
        User.hasMany(models.Token, {
            foreignKey: 'userId',
            as: 'tokens',
        });

    };

    User.generateToken = async (user) => {
        user.token = jwt.sign({id: user.id}, process.env.JWT_KEY, {expiresIn: process.env.JWT_EXPIRES_IN} );
        await user.save();
        return user.token;
    };
    User.prototype.checkPassword  = async (password, oldPassword) => {
        return await bcrypt.compare(password, oldPassword);
    };
    User.prototype.setNewPassword  = async (password, user) => {
        user.password = await bcrypt.hash(password, 8);
        await user.save();
    };

    return User;
};

function convertStringsToArray(user){
    if (user.emails) user.emails = user.emails.split(',');
    else user.emails = [];
    if (user.numbers) user.numbers = user.numbers.split(',');
    else user.numbers = [];
    return user;

}

function convertArrayToStrings(user){
    if (user.emails) user.emails = user.emails.join(',');
    else user.emails = '';
    if (user.numbers) user.numbers = user.numbers.join(',');
    else user.numbers = '';
    return user;

}