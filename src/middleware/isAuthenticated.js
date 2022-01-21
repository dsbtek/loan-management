'use strict';
const db = require('../db/models');
const Op = db.Sequelize.Op;
const jwt = require('jsonwebtoken');
const expiresTime = process.env.JWT_EXPIRES_IN;

const auth = async(req, res, next) => {
    try {
        const token = req.header('Authorization') ? req.header('Authorization').replace('Bearer ', '') : null;
        if (!token){return res.processError(401, 'Token not provided');}
        let data = jwt.verify(token, process.env.JWT_KEY);
        let user = await db.User.findOne(
            {
                where: {id: data.id, deleted: {[Op.ne]: true}},
            });
        if (!user) {
            throw new Error();
        }
        if (user.token !== token) {
            throw new Error();
        }
        let expired = await _expired(user.tokenCreatedAt);
        if (expired) return res.processError(401, 'Token has expired');
        user.tokenCreatedAt = new Date();
        await user.save();
       
        if (user.isActive || req.path.includes('/logout') || req.path.includes('/details') || req.path.includes('/requestVerification')) {
            req.user = user;
            req.token = token;
            next();
        } else {
            return res.processError(405, 'Please activate your account');
        }
    } catch (error) {
        res.processError(401, 'Not authorized to access this resource', error );
        // res.processError(401, error );
    }

};
function _expired(date){
    let time =  expiresTime * 60;
    let tokenTime = ( new Date().getTime() - new Date(date).getTime() ) / 1000;
    // console.log('Token time', moment(date).format('hh:mm:ss'), moment(new Date()).format('hh:mm:ss'), time, tokenTime);
    return tokenTime > time;
}
module.exports = auth;