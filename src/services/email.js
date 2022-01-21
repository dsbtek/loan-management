/*Main Email notifications tools.*/
'use strict';
const nodemailer = require('nodemailer');
const winston = require('./winston');
const logger = new winston('Email Service');

let options = { 
    host: process.env.MAILING_HOST,
    port: process.env.MAILING_PORT,
   

};

if (process.env.USE_MAILING_AUTH === 'true') {
    options.auth =  {
        user: process.env.MAILING_USERNAME,
        pass: process.env.MAILING_PASSWORD
    };
} else {
    options.secure = false,
    options.tls = {
        rejectUnauthorized: false
    };
}


const transporter = nodemailer.createTransport(options);

class Email {
    /*Main Sending function. Uses Nodemailer and AWS SES to send emails. Handlebars is used to compile templates.*/
    sendEmail(email, payload, mailContent, user ) {
        return new Promise((resolve, reject) => {
            
            let toArr = typeof email === 'string' ? [email] : email;

            let mailOptions = {
                from: process.env.MAIL_SENDER_ADDRESS,
                cc: payload.cc || [],
                bcc: payload.bcc || process.env.MAIL_SENDER_ADDRESS,
                to: toArr,
                subject: payload.subject,
                text: escapeHtml(mailContent),
                html: mailContent
            };
            if (process.env.NODE_ENV === 'test') return resolve('success');
            return transporter.sendMail(mailOptions, function(error, status) {
                if (error) {
                    reject(error);
                    logger.error('Error sending mail', {error, userId: user.id});
                } else {
                    logger.info('email sent successful', {userId: user.id});
                    // mailModel.save(mailOptions);
                    return resolve('success');
                }
            });
        });
    }
}

function escapeHtml(string) {
    let regex = /(<([^>]+)>)/ig;
    return string.replace(regex, '');
}

module.exports = new Email();