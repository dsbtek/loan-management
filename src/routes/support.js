const UtilsController = require('../controllers/utils');
const express = require('express');
const isAuthenticated = require('../middleware/isAuthenticated');

const router = express.Router();

router.get('/currencies', UtilsController.getCurrencies);



module.exports = router;
