const PayItem = require('../../../controllers/company/pay-items');
const Salary = require('../../../controllers/company/salary');
const express = require('express');
const isAdmin = require('../../../middleware/isAdmin');
const router = express.Router();



router.get('/:companyId/paid-salaries', isAdmin, Salary.getPaidSalaries);
router.get('/:companyId/list', isAdmin, Salary.getSalaries);
router.get('/:companyId/:type', isAdmin, PayItem.getPayItems);
router.post('/:companyId/:type/:id', isAdmin, PayItem.addPayItem);
router.put('/:companyId/:type/:id', isAdmin, PayItem.editPayItem);
router.delete('/:companyId/:type/:id', isAdmin, PayItem.deletePayItem);

module.exports = router;
