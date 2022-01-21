const express = require('express');
const apiRouter = express();
const auth = require('./auth');
const users = require('./users/users');
const company = require('./company/index');
const loans = require('./loans/index');
const utils = require('./support');
const admin = require('./admin');
const noauth = require('./noauth');
const isAuthenticated = require('../middleware/isAuthenticated');
const isAdmin = require('../middleware/isAdmin');

apiRouter.use('/auth', auth);
apiRouter.use('/users', isAuthenticated, users);
apiRouter.use('/companies', company);
apiRouter.use('/loans', isAuthenticated, loans);
apiRouter.use('/support', isAuthenticated, utils);
apiRouter.use('/admin', isAdmin, admin);
apiRouter.use('/noauth',  noauth);



module.exports = apiRouter;