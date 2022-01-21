'use strict';
const winston = require('./../services/winston');
const logger = new winston('Server logs');
const moment = require('moment');
const filterDate = process.env.FILTER_START_DATE || '01 Oct 2020';

const resProcessor = (req, res, next) => {
    try {
        res.processError = function (code, error, data){
            console.log(error, data);
            try {
                if(req.user) logger.error(error, {userId: req.user.id, error: {message: data? data.message : '', stack: data? data.stack : ''}});
                error = typeof error === 'string'? error : error.message;
                code = code ? code : 400;
                let resp = { error: error };
                if (data) resp.data = {...data};
                this.status(code).send(resp);
            }
            catch (err){
                console.log();
            }
        };
        next();      
    } catch (error) {
        res.status(500).send({error: 'Server error'});
    }

};

const reqProcessor = (req, res, next) => {
    try {
        req.processReq = function(){
            let { page, limit, startDate, endDate, allData } = this.query;
            page = page? parseInt(page): 1;
            limit = limit ? parseInt(limit) : 10;
            let offset = page ? (page-1) * limit : 0;
            if (startDate) {
                startDate = new Date(startDate);
            }
            else {
                startDate = new Date(filterDate);
            }           
        
            if (endDate) {
                endDate = new Date(endDate);
            } else {
                endDate = new Date(moment(new Date).format('DD MMM YYYY'));
            }
            endDate.setDate(endDate.getDate() + 1);   
            if(allData){ 
                limit = undefined;
                offset = 0;
            }
            return {offset, limit, page, startDate, endDate};
        };

        res.paginateRes = function(obj, page, limit, otherfields){
            let records = obj.rows;
            let totalCounts = obj.count;
            let totalPages = (obj.count/limit);
            if (totalPages%1 !== 0) totalPages ++;
            totalPages = Math.floor(totalPages);
            let fields = {};
            if (otherfields) fields = otherfields;
            this.send({currentPage: page, totalPages, totalCounts, returnedCount: records.length, ...fields, records});
        };
        next();      
    } catch (error) {
        res.processError(400, 'Error processing request');
    }

};
module.exports = { reqProcessor, resProcessor };