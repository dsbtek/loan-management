const Salary = require('../../../controllers/company/salary');
const PayItems = require('./pay-items');
const express = require('express');
const isAdmin = require('../../../middleware/isAdmin');
const router = express.Router();

router.post('/pay/:staffId', isAdmin, Salary.paySalary);
router.post('/pay-item/:staffId', isAdmin, Salary.addPayItem);
router.post('/:staffId', isAdmin, Salary.addStaffSalary);
router.get('/:companyId', isAdmin, Salary.getStaffSalaries);

// router.get('/:companyId/paid-salaries', isAdmin, Salary.getPaidSalaries);
// router.get('/:companyId/list', isAdmin, Salary.getSalaries);
// router.get('/:companyId/:type', isAdmin, Salary.getPayItems);

module.exports = router;
