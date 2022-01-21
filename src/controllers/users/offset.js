const db = require('../../db/models');
const winston = require('../../services/winston');
const logger = new winston('Loan Management');
const { returnOnlyArrayProperties } = require('../../utilities/helpers');

async function clearOffset(req, res) {
    try {
        let offset = await db.Offset.findOne({where: {id: req.params.offsetId}});
        if (!offset) return res.processError(400, 'Offset not found');
        let { remarks, date } = req.body;
        offset.remarks = remarks;
        offset.date = date;
        offset.cleared = true;
        await offset.save();
        logger.success('Loan repayment option - offset cleared', {objectId: req.params.id, userId:req.user.id,});
        res.send({ detail: 'Offset cleared successfully', offset});
    }
    catch(error){
        res.processError(400, 'Error clearing offset', error);
    }
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
        logger.success('Update offset successfully', {userId: req.user.id, objectId: req.params.id});
        res.send({detail: 'Offset update successful', offset});
    } catch (error) {
        res.processError(400, 'Error updating user offset', error);
    }
}



async function offsetLoan(req, res) {
    try {
        let body = returnOnlyArrayProperties(req.body, ['amount', 'remarks', 'date']);
        body.loanId = req.params.loanId;
        body.cleared = true;
        let offset = await db.Offset.create(body);
        logger.success('Added Offset', {objectId: req.params.id, userId:req.user.id,});
        res.send({detail: 'Offset successful', offset});
    }
    catch(error){
        res.processError(400, 'Error adding offset', error);
    }
}

module.exports = {
    offsetLoan, 
    deleteOffset, 
    updateOffset,
    clearOffset,
};