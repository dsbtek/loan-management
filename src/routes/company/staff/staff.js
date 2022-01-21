const Staff = require('../../../controllers/company/staff');
const Salary = require('../../../controllers/company/salary');
const express = require('express');
const isAdmin = require('../../../middleware/isAdmin');
const router = express.Router();

router.post('/activate/:id', isAdmin, Staff.changeStatus);
router.post('/amount/:id', isAdmin, Staff.updateStaff);


router.post('/salary/pay/:id', isAdmin, Salary.addPayItem);
// router.get('/salary/:id', isAdmin, Salary.getStaffPay);
router.post('/paid/:id', isAdmin, Salary.setPaymentStatus);

router.get('/:companyId', isAdmin,  Staff.getAllStaff);
router.post('/:companyId/:userId/:admin', isAdmin, Staff.addStaff);
router.post('/:companyId/:userId', Staff.addStaff);
// router.post('/:id', Staff.createStaff);


module.exports = router;
