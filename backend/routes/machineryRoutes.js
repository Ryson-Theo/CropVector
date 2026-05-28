const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  addMachinery,
  updateMachinery,
  deleteMachinery,
  getAllMachinery,
  bookMachinery,
  getMyBookings,
  getOwnerRequests,
  updateBookingStatus,
  deleteBooking,
  generateBookingReceipt
} = require("../controllers/machineryController");

// --- Multer Storage Configuration for Machinery Images ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define the path for machinery images
    const uploadPath = path.join('uploads', 'machinery');
    
    // Ensure the directory exists, create it if it doesn't
    fs.mkdirSync(uploadPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create a unique filename to prevent overwrites
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Machinery Routes
// Apply multer middleware to handle the 'image' file upload
router.post("/add", upload.single('image'), addMachinery);
router.get("/", getAllMachinery); // Handles both market and owner filter via query
router.put("/update/:id", upload.single('image'), updateMachinery);
router.delete("/delete/:id", deleteMachinery);

// Booking Routes
router.post("/book", bookMachinery);
router.get("/my-bookings/:farmerId", getMyBookings);
router.get("/owner-requests/:farmerId", getOwnerRequests);
router.put("/booking/:id", updateBookingStatus);
router.get("/booking/:id/receipt", generateBookingReceipt);
router.delete("/booking/:id", deleteBooking); // For cancelling requests

module.exports = router;
