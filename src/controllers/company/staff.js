'use strict';
// const StaffService = require('../../services/staff.js');   
const winston = require('../../services/winston');
const db = require('../../db/models');
const Op = db.Sequelize.Op;
const logger = new winston('Staff Management');
const { createUser } = require('../auth');
const { getPayrollNumber } = require('../../services/encrypt.js');

class StaffController{
    async addStaff(req, res) {
        let staff, user;
        try {
            let { companyId, userId, admin } = req.params;
            user = await createUser(req, res, true);
            if (!user) throw 'Error creating staff';
            let { staffId, address, accountDetails, currentSalary } = req.body;
            if ( !address || !accountDetails ) return res.processError(400, 'Enter all required fields');
            let pr = [];
            pr.push(db.Address.create(address));
            pr.push(db.AccountNumber.create(accountDetails));
            let resp = await Promise.all(pr);
            user.currentAddressId = resp[0].id;
            user.currentAccountId = resp[1].id;
            await user.save();
            staff = {};
            staff.addedById  = admin ? req.user.id : userId;
            staff.CompanyId = companyId;
            staff.UserId = user.id;
            
            staff.staffId = staffId;
            staff.PN = await getPayrollNumber('staff');

            staff = await db.Staff.create(staff);
            if (!staff) return res.processError(400, 'Error adding staff');
            if (admin) {
                currentSalary.staff = staff.id;
                let current = await db.StaffSalary.create(currentSalary);
                staff.currentSalaryId = current.id;
                staff.save;
            }
            logger.success('Added new staff', {userId: admin ? req.user.id : req.params.userId, objectId: staff.id});
            return res.status(201).send({detail: 'Staff Added successfully'});
        } catch (error) {
            if (staff && staff.id) await staff.destroy();
            if (user && user.id) await user.destroy();
            res.processError(400, 'Error adding staff', error);
        }
    }

    async getAllStaff(req, res) {
        try {
            let { page, limit} = req.processReq();
            let { query: params, ids } = req.query;
                 
            let query = {CompanyId: req.params.companyId};
            // query.deleted = {[Op.ne]: true};
            if (ids) query.id = {[Op.in] : ids.split(',')};
            if (params) { 
                let search = `%${params}%`;
                query[Op.or] = [ 
                    { email: {[Op.iLike]: search}},
                    { phoneNumber: {[Op.iLike]: search}},
                ];  
            }
            let user = await db.Staff.findAndCountAll({
                where: query,
               
                include: [
                    {
                        model: db.User, 
                        as: 'user',
                        include: [
                            {
                                model: db.Address, 
                                as: 'currentAddress',
                            }, 
                            {
                                model: db.AccountNumber, 
                                as: 'currentAccount',
                            }, 
                        ]

                    }, 
                    {
                        model: db.StaffSalary, 
                        as: 'currentSalary',
                    }, 
                    {
                        model: db.Company, 
                        as: 'company'
                    }, 
                ]
            });
            res.paginateRes(user, page, limit );
        }
        catch(error){
            res.processError(400, 'Error getting users', error);
        }
    }
    async updateStaff(req, res) {
        try {
            const { amount } = req.body;
            const staff = await db.Staff.findOne({where: {id: req.params.id}});
            let sal;
            let t = [req.params.id, staff.CompanyId];

            if (!staff.currentSalaryId) { 
                sal = await db.StaffSalary.create({amount, type: 'monthly', effectiveDate: new Date('01 Sept 2021')});
                staff.currentSalaryId = sal.id;
                await staff.save();
            }
            else {
                sal = await db.StaffSalary.findByPk(staff.currentSalaryId);
                sal.amount = amount;
                await sal.save();
            }
            logger.success('Updated staff salary', {userId: req.user.id});
            res.send({detail: 'Salary detail saved'});
        } catch (error) {
            res.processError(400, 'Error updating user');
        }
    }
    
    
    async changeStatus(req, res) {
        try {
            let staff = await db.Staff.findOne({where: {id: req.params.id}});
            if (staff.status === 'active') return res.processError(400, 'Staff already activated');
            else staff.status = 'active';
            await staff.save();
            res.send({detail: 'Successfully activated staff'});
        } catch (error) {
            res.processError(400, 'Error changing staff status');
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

module.exports = new StaffController();
