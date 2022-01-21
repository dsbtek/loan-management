const { AuthController } = require('../controllers/auth');
const express = require('express');
const isAuthenticated = require('../middleware/isAuthenticated');

const router = express.Router();

router.post('/register', AuthController.signup.bind(AuthController));
router.post('/login', AuthController.login);
router.post('/logout', isAuthenticated, AuthController.logout);
// router.post('/requestVerification/:userId', AuthController.requestEmailVerificationDirect);
router.post('/requestVerification', isAuthenticated, AuthController.requestEmailVerificationLink);
router.post('/request-phone-verification', isAuthenticated, AuthController.requestPhoneVerificationCode);
// router.post('/verifyEmail', AuthController.verifyEmail);
router.get('/verify-email/:userId/:otp', AuthController.verifyEmailLink);
router.post('/verify-phone',  isAuthenticated, AuthController.verifyPhone);
router.post('/changePassword', isAuthenticated, AuthController.changePassword);
router.post('/requestPasswordReset', AuthController.requestPasswordReset);
// router.post('/resetPassword', AuthController.resetPassword);
router.post('/setPassword', AuthController.setPassword);



module.exports = router;
