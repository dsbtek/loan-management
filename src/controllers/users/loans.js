const Op = require('../../db/models').Sequelize.Op;
const db = require('../../db/models');
const moment = require('moment');
const _ = require('lodash');
const winston = require('../../services/winston');
const logger = new winston('Loan Management');
const { returnOnlyArrayProperties, sumArray } = require('../../utilities/helpers');
const loanField = ['amount', 'type', 'notify', 'security', 'duration', 'options', 'userNotification', 'dateToRepay', 'dateTaken', 'repaymentType','lender', 'remarks', 'repaymentOptions', 'duration', 'security'];
const EmailService = require('../../services/email');
const appRoot = require('app-root-path');
const defaultTemplates = require(appRoot + '/templates');
const Handlebars = require('express-handlebars').create();
let requestEmailTemplate = defaultTemplates.request;
const frontendUrl = process.env.FRONTEND_URL;
const { formatCurrency, formatDate } = require('../../utilities/helpers');

async function getLoan(req, res) {
    try {
        let loan = await db.Loan.findOne({
            where: {
                deleted:{[Op.ne]: true} , 
                id: req.params.id
            }, 
            include: [
                {model: db.Offset, as: 'offsets'}, 
                {model: db.User, as: 'User', attributes: db.attributes.userShort}, 
                {model: db.User, as: 'Lender', attributes: db.attributes.userShort}, 
            ],
            // raw: true,
            // nest: true,
        });
        if(!loan) throw Error();
        loan = await processLoan(loan, req.user.id);
        if (!res) return loan;
        res.send(loan);
    }
    catch(error){
        if (!res) throw 'Error getting loan';
        res.processError(400, 'Error retrieving loan', error);
    }
}
async function getLoans(req, res) {
    try {
        let {page, limit, offset, startDate, endDate, type,  } = req.processReq();
        let request = req.query.request;
        let lender = req.query.lender;
        let userConfig = await db.UserConfig.findOne({where: {userId: req.user.id}});
        let reminderDays = userConfig &&  userConfig.reminderDays ? userConfig.reminderDays : 7;
        let queryObj = { 
            'All Loans': {},
            'Lend': {type:'Lend'}, 
            'Borrow': { type:'Borrow'}, 
            'Due Soon': {dateToRepay: {[Op.lte]: new Date().addPeriod('Days', reminderDays).endOf('day'), [Op.gt]: new Date().endOf('day')} },
            'Due Today':  {dateToRepay: {[Op.gte]: new Date().startOf('day'), [Op.lte]: new Date().endOf('day')} },
            'Over Due': {dateToRepay: {[Op.lt]: new Date().startOf('day'),}}, 
            'Due Loans': {dateToRepay: {[Op.lt]: new Date().addPeriod('Days', reminderDays).endOf('day')}},
        };
        let query = {
            [Op.and]: [{
                [Op.or]: [{userId:req.user.id}, {lender: req.user.id}],}, 
            {[Op.or]: [ 
                {[Op.and] : [{userId:req.user.id}, {deleted: false}],}, 
                {[Op.and] : [{lender:req.user.id}, {lenderDeleted: false}],}, 
            ]}
            ]
        };
        if (request === 'true'){
            query.approvalStatus = {[Op.in]: ['pending', 'rejected']};
        } else {
            query.approvalStatus = {[Op.or]: [{[Op.eq]: null,}, {[Op.eq]: 'approved' }]}; 
        }
        if (lender){
            req.query.lender = lender;
        }
        if (req.query.type && queryObj[req.query.type]) 
            query = {...query, ...queryObj[req.query.type]};

        if (req.query.active === 'true'){
            query.cleared = {[Op.ne]: true};
        } else if (req.query.active === 'false'){
            query.cleared = true;
        }

        let loans = await db.Loan.findAndCountAll({
            where: query, 
            include: [
                { 
                    model: db.Offset, 
                    as: 'offsets',
                }, 
                {
                    model: db.User, 
                    as: 'User', 
                    attributes: db.attributes.userShort,
                }, 
                {model: db.User, as: 'Lender', attributes: db.attributes.userShort}, 
            ],
            // limit,
            offset,
            // raw: true,
            // nest: true,
            order:[
                ['createdAt', 'DESC'],
                [{model: db.Offset, as: 'offsets'},'dateToRepay']


            ]});
        let lists = [];        
        for (let loan of loans.rows){
            lists.push( await processLoan(loan, req.user.id, reminderDays));
        }
        loans.rows = lists;
        res.paginateRes(loans, page, limit );
    }
    catch (error) {
        res.processError(400, 'Error fetching user loans', error);
    }
}
async function createLoan(req, res) {
    try {
        let body = returnOnlyArrayProperties(req.body, loanField);
        let { repaymentOptions, lender, repaymentType, dateToRepay } = body;
        body.userId = req.user.id;
        if(!lender) throw 'User cannot be null';
        if (lender === req.user.id) throw 'Self loan is not allowed';
        let query = {id: lender};
        if (!res) query.type = {[Op.ne]: 'private'};
        lender = await db.User.findOne(
            { 
                where: query, 
                attributes: db.attributes.user,
            });
        if(!lender) throw 'user not found';
        if(!res) {
            body.approvalStatus = 'pending';
            body.dateRequested = new Date();
            body.type = 'Borrow';
        }
        if (!['once', 'periodic', 'custom'].includes(repaymentType)) throw 'Select repayment type - once or periodic';
        if (repaymentType === 'once' && !dateToRepay) throw 'Repayment date is required';
        if (repaymentType === 'periodic' &&
            (!repaymentOptions.period ||
                !repaymentOptions.type || 
                !repaymentOptions.day || 
                !repaymentOptions.amount
            )) throw 'All Repayment option inputs are required';
        
        if (repaymentType === 'custom'){
            if (!repaymentOptions.list || !repaymentOptions.list.every(offset => offset.amount && offset.date)
            ) throw 'All Repayment list inputs are required';
            else {
                let total = repaymentOptions.list.reduce((total, curr) => total + curr.amount, 0);
                if (total !== body.amount) throw 'Total repayment amount does not match loan amount';
                repaymentOptions.list.sort(function(a,b){return (new Date(a.date) > new Date(b.date) ? 1 : -1);});
            }
        }
        if ( res && !req.body.security ) body.security = 'goodly loan';
        else if ( req.body.security ) {
            // check coop member
            if ( req.body.security === 'guarantors') {
                if (!req.body.guarantors) throw 'Guarantor(s) required';
                if (req.body.guarantors && !req.body.guarantors[0].id ) throw 'Guarantor(s) list can not be empty';
                
            } else if (req.body.payrolNumber){
                // console.log()
            }
        } else throw 'Security not provided';
        
        let loan = await db.Loan.create(body);
        if (req.body.gurantors)
            for ( let guarantor of req.body.guarantors) {
                guarantor.loanId = loan._id;
                guarantor.userId = guarantor.id;
                delete guarantor.id;
                await db.Guarantor.create(guarantor);
                // sendEmailToGurantor();
            }
        loan.dataValues.Lender = lender;
        
        if (repaymentType === 'custom') for (let offset of repaymentOptions.list){
            let off = {
                amount: offset.amount,
                dateToRepay: offset.date,
                cleared: false,
                loanId: loan.id
            };
            await db.Offset.create(off);
        }
        else if (repaymentType === 'periodic') {
            let { amount, effectiveDate, day, period, type} = repaymentOptions;
            let date = getDateByRepaymentOption(body.dateTaken, period, type, day);
            effectiveDate = new Date(effectiveDate || body.dateTaken);
            const loanAmount = Number(body.amount);
            let offsetAmount = 0;
            while ( offsetAmount < loanAmount && loanAmount - offsetAmount >= amount) {
                if (date >= effectiveDate) {
                    let off = {
                        amount: amount,
                        dateToRepay: date,
                        cleared: false,
                        loanId: loan.id
                    };
                    await db.Offset.create(off);
                }
                offsetAmount += Number(amount);
                let d = new Date(date).endOf('Month').addPeriod('Days', 1).endOf('Month');
                date = getDateByRepaymentOption(d, period, type, day);
            }
            if (loanAmount%amount !== 0) {
                let off = {
                    amount: loanAmount%amount,
                    dateToRepay: date,
                    cleared: false,
                    loanId: loan.id
                };
                await db.Offset.create(off);
            }
        }
        if(!res) return await getLoan(req);
        logger.success('Create Loan', {objectId: loan.id, userId:req.user.id});
        res.send({detail: 'Add loan successful'});
    } 
    catch(error){
        if(!res) throw error;
        res.processError(400, typeof error === 'string'? error : 'Error creating loan', error);
    }
}

