const winston = require('../services/winston');
const logger = new winston('Message Controller');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const phoneNumber = process.env.TWILIO_NUMBER;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

class Message {
    async sms(to, body){
        try {
            let content = {
                from: '+2347066177668',
                body,
                to
            };
            let resp = await client.messages
                .create(content);
            logger.info('Message sent');
        }
        catch (err){
            logger.error(err);
        }
    }
    // body: 'Your Plom code is 323243',

    async whatsapp(to, body){
        try {
            let content = {
                from: `whatsapp:${phoneNumber}`,
                body,
                to: `whatsapp:${to}`
            };
            let resp = await client.messages
                .create(content);
            logger.info('Message sent', {content});
        }
        catch (err){
            logger.error(err);
        }
    }
}

module.exports = new Message();