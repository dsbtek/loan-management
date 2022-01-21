const app = require('../../../app.js');
const request = require('supertest')(app);
const db = require('../../db/models');
const url = '/api/v1/auth/';

const base = {
    'Authorization': '', 
    'Content-Type': 'application/json'
};


const register = async (user) => {
    return await request
        .post(url + 'register')
        .send(user);  
};

const verifyEmail = async (id, token) => {
    return await request
        .get(url + `verify-email/${id}/${token}`);
};

const activate = async (email) => {
    const user = await db.User.findOne({where: {email}});
    const token = await db.Token.findOne(
        {
            where: {
                userId: user.id, 
                type: 'email', 
                value: email
            }
        });
    return verifyEmail(user.id, token.token);
};

const createNewUser = async (user) => {
    await register(user);
    await activate(user.email);
    const resp = await login(user.email, user.password);
    const data = resp.body;
    data.user.password = user.password;
    return data;
};

const login = async (username, password) => {
    return await request
        .post(url + 'login')
        .send({username, password});
};
const getAuthHeader = (data) => {
    base.Authorization = `Bearer ${data.token}`;
    return base;
};



module.exports = {
    createNewUser,
    getAuthHeader,
    login,
    register,
    verifyEmail,
};