
'use strict';
const appRoot = require('app-root-path');
const Handlebars = require('express-handlebars').create();
const jwt = require('jsonwebtoken');

const db = require('../db/models');
const Op = db.Sequelize.Op;
const winston = require('../services/winston');
const logger = new winston('User Management');
const EmailService = require('../services/email');
const OTPUtils = require('../utilities/otp-verifcation');
const defaultTemplates = require(appRoot + '/templates');
const { returnOnlyArrayProperties, isValidPhoneNumber, checkPassword } = require('../utilities/helpers');
let signupEmailTemplate = defaultTemplates.signup;
let passwordEmailTemplate = defaultTemplates.password;
const frontendUrl = `${process.env.FRONTEND_URL}`;
const UserService = require('../services/users');
const Message = require('../utilities/twilio');

class UserController {
    async signup (req, res) {
        return createUser(req, res);
    }
    async login (req, res ) {
        try {
            const { username, password} = req.body;
            if(!username || !password) return res.processError(400, 'Enter both user name and password');
            let user;
            user = await UserService.verifyUser(username, password);
            if (!user) {
                return res.processError(404, 'Invalid email or password');
            }
            let token = jwt.sign({id: user.id}, process.env.JWT_KEY );
            user.token = token;
            user.tokenCreatedAt = new Date();
            await user.save();
            user = returnOnlyArrayProperties(user, db.attributes.user, true);
            logger.success('Log in', {userId: user.id});
            res.send({ user, token });
        } catch (error) {
            res.processError(400, error);
        }     
    }
    async logout (req, res) {
        try {
            req.user.token = '';
            await req.user.save();
            logger.success('Log out', {userId: req.user.id});
            res.send({detail: 'Logout successful'});
        } catch (error) {
            res.processError(400, error);
        }
    }    
    // async requestEmailVerificationOtp (req, res){
    //     try {
    //         let user = await UserService.getUser(req.user.id);
    //         let otp = await OTPUtils.saveOTP(user, 'email');
    //         _sendEmailVerificationMail(user, otp, 'email');
    //         res.send({otp});
    //     } catch (error) {
    //         res.processError(400, error);
    //     }
    // }
    async requestEmailVerificationLink(req, res){
        try {
            let user = await UserService.getUser(req.user.id);
            if (!user) return res.processError(400, 'User does not exist');
            let otp = await OTPUtils.saveOTP(user, 'email', true, user.email);
            let url = frontendUrl;
            url = `${url}/verify-email?ref=${user.id}&token=${otp}`;
            // _sendPhoneVerificationCode(user, otp, 'verifyPhone');
            _sendEmailVerificationMail(user, url, 'Email Verification');
            // user.save();
            logger.success('Request email verification', {userId: req.user.id});
            res.send({detail: 'Email verification link sent'});
        } catch (error) {
            res.processError(400, 'Error requesting email verification', error);
        }
    }
    async requestPhoneVerificationCode(req, res){
        try {
            let user = await UserService.getUser(req.user.id);
            if (!user) return res.processError(400, 'User does not exist');
            let phone = req.body.phone || user.phoneNumber;
            let valid = isValidPhoneNumber(phone);
            if(!valid) return res.processError(400, 'Phone number must be entered in the format: +999999999. Up to 15 digits allowed.');
            let otp = await OTPUtils.saveOTP(user, 'phone', true, phone);
            _sendPhoneVerificationCode(user, otp, 'verifyPhone');
            logger.success('Request phone verification', {userId: req.user.id});
            res.send({detail: 'Phone verification code sent'});
        } catch (error) {
            res.processError(400, 'Error requesting email verification');
        }
    }
    async verifyEmailLink (req, res){
        try {
            let user = await UserService.getUser(req.params.userId);
            if (!user) return res.processError(400, 'user does not exist');
            let details = await OTPUtils.verifyOTP(user, 'email', res, req.params.otp, user.email);
            return res.render('response', { details});
        } catch (error) {
            res.processError(400, error);
        }
    }

    async verifyPhone(req, res){
        try {
            let user = await UserService.getUser(req.user.id);
            if (!user) return res.processError(400, 'user does not exist');
            let type = 'phone';
            let details = await OTPUtils.verifyOTP(user, type, res, req.body.otp, req.body.phone);
            return res.send({detail: 'Phone number verified'});
        } catch (error) {
            res.processError(400, error);
        }
    }

    async changePassword (req, res){
        try {
            let oldPassword = req.body.oldPassword;
            let newPassword = req.body.newPassword;
            if (!oldPassword || !newPassword) return res.processError(400, 'All fields are required');
            let results = await req.user.checkPassword(oldPassword, req.user.password);
            if (!results) return res.processError(400, 'Invalid password');
            let valid = await checkPassword(newPassword);
            if(!valid) return res.processError(400, 'Password must be minimum of 8 characters, contain both lower and upper case, number and special characters');
            req.user.setNewPassword(newPassword, req.user);
            logger.success('Change password', {userId: req.user.id});
            res.send({detail: 'Successfully change password'});
        } catch (error) {
            res.processError(400, 'Error changing password');
        }
    }

