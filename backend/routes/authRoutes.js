// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Controllers
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const adminExpertController = require('../controllers/adminExpertController');
const adminCropController = require('../controllers/adminCropController');

// setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// register route
router.post(
  '/register',
  upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'license', maxCount: 1 },
    { name: 'qualification', maxCount: 1 },
  ]),
  authController.register
);

router.post('/login', authController.login);
router.post('/login-firebase', authController.loginWithFirebase);

// profile routes
router.get('/profile', authController.getProfile);
router.patch(
  '/profile/update',
  upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'license', maxCount: 1 },
    { name: 'qualification', maxCount: 1 },
  ]),
  authController.updateProfile
);

// admin routes
router.get('/admin/users', adminController.getAllUsers);
router.patch('/admin/users/:id/:action', adminController.updateUserStatus);
router.get('/admin/contacts', adminController.getAllContacts);
router.delete('/admin/contacts/:id', adminController.deleteContact);

// expert management
router.get('/admin/experts', adminExpertController.getAllExperts);
router.post('/admin/create-expert', adminExpertController.createExpert);
router.patch('/admin/experts/:id', adminExpertController.updateExpert);
router.delete('/admin/experts/:id', adminExpertController.deleteExpert);

// crop admin routes
router.get('/admin/crops', adminCropController.getCrops);
router.put('/admin/crops', adminCropController.replaceCrops);
router.delete('/admin/crops/:index', adminCropController.deleteCrop);

// otp routes
router.post(
  '/request-otp',
  upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'license', maxCount: 1 },
    { name: 'qualification', maxCount: 1 },
  ]),
  authController.requestOtp
);

router.post('/verify-otp', authController.verifyOtp);
router.post('/forgot-password', authController.forgotPasswordRequest);
router.post('/reset-password', authController.resetPasswordWithOtp);

// user settings routes
router.post('/otp/generate', authController.generateOtp);
router.post('/otp/verify', authController.verifyGenericOtp);
router.post('/password/reset', authController.resetPasswordFromSettings);
router.post('/verify-password', authController.verifyPassword);
router.post('/email/update', authController.updateEmail);

router.post('/contact', authController.contactUs);

module.exports = router;
