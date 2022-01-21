'use strict';
const winston = require('../services/winston');
const logger = new winston('OTP Verification');
const db = require('../db/models');
let Otp = db.Token;


class OTPVerification {
    async generateOTP (length) {
        try {
            if(!length) length = 8;
            return Math.floor(Math.pow(10, length-1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length-1) - 1));
        } catch (e) {
            logger.error('Error generating OTP');
        }
    }
    async getOtps (query) {
        try {
            return await Otp.findAll({where: query});
        } catch (e) {
            logger.error('Error getting OTPs');
        }
    }
    async _expired(date, type){
        let time = type === 'email'? 3600 * 24 : 30 * 60;
        return (new Date().getTime() - new Date(date).getTime() )/ 3600 > time;
    }
    async saveOTP (user, type, otp, value) {
        try {
            user.verifyOtp = await Otp.findAll({where: {userId : user.id}});
            let userOtp = user.verifyOtp && user.verifyOtp.length > 0 ? user.verifyOtp.filter(t => t.value === value) : [];

            if (userOtp.length < 1 ) {
                userOtp = Otp.build();
            }
            else {
                userOtp = userOtp[0];
            }
            if (otp) {   
                otp = await this.generateOTP(8);
                userOtp.token = otp + ''; 
            }
            userOtp.value = value;
            userOtp.type = type;
            userOtp.dateCreated = new Date();
            userOtp.verified = false;
            userOtp.userId = user.id;
            await userOtp.save();
            if (otp) return otp;
            return true;
        } catch (e) {
            logger.error('Error saving OTP', {error:e});
        }
    }
    saveOTPstatus(type, user, value){
        if(type === 'password-reset') return;
        let list = user.verifiedEmails;
        if (type === 'phone') list = user.verifiedNumbers;
        if(!list) list = [];
        if(!list.includes(value)) list.push(value);
        if (type === 'email') user.verifiedEmail = list;
        else user.verifiedNumbers = list;
    }
    async verifyOTP (user, type, res, otp, value) {
        let types = {phone: 'Phone', email: 'Email', 'password-reset': 'Password Reset'};
        let typeMessage = types[type] || '';
        try {
            user.verifyOtp = await Otp.findAll({where: {userId : user.id}});
            let userOtp = user.verifyOtp && user.verifyOtp.length > 0 ? user.verifyOtp.filter(t => t.value === value) : [];
            // if verified, user did not request verification. return 400
            if (userOtp.length < 1 || userOtp[0].verified) return res.processError(400, 'Verification request not found');
            let message = 'Verification successful';
            userOtp = userOtp[0];
            if (!this._expired(userOtp.dateCreated)) return res.processError(400, 'Verification request has expired');
            if (userOtp.token === otp) {
                user.isActive = true;
                user.status = 'active';
                userOtp.verified = true;
                userOtp.save();
                this.saveOTPstatus(type, user, value);
                await user.save();
                logger.success(typeMessage + ' verification', {userId: user.id});
                return message;
            }
            else {
                return res.processError(400, 'Invalid token');
            }
        } catch (error) {
            logger.error( typeMessage + ' verification error', {error});
        }
    }
}




module.exports = new OTPVerification();