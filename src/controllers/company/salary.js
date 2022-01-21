'use strict';
const moment = require('moment');
// const StaffService = require('../../services/staff.js');   
const winston = require('../../services/winston');
const db = require('../../db/models');
const Op = db.Sequelize.Op;
const sequelize = db.sequelize;
const SalaryModel = db.StaffSalary;
const logger = new winston('Staff Management');
const { getPayrollNumber } = require('../../services/encrypt.js');
class StaffController{
    async  setPaymentStatus(req, res) {
        try {

            //optimize this later
            let staff = await db.Staff.findOne({where: {id: req.params.id}});
            let sal;
            sal = await SalaryModel.findByPk(staff.currentSalaryId);
            sal.paid = true;
            await sal.save();
            logger.success('Updated staff salary', {userId: req.user.id});
            res.send({detail: 'Salary Paid'});
        } catch (error) {
            res.processError(400, 'Error setting paid status');
        }
    }

   
    async addStaffSalary(req, res) {
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

    async paySalary(req, res) {
        try {
            let sal;
            let { amount, month, year, date, transactionReference } = req.body;
            const body = {amount, month, year, date, transactionReference};
            body.payee = req.user.id;
            body.staff = req.params.staffId;
            sal = await db.PaidSalaries.create(body);
            logger.success('Staff salary paid', {userId: req.user.id, objectId: body.staff});
            res.send({detail: 'Staff salary paid'});
        } catch (error) {
            res.processError(400, 'Error paying staff salary', error);
        }
    }

    async getStaffSalariesOld(req, res) {
        try {
            let { page, limit, offset } = req.processReq();
            let {  id,} = req.query;
            let {  companyId: CompanyId, } = req.params;
                 

            let query = {CompanyId};
            // query.deleted = {[Op.ne]: true};
            if (id) {
                query.id = id;
            }

            
            // let user = await SalaryModel.findAndCountAll({
            //     where: query,
            //     include: [
            //         {
            //             model: db.Staff, 
            //             include: {
            //                 model: db.StaffSalary, 
            //                 as: 'currentSalary',
            //             }
            //         }, 
            //     ]
            // });

            let staff = await db.Staff.findAndCountAll({
                where: query,
                include: {
                    model: db.StaffSalary, 
                    as: 'currentSalary',
                }, 
                limit,
                offset,
                raw: true,
                nest: true
            });

            let startDate = new Date().startOf('month').startOf('day');
            let endDate = new Date().endOf('month').endOf('day');
            let payQuery = { staff: {[Op.in]: staff.rows.map(stff => stff.id)}};
            payQuery.date = {[Op.gte]: startDate, [Op.lte]: endDate};
            let deductions = await db.PayItem.findAll({
                where: payQuery, raw: true
            });

            let salaryQuery = { staff : payQuery.staff};
            salaryQuery.salaryDate = payQuery.date;
            let paid = await db.PaidSalaries.findAll({
                where: salaryQuery, raw: true
            });
            let deductionsObj = {};
            deductions.forEach(deduction => {
                if (!deductionsObj[deduction.staff]) deductionsObj[deduction.staff] = {};
                if (!deductionsObj[deduction.staff][deduction.type] ) 
                    deductionsObj[deduction.staff][deduction.type]  = { sum: 0, list: [] };
                deductionsObj[deduction.staff][deduction.type].sum += Number(deduction.amount);
                deductionsObj[deduction.staff][deduction.type].list.push(deduction);
            });
            paid.forEach(pay => {
                if (!deductionsObj[pay.staff]) deductionsObj[pay.staff] = {};
                if (!deductionsObj[pay.staff].paidSalaries ) 
                    deductionsObj[pay.staff].paidSalaries = {sum: 0, list: []};
                deductionsObj[pay.staff].paidSalaries.list.push(pay);
            });
            staff.rows.forEach(s => {
                s.calculatedPay = s.currentSalary ? Number(s.currentSalary.amount) : 0;
                for (let type of ['deductions', 'earnings', 'paidSalaries']) {
                    if (deductionsObj[s.id] && deductionsObj[s.id][type]) {
                        s[type] = deductionsObj[s.id][type].list;
                        if (type === 'earnings') s.calculatedPay += deductionsObj[s.id][type].sum;
                        else if (type === 'deductions') s.calculatedPay -= deductionsObj[s.id][type].sum;
                    } else s[type] = [];
                } 
            });
            res.paginateRes(staff, page, limit );
        }
        catch(error){
            res.processError(400, 'Error getting staff salaries', error);
        }
    }
    async getStaffSalaries(req, res) {
        try {
            let { page, limit, offset } = req.processReq();
            let {  id, year, userId, ids} = req.query;
            let {  companyId: CompanyId, } = req.params;

            let query = {CompanyId};
            let staffObj = {};
            // query.deleted = {[Op.ne]: true};
            if (id) {
                query.id = id;
            } else if (ids) {
                query.id = {[Op.in]: ids.split(',')};
            } else if (userId) {
                query.UserId = userId;
            }

            if (!year) year = new Date().getFullYear().toString();
            let staffList = await db.Staff.findAndCountAll({
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
                ], 
                raw: true,
                nest: true
            });
            let startDate = new Date().startOf('year').startOf('day');
            let endDate = new Date().endOf('year').endOf('day');
            
            // pay item 
            let payQuery = { 
                staff: {[Op.in]: staffList.rows.map(stff => stff.id)},
                endDate: {[Op.gt]: startDate},
                startDate: {[Op.lt]: endDate},
            };
            
            let payItems = await db.PayItem.findAll({
                where: payQuery, 
                raw: true
            });

            // paid salaries
            let salaryQuery = { 
                staff : payQuery.staff,
                year
            };
            let paid = await db.PaidSalaries.findAll({
                where: salaryQuery, raw: true
            });
            let payObj = {};
            for (let pay of payItems) {
                if (!payObj[pay.staff]) payObj[pay.staff] = [];
                payObj[pay.staff].push(pay);
            }
            // current salaries
            let currentSalariesQuery = { 
                staff : payQuery.staff,
                effectiveDate: {[Op.gte]: startDate, [Op.lte]: endDate} 
            };
            let currentSalaries = await db.StaffSalary.findAll(
                {
                    where : currentSalariesQuery,
                    raw: true
                });
            currentSalaries.forEach(salary => {
                let { staff } = salary;
                if (!staffObj[staff]) staffObj[staff] = {};
                if (!staffObj[staff].currentSalaries) 
                    staffObj[staff].currentSalaries  = [];
                staffObj[staff].currentSalaries.push(salary);
            });

            // deductions.forEach(deduction => {
            //     let {staff, type, amount, month } = deduction;
            //     if (!staffObj[staff]) staffObj[staff] = {};
            //     if (!staffObj[staff][type] ) 
            //         staffObj[staff][type]  = {};
            //     if (!staffObj[staff][type][month] )
            //         staffObj[staff][type][month]  = {sum: 0, list: []};
            //     staffObj[staff][type][month].sum += Number(amount);
            //     staffObj[staff][type][month].list.push(deduction);
            // });
            paid.forEach(pay => {
                let {staff,amount, month } = pay;
                if (!staffObj[staff]) staffObj[staff] = {};
                if (!staffObj[staff].paidSalaries) 
                    staffObj[staff].paidSalaries = {};
                if (!staffObj[staff]['paidSalaries'][month]) 
                    staffObj[staff]['paidSalaries'][month] = {sum: amount, list: []};
                staffObj[staff]['paidSalaries'][month].list.push(pay);
            });
            // staff.rows.forEach(s => {
            //     s.calculatedPay = s.currentSalary ? Number(s.currentSalary.amount) : 0;
            //     for (let type of ['deductions', 'earnings', 'paidSalaries']) {
            //         if (staffObj[s.id] && staffObj[s.id][type]) {
            //             s[type] = staffObj[s.id][type].list;
            //             if (type === 'earnings') s.calculatedPay += staffObj[s.id][type].sum;
            //             else if (type === 'deductions') s.calculatedPay -= staffObj[s.id][type].sum;
            //         } else s[type] = [];
            //     } 
            // });

            let allMonths = moment.monthsShort();
            year = parseInt(year);
            const total = {};
            staffList.rows.forEach(staff => {
                let staffId = staff.id;
                let salaries = staffObj[staff.id] ? staffObj[staff.id].currentSalaries || [] : [];
                salaries = salaries.sort(function(a,b){return (new Date(a.effectiveDate) > new Date(b.effectiveDate) ? 1 : -1);});
                allMonths.forEach((month, ind) => {
                    let text = 'Missing';
                    let clss = 'missing-salary';
                    let salaryEnd = new Date(moment(new Date(`01 ${month} ${year}`)).endOf('month'));
                    let thisMonthEnd = new Date(moment(new Date()).endOf('month'));
                    
                    if (salaryEnd < new Date(staff.createdAt)) {
                        text = 'Not Active';
                        clss = 'inactive-salary';
                    } 
                    else if (salaryEnd > thisMonthEnd){
                        text = '-';
                        clss = 'future-salary';
                    } else if (staff.closingDate && salaryEnd > new Date(staff.closingDate)){
                        text = 'Closed';
                        clss = 'closed-salary';
                    } 
                    staff[month] = {};
                    if (!total[month]) total[month] = { 
                        deductions: 0,
                        earnings: 0,
                        currentSalaries: 0,
                        calculatedPay: 0,
                        paidSalaries: 0,
                    };
                    for (let type of ['deductions', 'earnings', 'paidSalaries', 'salary']) {
                        staff[month][type] = {};
                        staff[month][type].text = text;
                        staff[month][type].class = clss;
                    }

                    payObj[staffId] && payObj[staffId].forEach(deduction => {
                        let {staff, type, amount, startDate, endDate } = deduction;
                        let salaryDate = new Date(`01 ${month} ${year}`).startOf('Day');
                        let truthy = startDate <= salaryDate && endDate > salaryDate;
                        if (!truthy) return;
                        if (!staffObj[staff]) staffObj[staff] = {};
                        if (!staffObj[staff][type] ) 
                            staffObj[staff][type]  = {};
                        if (!staffObj[staff][type][month] )
                            staffObj[staff][type][month]  = {sum: 0, list: []};
                        staffObj[staff][type][month].sum += Number(amount);
                        staffObj[staff][type][month].list.push(deduction);
                    });
                    staff[month].currentSalary = getStaffCurrentSalary(salaries, month, year);
                    staff[month].calculatedPay = staff[month].currentSalary ? 
                        Number(staff[month].currentSalary.amount || 0) : 0;
                    if (staff[month].currentSalary &&  staff[month].salary.text !== '-') {
                        staff[month].salary.text = 'Obtained';
                        staff[month].salary.class = 'obtained-salary';
                        total[month].currentSalaries += Number(staff[month].calculatedPay);    
                    }
                    for (let type of ['deductions', 'earnings', 'paidSalaries']) {
                        if (staffObj[staff.id] && staffObj[staff.id][type] && staffObj[staff.id][type][month]) {
                            staff[month][type].list = staffObj[staff.id][type][month].list;
                            if (type === 'earnings') staff[month].calculatedPay += Number(staffObj[staff.id][type][month].sum || 0);
                            else if (type === 'deductions') staff[month].calculatedPay -= Number(staffObj[staff.id][type][month].sum || 0);
                            staff[month][type].text = 'Obtained';
                            staff[month][type].sum = staffObj[staff.id][type][month].sum;
                            staff[month][type].class = `obtained-${type.toLowerCase()}`;
                        } else {
                            staff[month][type].list = [];
                        }
                        total[month][type] += Number(staff[month][type].sum || 0);
                    }
                    total[month].calculatedPay += Number(staff[month].calculatedPay);    
                });
            });
            res.paginateRes(staffList, page, limit, {total} );
        }
        catch(error){
            res.processError(400, 'Error getting staff salaries', error);
        }
    }

