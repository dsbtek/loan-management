const express = require('express');
const apiRouter = express();
const loans  = require('./loans');
const offset  = require('./offset');
const users  = require('./users');


apiRouter.use('/users', users);
apiRouter.use('/requests', loans);
apiRouter.use('/approvals', loans);
apiRouter.use('/offset', offset);
apiRouter.use('/', loans);






module.exports = apiRouter;