    async requestPasswordReset (req, res){
        try {
            let email = req.body.email ? req.body.email : req.user.email;
            if(!email) return res.processError(400, 'Enter a valid email request');
            let user = await UserService.getRegisteredUsers('email', email, 'user');
            if (user && user.length < 1) return res.processError(400, 'user does not exist');
            user = user[0];
            let url = frontendUrl;
            let otp = await OTPUtils.saveOTP(user, 'password-reset', true, user.email);
            url = `${url}/passwordReset?ref=${user.id}&token=${otp}`;
            _sendEmailVerificationMail(user, url, 'password-reset');
            user = user.toJSON(); 
            user.otp = otp;
            logger.success('Request password reset', {userId: user.id});
            res.send({detail: 'Password reset link sent to your mail'});
        } catch (error) {
            res.processError(400, error);
        }
    }
    // async resetPassword (req, res){
    //     try {
    //         let otp = req.body.otp;
    //         let id = req.body.id;
    //         if (!id || !otp) return res.processError(400, 'bad request');
    //         let user = await UserService.getUser(id);
    //         let verified = await OTPUtils.verifyOTP(otp, user, 'password-reset');
    //         if (verified[0] === 200) res.send({id, message: verified[1]});
    //         return res.processError(verified[0], verified[1]);
    //     } catch (error) {
    //         res.processError(400, error);
    //     }
    // }
    async setPassword (req, res){
        try {
            let { newPassword: password, userId: id, otp}  = req.body; 
            let valid = checkPassword(password);
            if(!valid) return res.processError(400, 'Password must be minimum of 8 characters, contain both lower and upper case, number and special characters');
            if(!password || !id) throw Error('Password or user cannot be null');
            let user = await UserService.getUser(id);
            if (!user ) return res.processError(400, 'User does not exist');
            let type = 'password-reset';
            let detail = await OTPUtils.verifyOTP(user, type, res, otp, user.email);
            if(!detail) return;
            await user.setNewPassword(password, user);
            return res.send({detail: 'New password successfully set'});
        } catch (error) {
            res.processError(400, 'Error setting new password');
        }
    }
    
}

async function _createUserConfig(user){
    let body = {
        reminderDays: 7,
        currency: 'NGN',
        notification: true,
    };
    // await db.UserConfig.create(body);
    await user.createUserConfig(body);
    logger.info('user config created', {userId: user.id});
}
async function  _sendEmailVerificationMail (user, url, subject, otp){
    try {
        let variables = {
            firstName: user.firstName,
            link: url,
            otp: otp,
            frontendUrl
        };
        let mailTemplate;
        if(subject.toLowerCase().includes('email')){
            mailTemplate = Handlebars._compileTemplate(signupEmailTemplate);
        } else {
            mailTemplate = Handlebars._compileTemplate(passwordEmailTemplate);

        }
        let mailContent = mailTemplate(variables);
            
        let payload = {
            subject: subject
        };
        return EmailService.sendEmail(user.email, payload, mailContent );
    } catch (error) {
        logger.error(error);
    }
}

async function  _sendPhoneVerificationCode (number, body){
    try {
        return Message.sms(number, body);
    } catch (error) {
        logger.error(error);
    }
}

const createUser = async (req, res, staff) => {
    try {
        const {email, password, firstName, lastName, phoneNumber} = req.body;
        if (!email || !password || !firstName || !lastName || !phoneNumber) return res.processError(400, 'Invalid request, all fields are required');
        let valid = checkPassword(password);
        if(!valid) return res.processError(400, 'Password must be minimum of 8 characters, contain both lower and upper case, number and special characters');
        valid = isValidPhoneNumber(phoneNumber);
        if(!valid) return res.processError(400, 'Phone numbers must be entered in the format: +999999999. Up to 15 digits allowed.');
        let body = {email, password, firstName, lastName, phoneNumber};
        // body.numbers = req.body.numbers;
        // body.emails = req.body.emails;
        body.type = 'user';
        // body.isActive = true;
        let users = await UserService.getRegisteredUsers('email', email, 'user');
        if (users.length > 0) return res.processError(400, 'This email is already associated with another account, login instead');
        users = await UserService.getRegisteredUsers('phoneNumber', phoneNumber, 'user');
        if (users.length > 0) return res.processError(400, 'This number is already associated with another account, login instead');
        let user = await UserService.createUser(body);
        if (!user) return res.processError(400, 'Error creating user');
        let otp = await OTPUtils.saveOTP(user, 'email', 'true', user.email);
        let url = frontendUrl;
        // url = `${url}/verifyEmail?ref=${user.id}&token=${otp}`;
        url = `${url}/verifyEmail/${user.id}/${otp}`;
        if (!staff) _sendEmailVerificationMail(user, url, 'Email Verification');
        _createUserConfig(user);
        logger.success('Sign up', {userId: user.id});
        if (!staff) return res.status(201).send({detail: 'Sign up successful, please login'});
        return user;
    } catch (error) {
        if (staff) throw error;
        res.processError(400, 'Error creating user', error);
    }
};


module.exports = { 
    AuthController : new UserController(), 
    createUser
};
