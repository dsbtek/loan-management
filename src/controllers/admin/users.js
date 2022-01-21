const winston = require('../../services/winston');
const db = require('../../db/models');
const logger = new winston('Admin User Management');

class UserController{
    async getUsers(req, res) {
        try {
            let users = await db.User.findAll({where: {type: 'user'}});
            res.send(users);
        }
        catch(error){
            res.processError(400, 'Error getting users', error);
        }
    }
}

module.exports = new UserController();
