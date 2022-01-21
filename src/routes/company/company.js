const UserController = require('../../controllers/company/company');
const express = require('express');
const isAdmin = require('../../middleware/isAdmin');

const router = express.Router();

router.post('/', isAdmin, UserController.createCompany);
router.get('/:companyId?', isAdmin, UserController.getCompanies);
router.get('/get-add-staff-link/:id', isAdmin, UserController.getLink);

module.exports = router;
