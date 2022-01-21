'use strict';
const auth = require('./isAuthenticated');

const isAdmin = async(req, res, next) => {
    try {
        auth(req, res, function(){
            if(req.user.isAdmin){
                next();
            }
            else {
                return res.processError(401, 'Token valid, but you don\'t have the right permission to access this resource');

            }
        });
    } catch (error) {
        res.processError(401, error);
    }

};
module.exports = isAdmin;