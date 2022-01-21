const express = require('express');
const apiRouter = express();

const company = require('./company');
const staff = require('./staff/index');
const isCompanyAdmin = require('../../middleware/isAdmin');

apiRouter.use('/staff', staff);
apiRouter.use('/',  company);





module.exports = apiRouter;