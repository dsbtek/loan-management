const LoanController = require('../controllers/users/loans');
const express = require('express');
const router = express.Router();

router.get('/loans/request/:id/:lender/:type', LoanController.approveLoan); //mail approval

module.exports = router;
