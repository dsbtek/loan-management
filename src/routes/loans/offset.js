const OffsetController = require('../../controllers/users/offset');
const express = require('express');

const router = express.Router();

function isSubscribed(req, res, next) {
    console.log('issubscribed');
    next();
}

router.post('/:loanId/:offsetId/clear', OffsetController.clearOffset);

router.put('/:loanId/:offsetId', OffsetController.updateOffset);

router.delete('/:loanId/:offsetId', OffsetController.deleteOffset);

router.post('/:loanId', isSubscribed, OffsetController.offsetLoan);


module.exports = router;
