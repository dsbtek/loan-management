const LoanController = require('../../controllers/users/loans');
const express = require('express');

const router = express.Router();


router.get('/', LoanController.getLoans);

router.post('/', LoanController.createLoan);

router.post('/request', LoanController.requestLoan);

router.get('/request', LoanController.getRequests);

router.post('/request/:id/:type', LoanController.approveLoan); // in app approval

router.get('/request/:id/:type/:approverId', LoanController.approveLoan); // in mail app approval

router.delete('/request/:id', LoanController.deleteRequest);

router.put('/request/:id', LoanController.updateRequest);

router.get('/:id', LoanController.getLoan);

router.put('/:id', LoanController.updateLoan);

router.delete('/:id?', LoanController.deleteLoan);

router.post('/:id/clear', LoanController.clearLoan);

router.post('/:id/request/:type', LoanController.approveLoan);

router.post('/:id/offset', LoanController.createOffset);

router.put('/:id/offset/:offsetId', LoanController.updateOffset);

router.delete('/:id/offset/:offsetId', LoanController.deleteOffset);

module.exports = router;