async function deleteLoan(req, res) {
    try{
        let loan = await getLoan;
        let ids = req.params.id ? [req.params.id] : (req.query.ids? req.query.ids.split(','): []);
        if(!ids && !ids.length) return res.processError(400, 'Loan(s) cannot be null');
        let loans = await db.Loan.findAll({where: {deleted:{[Op.ne]: true} , id: {[Op.in]: ids}}, 
            include: [
                {model: db.User, as: 'Lender', attributes: db.attributes.user}, 
            ],});
        if(!loans.length) return res.processError(400, 'Loan(s) not found');
        loans.forEach(l => {
            if(l.isOwner(req.user.id)) {
                if (!l.Lender.createdBySelf) l.destroy();
                else l.deleted = true;
            } 
            else l.lenderDeleted = true;
            l.save();
            logger.success('Delete Loan', { objectId: l.id, userId:req.user.id,});
        });
        return res.send({detail: 'Delete successful'});
    }
    catch(error){
        res.processError(400, 'Error deleting loan', error);
    }
}
async function updateLoan(req, res) {
    try {
        let loan = await db.Loan.findOne({where: {deleted:{[Op.ne]: true} , id: req.params.id}});
        if (!loan) throw 'Loan not found';
        if (req.user.id !== loan.userId) throw 'Not allowed';
        if (loan.approvalStatus && (res || loan.approvalDate)) throw 'Not allowed';
        let body = returnOnlyArrayProperties(req.body, loanField);
        let { repaymentOptions, repaymentType} = body;
        if (!['once', 'periodic'].includes(repaymentType)) throw 'Select repayment type - once or periodic';
        if (repaymentType === 'once' && !body.dateToRepay) throw 'Repayment date is required';
        if (repaymentType === 'periodic' && !repaymentOptions) throw 'Repayment options is required';
        if (repaymentType === 'periodic' && !repaymentOptions.custom &&
            (!repaymentOptions.period ||
                !repaymentOptions.type || 
                !repaymentOptions.day || 
                !repaymentOptions.amount
            )) throw 'All Repayment option inputs are required';
        if (repaymentOptions
            && repaymentOptions.custom  
            && (!repaymentOptions.list || 
                ( repaymentOptions.list && !repaymentOptions.list.length )))  
            throw 'Repayment option custom list can not be empty';
        else if ( repaymentOptions
            && repaymentOptions.custom  ) {
            let total = repaymentOptions.list.reduce((total, curr) => total + curr.amount, 0);
            if (total !== body.amount) throw 'Total repayment amount does not match loan amount';
            repaymentOptions.list.sort(function(a,b){return (new Date(a.date) > new Date(b.date) ? 1 : -1);});

        }
        Object.keys(body).forEach(k => {
            loan[k] = body[k];
        });
        await loan.save();
        if (!res) return loan;
        logger.success('Update loan', {userId: req.user.id, objectId: loan.id});
        res.send({detail: 'Loan updated successfully'});
    } catch (error) {
        if (!res) throw error;
        res.processError(400, typeof error === 'string'? error : 'Error updating loan', error);
    }
}
async function clearLoan(req, res) {
    try {
        let body = returnOnlyArrayProperties(req.body, ['date']);
        let loan = await db.Loan.findOne({where: {deleted:{[Op.ne]: true} , id: req.params.id}});
        loan.cleared = true;
        loan.dateCleared = new Date();
        loan.save();
        logger.success('Loan Cleared', {objectId: req.params.id, userId:req.user.id,});
        res.send({detail: 'Loan cleared successfully'});
    }
    catch(error){
        res.processError(400, 'Error clearing loan', error);
    }
}

