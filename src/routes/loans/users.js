const UserController = require('../../controllers/users/users');
const express = require('express');

const router = express.Router();


router.post('/', UserController.createLoanUser);
router.put('/:id', UserController.updateLoanUser);
router.delete('/:id', UserController.deleteLoanUser);
router.get('/', UserController.getLoanUsers);

module.exports = router;
