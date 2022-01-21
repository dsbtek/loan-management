'use strict';
const db = require('../db/models');
const Op = db.Sequelize.Op;
const Loan = db.loans;
const AppSubscription = db.loanSubscriptions;
const winston = require('../services/winston');
const logger = new winston('Loan Service');


class LoanService {
    async getLoan (loanId) {
        try {
            return await Loan.findOne({where: {id: loanId, deleted: {[Op.ne]: true}}, attributes: db.attributes.loan, include: [ { model: db.users, attributes:db.attributes.user }]} );
        } catch (e) {
            logger.error(e);
        } 
    }
    async getLoans (query, page, limit) {
        try {
            query.deleted = {[Op.ne]: true};
            let loans = await Loan.findAll({where: query, attributes: db.attributes.loan, include: [ { model: db.users, attributes:db.attributes.user} ] , order: [['createdAt', 'DESC']]});
            return loans;
        } catch (e) {
            logger.error(e);
        }
    }
    async createLoan (body) {
        try {
            let newLoan = new Loan();
            Object.keys(body).forEach(k => {
                newLoan[k] = body[k];
            });
            let app = await newLoan.save();
            await app.save();
            return app;
        }
        catch(err){
            logger.error(err);
        }
    }

    async updateLoan (loanId, body) {
        try{
            let loan = await Loan.findByPk(loanId);
            Object.keys(body).forEach(k => {
                loan[k] = body[k];
            });
            return loan.save();
        }
        catch(err){
            logger.error(err);
        } 
    }

    async deleteLoan (loanId){
        try{
            let app = await Loan.findByPk(loanId);
            if(!app) return ;
            app.deleted = true;
            await app.save();
            return {detail: 'app deleted'};
        }
        catch(err){
            logger.error(err);
        }
    }

    async verifyLoan(email, password){
        try {
            let u = await Loan.findByCredentials(email, password);
            return this.getLoan(u.id);
        } catch (error) {
            logger.error(error);
        }
    }
    async subscribe(LoanId, SubscriptionId){
        try {
            let u = await AppSubscription.create({LoanId, SubscriptionId});
            return u;
        } catch (error) {
            logger.error(error);
        }
    }
    async resetSubscriptions(loanId){
        try {
            let userSubs = await db.loanSubscriptions.findAll({where: {LoanId: loanId}});
            for (let sub of userSubs){ sub.destroy();}
            return true;
        } catch (error) {
            logger.error(error);
        }
    }
    async unsubscribe(LoanId, SubscriptionId){
        try {
            let u = await AppSubscription.findOne({where: {LoanId, SubscriptionId}});
            if (!u) return;
            return u.destroy();
        } catch (error) {
            logger.error(error);
        }
    }
    
}


module.exports = new LoanService();