async function createOffset(req, res) {
    try {
        let body = returnOnlyArrayProperties(req.body, ['amount', 'remarks', 'date']);
        body.loanId = req.params.id;
        let offset = await db.Offset.create(body);
        logger.success('Added Offset', {objectId: req.params.id, userId:req.user.id,});
        res.send(offset);
    }
    catch(error){
        res.processError(400, 'Error adding offset', error);
    }
}

async function requestLoan(req, res) {
    try {
        
        let loan = await createLoan(req, null);
        await sendRequestMail(loan, loan.Lender.email, true);
        await sendRequestMail(loan, loan.Lender.email, true);
        logger.success('Loan request sent', {objectId: loan.id, userId:req.user.id,});
        logger.success('Loan request received', {objectId: loan.id, userId: req.body.lender});
        res.send({detail: 'Loan request sent successfully'});
    }
    catch(error){
        res.processError(400, typeof error === 'string'? error : 'Error creating loan', error);
    }
}

async function approveLoan(req, res) {
    try {
        let query = {deleted:{[Op.ne]: true} , id: req.params.id};
        if(!req.user){
            query.lender = req.params.userId;
        } else query.lender = req.user.id; 
        let lo = await getLoan(req);
        if (!lo.canApprove) return res.processError(401, 'Unauthorized');
        let loan = await db.Loan.findOne({where: query}); 
        if(!loan) throw 'Error, loan request not found';
        loan.approvalStatus = req.params.type;
        loan.approvalComments = req.body.remarks;
        await loan.save();
        sendRequestMail(loan, loan.User.email, false, req.params.type, false);
        sendRequestMail(loan, loan.Lender.email, false, req.params.type, true);
        logger.success(`${loan.approvalStatus} loan request`, {objectId: loan.id, userId:req.params.lender || req.user.id,});
        res.send({detail: `Loan request ${loan.approvalStatus} sucessfully`});
    }
    catch(error){
        res.processError(400, error, error);
    }
}


