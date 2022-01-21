'use strict';

const logger = require('../../config/winston');
const category = 'Winston Service';
const db = require('../db/models');
const Logs = db.ActivityLog;
const testEnv = process.env.NODE_ENV === 'test';

const logObj = {
    action: 'Logger',
    category,
    type: 'System'
};
class WinstonLogger {
    constructor (category, type) {
        this.category = category;
        this.type = type;
    }

    async error (err, meta){
        try {
            let message;
            if (!meta) meta = {};
            if (typeof err === 'string') {
                message = err;
            } else {
                message = err.message || err.error;
                meta.error = err;
            }
            meta.status = 'error';
            this.log('error', message, meta);
        } catch (error) {
            this.__failed(error);
        }
    }

    async info (message, meta){
        this.log('info', message, meta);
    }

    async warn (message, meta){
        this.log('warn', message, meta);
    }

    async debug (message, meta){
        this.log('debug', message, meta);
    }

    async verbose (message, meta){
        this.log('verbose', message, meta);
    }
    async success (action, meta){
        meta.status = 'success';
        meta.action = action;
        
        this.log('info', 'Successful', meta);
    }
    async failed(action, message, meta){
        meta.status = 'failed';
        meta.action = action;
        
        this.log('info', message, meta);
    }
    async http (message, meta){
        this.log('http', message, meta);
    }

    async log (level, message, meta){
        if (testEnv) return;
        try {
            if (!meta) meta = {};
            meta.category = meta.category ? meta.category : this.category;
            meta.type = meta.type ? meta.type : this.type;
            meta.action = meta.action ? meta.action : 'User action';
            meta.level = level;
            meta.message = message;
            Logs.create(meta);
            logger.log(level, meta.action + ': ' + message, {meta}); 

        } catch (error) {
            this.__failed(error);
            
        }
    }

    async __failed(error){
        try {
            logObj.error = error;
            logger.error('Error logging logs', { meta: logObj });
        } catch (error) {
            logObj.error = error;
            logger.error('Error logging failed logs', { meta: logObj });
        }
    }
}

module.exports = WinstonLogger;