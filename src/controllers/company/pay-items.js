'use strict';
const moment = require('moment');
const winston = require('../../services/winston');
const db = require('../../db/models');
const Op = db.Sequelize.Op;
const sequelize = db.sequelize;
const SalaryModel = db.StaffSalary;
const logger = new winston('Pay Item Management');
class StaffController{
    

    async addPayItem(req, res) {
        try {
            let sal;
            let { amount, month, year, type, startDate, endDate, transactionReference, name } = req.body;
            const body = {amount, month, year, startDate, endDate, type: type || 'deductions', 
                name, transactionReference};
            body.addedBy = req.user.id;
            body.staff = req.params.staffId;
            sal = await db.PayItem.create(body);
            logger.success('Added new pay item to staff', {userId: req.user.id, objectId: body.staff});
            res.send({detail: 'Salary Pay item update successful'});
        } catch (error) {
            res.processError(400, 'Error adding new pay item', error);
        }
    }
    async editPayItem(req, res) {
        try {
            let staff = await db.Staff.findOne(
                {
                    where: { id: req.params.staffId },
                    include: {
                        model: SalaryModel, 
                        as: 'currentSalary',
                    }
                });
            let sal;
            let { amount, effectiveDate, type } = req.body;
            const body = {amount, effectiveDate, type: type || 'monthly', };
            body.addedBy = req.user.id;
            body.staff = req.params.staffId;
            sal = await SalaryModel.create(body);
            effectiveDate = new Date(effectiveDate);
            const isNewerSalary = !staff.currentSalary || 
                (staff.currentSalary && 
                    effectiveDate > staff.currentSalary.effectiveDate &&
                    effectiveDate.startOf('day')) < new Date().startOf('day');
            if (isNewerSalary) { 
                staff.currentSalaryId = sal.id;
                await staff.save();
            }
            logger.success('Added new salary', {userId: req.user.id});
            res.send({detail: 'Salary update successful'});
        } catch (error) {
            res.processError(400, 'Error adding new salary');
        }
    }

    async getPayItems(req, res) {
        try {
            let { page, limit, offset } = req.processReq();
            let { userId, id, year, ids} = req.query;
            let { type } = req.params;
            
            if (!year) year = new Date().getFullYear().toString();
            let startDate = new Date().startOf('year').startOf('day');
            let endDate = new Date().endOf('year').endOf('day');
            
            let query = { 
                type,
                endDate: {[Op.gt]: startDate},
                startDate: {[Op.lt]: endDate}, 
            };
            // query.deleted = {[Op.ne]: true};
            if (id) {
                query.staff = id;
            } else if (ids) {
                query.staff = {[Op.in]: ids.split(',')};
            } else if (userId) {
                query.UserId = userId;
            }
            
            let deductions = await db.PayItem.findAndCountAll({
                where: query, 
                include: [{
                    model: db.Staff, 
                    include: {
                        model: db.User, 
                        as: 'user',
                    }
                }],
                raw: true,
                limit,
                offset,
                order: [['createdAt', 'DESC']]
            });
            res.paginateRes(deductions, page, limit );
        }
        catch(error){
            res.processError(400, 'Error getting staff pay items', error);
        }
    }
    async deletePayItem(req, res) {
        try {
            let {type, id } = req.params;
            let item = await db.PayItem.findOne(
                {
                    where: { id },
                });
            await item.destroy();
            logger.success(`Delete ${type}`, {userId: req.user.id});
            res.send({detail: `${type} deleted successfully`});
        } catch (error) {
            res.processError(400, 'Error adding new salary');
        }
    }
}

module.exports = new StaffController();