async function updateRequest(req, res) {
    try {
        let loan = await updateLoan(req, null);
        //send notification to lender of loan request if not approved;
        logger.success('Loan request updated', {objectId: loan.id, userId:req.user.id,});
        res.send({detail: 'Loan request updated successfully'});
    }
    catch(error){
        res.processError(400, 'Error requesting loan', error);
    }
}
    
async function deleteRequest(req, res) {
    try {
        let query = {deleted:{[Op.ne]: true} , id: req.params.id};
        let loan = await db.Loan.findOne({where: query}); 
        if (!loan) throw 'Loan not found';
        if (!loan.approvalStatus) throw 'Not Allowed';
        if (loan.approvalDate) throw 'Loan already approved, delete loan instead';
        await loan.destroy();
        //send notification to lender of loan request if not approved;
        logger.success('Loan request deleted', {objectId: loan.id, userId:req.user.id,});
        logger.success('Loan request cancelled by requester', {objectId: loan.id, userId:loan.lender,});
        res.send(loan);
    }
    catch(error){
        res.processError(400, 'Error deleting loan request', error);
    }
}

async function getRequests(req, res){
    req.query.request = true;
    return getLoans(req, res);
}
async function deleteOffset(req, res) {
    try{
        let offset = await db.Offset.destroy({where: {id: req.params.offsetId}});
        if(!offset) return res.processError(400, 'Offset not found');
        logger.success('Delete Offset', {userId:req.user.id, objectId: req.params.id});
        return res.send({detail: 'offset deleted'});
    }
    catch(error){
        res.processError(400, 'Error deleting offset', error);
    }
}
async function updateOffset(req, res) {
    try {
        let offset = await db.Offset.findOne({where: {id: req.params.offsetId}});
        if (!offset) return res.processError(400, 'Offset not found');
        let body = returnOnlyArrayProperties(req.body, ['amount', 'date', 'remarks']);
        Object.keys(body).forEach(k => {
            offset[k] = body[k];
        });
        await offset.save();
        logger.success('Update offset', {userId: req.user.id, objectId: req.params.id});
        res.send(offset);
    } catch (error) {
        res.processError(400, 'Error updating user offset', error);
    }
}

