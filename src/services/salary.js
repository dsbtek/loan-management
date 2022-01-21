'use strict';
// let User = require('../models/users');
const db = require('../db/models/index');
const Op = db.Sequelize.Op;
let User = db.User;
const bcrypt = require('bcryptjs');
const { returnOnlyArrayProperties } = require('../utilities/helpers');

class SalaryService {
    async getUser (userId) {
        let query = {id: userId, deleted:{[Op.ne]: true}};
        let user = await User.findOne({where: query, attributes: db.attributes.user
        });
        return user;
    }
    async getDeductions(query, limit, offset) {
        return await db.PayItem.findAndCountAll({
            where: query, 
            // attributes: db.attributes.userShort, 
            limit, 
            offset,
            order: [['createdAt', 'DESC']]

        });
    }

    async getSalaries(query, limit, offset) {
        return await db.Salaries.findAndCountAll({
            where: query, 
            attributes: db.attributes.userShort, 
            limit, 
            offset,
            order: [['createdAt', 'DESC']]

        });
    }
    async generateToken(user){
        let u = await User.generateToken(user);
        return u;
    }
}


module.exports = new SalaryService();