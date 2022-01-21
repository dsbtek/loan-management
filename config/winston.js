'use strict';

const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;
require('dotenv').config();
const category = 'Winston Config';
const log = process.env.LOG_CONSOLE; 


let viewStackTrace = process.env.VIEW_ERROR_STACK_CONSOLE ? 'true' : false;

const myFormat = printf(({ level, message, timestamp, meta }) => {
    let errStack = meta && meta.error && meta.error.stack ? `\n${meta.error.stack}\n` : '';
    return `${timestamp} - ${ meta ? meta.category : ''} [${level}]: ${message} ${viewStackTrace && errStack ? errStack : ''}`;
});

let logger = createLogger({
    format: combine(
        format.json(),
        timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        myFormat
    ),
    transports:  [
        new transports.Console(
            { 
                format: combine (
                    format.colorize(),
                    timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                    myFormat ),
                level: 'silly',
                handleExceptions: true,
            }),
    ],
    exitOnError: false, // do not exit on handled exceptions
});
  
// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: function(message, encoding) {
        logger.http(message);
    },
};
if (log === 'false') logger.transports.forEach((t) => (t.silent = true));
// logger.emitErrs = false;
logger.info('Winston started', {meta : {category}});
module.exports = logger;