async function processLoan(loanData, id, reminderDays){
    let loan = loanData.get({plain: true});
    const isOwner = loan.userId === id;
    if(!reminderDays) {
        let userConfig = await db.UserConfig.findOne({where: {userId: id}});
        reminderDays = userConfig &&  userConfig.reminderDays ? userConfig.reminderDays : 7; 
    }
    
    loan.otherUser = isOwner ? loan.Lender : loan.User;
    loan.otherUser.fullname = getUserNames(loan.otherUser);
    const switchType = (type) => type === 'Lend' ? 'Borrow' : 'Lend';
    loan.type = isOwner ? loan.type : switchType(loan.type); 

    if (!loan.cleared && loan.offsets && loan.offsets.length) {
        loan.totalCleared = loan.offsets.reduce((p, c) => c.cleared ? p + c.amount: p, 0);
        loan.balance = loan.amount - loan.totalCleared;
    }
    if (loan.totalCleared && loan.totalCleared >= loan.amount ) loan.status = 'Cleared';
    loan.status = getLoanStatus(loan, reminderDays);
    loan.isOwner = isOwner;
    let isLender = loan.type === 'Lend';
    // let isApproved = loan.dateApproved;
    // let isRequest = loan.dateRequested ? true : false;
    let isPrivate = loan.Lender.type === 'private';
    // let isCoop = loan.Lender.type === 'coop';
    // loan.isCoop = isCoop;
    // loan.isRequested = isRequest;
    // loan.canDelete = isPrivate;
    let { status, offsets } = getRepaymentOption(loan, reminderDays);
    loan.offsets = offsets;
    loan.status = loan.status ? loan.status : status;
    const cleared = loan.status === 'Cleared';
    loan.canEdit = !cleared && (isOwner || loan.allowEdit);
    loan.canEdit = !cleared && isOwner;
    loan.length = getLoanDuration(loan);
    // loan.canApprove = isLender && !isApproved; 
    // loan.canCancel = isRequest && !isApproved;
    loan.canOffset =  !cleared && (isPrivate || (!isPrivate && isLender));
    loan.canClear = !cleared && (isPrivate || isLender); 
    //||   (!isCoop && ((isOwner && !loan.userCleared) || (!isOwner && !loan.lenderCleared)));// || (isCoop && !loan.cleared);
    // loan.canMarkAsCompleted = isCoop && loan.status === 'cleared';
    return loan;
}

function getRepaymentOption(loan, reminderDays){
    let status = '';
    loan.offsets.forEach(offset => {
        offset.date = offset.date ? formatDate(offset.date) : '-';
        offset.amount = formatCurrency(offset.amount);
        offset.dateToRepay = formatDate(offset.dateToRepay);
        offset.cleared = offset.cleared ? 'true' :  'false';
        offset.status = offset.cleared !== false ?
            'Cleared' : getStatus(offset.dateToRepay, reminderDays);
        offset.status = offset.cleared !== false ? 'Cleared' : getStatus(offset.dateToRepay, reminderDays);
        if (status !== 'Over Due' && offset.status === 'Over Due') status = 'Over Due';
        else if (status !== 'Over Due' && status !== 'Due Today' && offset.status === 'Due Today') status = 'Due Today';
        else if (status !== 'Over Due' && status !== 'Due Today' &&
        status !== 'Due Soon' && offset.status === 'Due Soon' ) status = 'Due Soon';
        else if (!status) status = offset.status;
    });
    return {offsets:loan.offsets, status};
}

function getDateByRepaymentOption(date, period, type,  day){
    switch (period){
    case 'Monthly':
        if (type === 'Custom') {
            return new Date(`${day} ${moment(new Date(date)).format('MMM YYYY')}`).endOf('Day');
        } else if (type.includes('First')) return new Date(date).startOfOf('Month').endOf('Day');
        else if (type.includes('Last')) return new Date(date).endOf('Month').endOf('Day');
        break;
    default: 
        return new Date(date).endOf('Month').endOf('Day');  
    }
}

