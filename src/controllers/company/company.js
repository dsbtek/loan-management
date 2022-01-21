'use strict';
const CompanyService = require('../../services/company.js');   
const winston = require('../../services/winston');
const db = require('../../db/models');
const Op = db.Sequelize.Op;
const logger = new winston('User Management');
const { isValidEmail, isValidPhoneNumber } = require('../../utilities/helpers');
const { getPayrollNumber } = require('../../services/encrypt.js');
const frontendUrl = process.env.FRONTEND_URL;



class UserController{
    async createCompany(req, res) {
        try {
            let {email, name, phone, address, logo, cac} = req.body;
            if ( !name || !phone || !address || !email) return res.processError(400, 'Enter required fields');
            let body = { email, name, phone, address, logo, cac };
            body.email = email.toLowerCase();
            if  (!isValidEmail(body.email))return res.processError('400', 'Invalid email');
            let companies = await CompanyService.getRegisteredCompanies(name, cac);
            if (companies.length > 0) return res.processError(400, 'Company already exist');
            if  (!isValidPhoneNumber(phone)) return res.processError('400', 'Invalid phone number');
            // body.createdBy = req.user.id;
            let pr = [];
            pr.push(db.Address.create(address));
            pr.push(db.Phone.create({number: phone, type: 'main'}));
            pr.push(db.Email.create({email}));
            let resp = await Promise.all(pr);
            body.currentAddressId = resp[0].id;
            body.phoneId = resp[1].id;
            body.emailId = resp[2].id;
            body.createdBy = req.user.id;
            body.PN = await getPayrollNumber();
            let cmpy = await CompanyService.createCompany(body);
            if (!cmpy) return res.processError(400, 'Error creating user');
            logger.success('Added new company', {userId: req.user.id, objectId: cmpy.id});
            return res.status(201).send({detail: 'Company Added successfully'});
        } catch (error) {
            res.processError(400, 'Error creating user', error);
        }
    }


    async getCompanies(req, res) {
        try {
            let { page, limit} = req.processReq();
            let params = req.query.query;
                 
            let query = {};
            if (req.params.companyId) query.id = req.params.companyId;
            // query.deleted = {[Op.ne]: true};
            if (params) { 
                let search = `%${params}%`;
                query[Op.or] = [ 
                    { name: {[Op.iLike]: search}},
                    { cac: {[Op.iLike]: search}},
                ];  
            }
            let user = await db.Company.findAndCountAll({
                where: query,
                include: [
                    {model: db.Email, as: 'email'}, 
                    {model: db.Phone, as: 'phone'}, 
                    {model: db.Address, as: 'currentAddress'}, 
                    // {model: db.Offset, as: 'offsets'}, 
                ]
            });
            if (req.params.companyId) return res.send(user.rows[0]);
            res.paginateRes(user, page, limit );
        }
        catch(error){
            res.processError(400, 'Error getting users', error);
        }
    }
    async updateUser(req, res) {
        try {
            let { salutation, gender, address, maritalStatus, bvn } = req.body;
            if ( !salutation || !gender || !address || !bvn ) res.processError(400, 'All fields are required');
            let body = { salutation, gender, address, maritalStatus, bvn, updatedProfile: true };
            let bvnIsValid = /^\d+$/.test(bvn);
            if (bvn.length !== 11 || !bvnIsValid) return res.processError(400, 'Invalid BVN number' );
            let user = await CompanyService.updateUser(req.user.id, body);
            logger.success('Updated user profile', {userId: req.user.id});
            res.send(user);
        } catch (error) {
            res.processError(400, 'Error updating user');
        }
    }
    
    async getLink(req, res) {
        try {
            return res.send({
                detail: 
                `${frontendUrl}/company/add-staff?ref=${req.params.id}&uid=${req.user.id}`}
            );
        } catch (error) {
            res.processError(400, 'Error getting add staff link');
        }
    }
    
    async changeStatus(req, res) {
        try {
            let status = req.body.status === 'active' ? true : false;
            let user = await CompanyService.updateUser(req.user.id, {isActive: status});
            res.send(user);
        } catch (error) {
            res.processError(400, 'Error changing user status');
        }
    }
    async acceptTerms(req, res) {
        try {
            if (req.user.acceptedTerms) return res.processError(400, 'Already accepted terms and conditions');
            req.user.acceptedTerms = true;
            await req.user.save();
            res.send({detail: 'Terms and conditions accepted'});
        } catch (error) {
            res.processError(400, 'Error accepting terms');
        }
    }
}

module.exports = new UserController();
