'use strict';
const bcrypt = require('bcryptjs');
require('dotenv').config();
const {v4} = require('uuid');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const password =  process.env.SUPERADMIN_PASSWORD || 'defaultpassword';
        // console.log(process.env.SUPERADMIN_EMAIL, process.env.SUPERADMIN_PASSWORD);
        return queryInterface.bulkInsert('Users', [{
            email: process.env.SUPERADMIN_EMAIL,
            password: await bcrypt.hash(password, 8),
            isAdmin: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            firstName: 'Admin',
            lastName: 'Admin',
            type: 'user',
            phoneNumber: '+15478933216623',
            id: v4()
        }]);
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('Users', { email: process.env.SUPERADMIN_EMAIL }, {});
    }
};