    async getPaidSalaries(req, res) {
        try {
            let { page, limit, offset } = req.processReq();
            let { userId, id, year, ids} = req.query;
           
            // query.deleted = {[Op.ne]: true};
         
            // if (!year) year = new Date().getFullYear().toString();
            let query = {};
            if (id) {
                query.staff = id;
            } else if (ids) {
                query.staff = {[Op.in]: ids.split(',')};
            } else if (userId) {
                query.UserId = userId;
            }
            let paid = await db.PaidSalaries.findAndCountAll({
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
            res.paginateRes(paid, page, limit );
        }
        catch(error){
            res.processError(400, 'Error getting staff salaries', error);
        }
    }

    async getSalaries(req, res) {
        try {
            let { page, limit, offset } = req.processReq();
            let { userId, id, year, ids} = req.query;

            if (!year) year = new Date().getFullYear().toString();
            let startDate = new Date().startOf('year').startOf('day');
            let endDate = new Date().endOf('year').endOf('day');

            let query = { 
                effectiveDate: {[Op.gte]: startDate, [Op.lte]: endDate}, 
            };
            // query.deleted = {[Op.ne]: true};
            if (id) {
                query.staff = id;
            } else if (ids) {
                query.id = {[Op.in]: ids.split(',')};
            } else if (userId) {
                query.UserId = userId;
            }


            let currentSalaries = await db.StaffSalary.findAndCountAll(
                {
                    where : query,
                    raw: true,
                    limit,
                    offset,
                    order: [['createdAt', 'DESC']]
                });
           
            res.paginateRes(currentSalaries, page, limit );
        }
        catch(error){
            res.processError(400, 'Error getting staff salaries', error);
        }
    }
    async totalPaid(req, res) {
        try {
            let { page, limit} = req.processReq();
            let params = req.query.query;
                 
            let query = {CompanyId: req.params.companyId};
            // query.deleted = {[Op.ne]: true};
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
                        model: SalaryModel, 
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
    getStaffCurrentSalary(salaries, month, year) {
        return getStaffCurrentSalary(salaries, month, year);
    }
}



const getStaffCurrentSalary = (salaries, month, year) => {
    if(!salaries || !salaries.length) return  '';
    let currentDate = new Date(`01 ${month} ${year}`).startOf('day');
    let min;
    for (let [ind, salary] of salaries.entries()){
        salary.effectiveDate = new Date(salary.effectiveDate).startOf('day');
        if (ind === 0 && currentDate < salary.effectiveDate) break;
        if (min && min.effectiveDate < salary.effectiveDate ) continue;
        if (moment(currentDate).format('DD MMM YYYY') === moment(salary.effectiveDate).format('DD MMM YYYY')) { 
            min = salary;
            break;
        }
        if (salary.effectiveDate > currentDate) { 
            min = salaries[ind - 1];
            break;
        }
        if (ind === salaries.length - 1 && !min) min = salary;
    }
    return min;
};

async function modifyCurrentStaffSalaries(req, res) {
    try {
        let pay = await db.PayItem.findAll({
        });
        for (let py of pay) {
            if (!py.startDate) {
                py.startDate = new Date(`01 ${py.month} ${py.year}`);
                py.endDate = new Date(`01 ${py.month} ${py.year}`).endOf('month');
                py.save();
            }
        }
        console.log('successfully updated staff payitems');
    } catch (error) {
        console.log('Error changing staff status');
    }
}

// modifyCurrentStaffSalaries();
module.exports = new StaffController();
