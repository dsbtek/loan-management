const UserController = require('../../controllers/admin/users');
const express = require('express');

const router = express.Router();

router.get('/', UserController.getUsers);



module.exports = router;
