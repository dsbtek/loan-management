const express = require('express');
const apiRouter = express();

const staff = require('./staff');
const salary = require('./salary');
const payItem = require('./pay-items');
const isCompanyAdmin = require('../../../middleware/isAdmin');

apiRouter.use('/salary', isCompanyAdmin, payItem);
apiRouter.use('/salary', isCompanyAdmin, salary);
apiRouter.use('/', staff);

module.exports = apiRouter;