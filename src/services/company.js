'use strict';
// let Company = require('../models/users');
const db = require('../db/models/index');
const Op = db.Sequelize.Op;
let Company = db.Company;
const bcrypt = require('bcryptjs');
const { returnOnlyArrayProperties } = require('../utilities/helpers');

class CompanyService {
    async getUser (userId) {
        let query = {id: userId, deleted:{[Op.ne]: true}};
        let company = await Company.findOne({where: query, attributes: db.attributes.company
        });
        return company;
    }
    async getUsers (query, page, limit) {
        try {
            query.deleted = {[Op.ne]: true};
            return await Company.findAll({where: query, attributes: db.attributes.company, order: [['createdAt', 'DESC']]});
        } catch (e) {
            throw new Error(e);
        }
    }
    async getRegisteredCompanies (name, cac) {
        try {
            let others = [{name}];
            if (cac) others.push({cac});
            const query = {
                [Op.or] : others
            };
            return await Company.findAll({
                where: query, 
                attributes: db.attributes.company, 
                order: [['createdAt', 'DESC']]
            });
        } catch (e) {
            throw new Error(e);
        }
    }
    async createCompany (body) {
        try{
            return await Company.create(body);  
        }
        catch(err){
            throw new Error(err);
        }
    }

    async updateUser (userId, body) {
        let company = await Company.findByPk(userId);
        if (body.password) body.password = await bcrypt.hash(body.password, 8);
        Object.keys(body).forEach(k => {
            company[k] = body[k];
        });
        company = await company.save();
        return returnOnlyArrayProperties(company, db.attributes.company, true);     

    }

    async deleteUser (userId){
        let company = await Company.findByPk(userId);
        if(company) throw Error();
        company.deleted = true;
        await company.save();
    }

    async verifyUser(value, password){
        let company;
        company = await Company.findAll({where: {deleted: {[Op.ne]: true}, email: value, type: 'company'}} );
        if(company.length < 1) company = await Company.findAll({where: {deleted: {[Op.ne]: true}, phoneNumber: value, type: 'company'}} );
        if (company.length < 1) {
            throw new Error('Invalid username or password');
        }
        company = company[company.length - 1];
        // if (company.accountLocked && withinLockedHours(company.timeLocked)) throw new Error('Account has been blocked. Try again in a few hours');
        const isPasswordMatch = await bcrypt.compare(password, company.password);
        if (!isPasswordMatch) {
            throw new Error('Invalid username or password');

            // if(!company.attemptCount || company.attemptCount < 5) {
            //     company.attemptCount = company.attemptCount + 1;
            //     company.save();
            //     throw new Error(`Invalid username or password, you have ${5- company.attemptCount} attempts left`);
            // } else { 
            //     company.attemptCount = 0;
            //     company.accountLocked = true;
            //     company.timeLocked = new Date();
            //     company.save();
            //     throw new Error('Account has been blocked. Try again in a few hours');
            // }
        }
        // if (company.attemptCount || company.accountLocked) {
        //     company.attemptCount = 0;
        //     company.accountLocked = false;
        //     company.save();
        // }
        return company;
    }

    async generateToken(company){
        let u = await Company.generateToken(company);
        return u;
    }
}


function withinLockedHours(dt1){
    let diff =(new Date().getTime() - dt1.getTime()) / 1000;
    let minutes = (process.env.LOCK_HOURS || 2 ) * 60 * 60;
    return diff < minutes;
}

module.exports = new CompanyService();