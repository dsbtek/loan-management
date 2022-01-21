const express = require('express');
const apiRouter = express();
const users  = require('./users');

apiRouter.use('/users', users);







module.exports = apiRouter;