function sendRequestMail(loan, email, request, type, self, cancelled){
    try {
        let rejected = type === 'reject';
        let approved = type === 'approve';

        let rejectLink = `${process.env.BACKEND_URL}noauth/loans/request/${loan.id}/${loan.lender}/reject`;
        let approveLink = `${process.env.BACKEND_URL}noauth/loans/request/${loan.id}/${loan.lender}/approve`;
        let fullname = loan.User.firstName + ' ' + loan.User.lastName;
        let lender = loan.Lender.firstName + ' ' + loan.Lender.lastName;
        let variables = {
            ...loan.dataValues, fullname, lender, ...loan.User.dataValues,
            rejectLink,
            // duration: `${loan.dataValues.duration.number} ${loan.dataValues.duration.period}`,
            approveLink,
            frontendUrl, 
            self, 
            rejected, 
            request,  
            approved, 
            cancelled,
            once: loan.repaymentType === 'once',
            
        };
        let mailTemplate;
        mailTemplate = Handlebars._compileTemplate(requestEmailTemplate);
        let mailContent = mailTemplate(variables);
            
        let payload = {
            subject: 'Loan Request',
        };
        return EmailService.sendEmail(email, payload, mailContent );
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

function getLoanDuration(loan){
    let date;
    if (loan.repaymentType === 'once') {
        date = loan.dateToRepay;
    }
    else date = loan.offsets[loan.offsets.length -1].dateToRepay;
    return _.round(moment(date).diff(moment(loan.dateTaken), 'months', true));

}
function getLoanStatus(loan, reminderDays){
    if (loan.cleared) return 'Cleared';
    let date = loan.dateToRepay;
    if (loan.repaymentType === 'once') {
        return getStatus(date, reminderDays);
    } 
    return '';
}

function getStatus(date, reminderDays){
    let status;
    if  (date <= new Date().addPeriod('Days', reminderDays).endOf('day') && date > new Date().endOf('day') ){
        status = 'Due Soon';
    } else if (date >= new Date().startOf('day') && date <= new Date().endOf('day')  ){
        status = 'Due Today';
    } else if (date < new Date().startOf('day')  ){
        status = 'Over Due';
    } else status = 'Active';
    return status;
}
function getUserNames(user){
    if (user.type !== 'cooperative'){
        return `${user.firstName} ${user.lastName}`;
    } 
    return 'Company';
}
module.exports = {
    getLoan, getLoans, createLoan,
    deleteLoan, updateLoan, 
    clearLoan, createOffset, requestLoan, getRequests, 
    approveLoan,
    updateRequest, deleteRequest,  deleteOffset, updateOffset,
    processLoan
};

// function getRepaymentOption(loan, reminderDays){
//     let clearedOffsetsObj = {};
//     let status = '';
//     loan.offsets.forEach(off => clearedOffsetsObj[formatDate(off.dateToRepay)] = off );
//     const processOffset = (date, amount) =>  {

//         let formattedDate = formatDate(date);
//         let offset;
//         if (clearedOffsetsObj[formattedDate]) offset = clearedOffsetsObj[formattedDate];
//         else {
//             offset = {
//                 amount: amount,
//                 dateToRepay: date,
//                 cleared: false,
//                 loanId: loan.id
//             };
//         }
//         console.log(3, formattedDate);
//         offset.status = offset.cleared !== false ? 'Cleared' : getStatus(offset.dateToRepay, reminderDays);
//         if (status !== 'Over Due' && offset.status === 'Over Due') status = 'Over Due';
//         else if (status !== 'Over Due' && status !== 'Due Today' && offset.status === 'Due Today') status = 'Due Today';
//         else if (status !== 'Over Due' && status !== 'Due Today' &&
//         status !== 'Due Soon' && offset.status === 'Due Soon' ) status = 'Due Soon';
//         else if (!status) status = offset.status;

//         offset.dateToRepay = formattedDate;
//         allOffsets.push(offset);
//     };
//     let allOffsets = [];
//     if (loan.repaymentType === 'periodic' && loan.repaymentOptions){
//         if (loan.repaymentOptions.custom) 
//             loan.repaymentOptions.list.forEach(option => {
//                 processOffset(option.date, option.amount);
//             });
//         else {
//             let { amount, effectiveDate, day, period, type} = loan.repaymentOptions;
//             let date = getDateByRepaymentOption(loan.dateTaken, period, type, day);

//             effectiveDate = new Date(effectiveDate || loan.dateTaken);
//             const loanAmount = Number(loan.amount);
//             let offsetAmount = 0;
//             while ( offsetAmount < loanAmount && loanAmount - offsetAmount >= amount) {
//                 if (date >= effectiveDate) {
//                     processOffset(date, amount);
//                 }
//                 offsetAmount += Number(amount);
//                 let d = new Date(date).endOf('Month').addPeriod('Days', 1).endOf('Month');
//                 date = getDateByRepaymentOption(d, period, type, day);
//             }
//             if (loanAmount%amount !== 0) {
//                 processOffset(date, loanAmount%amount);
//             }
//         }
//         return {offsets: allOffsets, status: status };
//     }
//     return {offsets: loan.offsets, status: status };
// }