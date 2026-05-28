const Machinery = require('../models/Machinery');
const MachineryBooking = require('../models/MachineryBooking');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Add new machinery
exports.addMachinery = async (req, res) => {
  try {
    const { machineName, category, brand, hourlyRate, location, condition, availableForRent, ownerFarmerId, nextServiceDate, description } = req.body;

    if (!machineName || !hourlyRate || !location || !ownerFarmerId) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const newMachinery = new Machinery({
      machineName,
      category,
      brand,
      hourlyRate: Number(hourlyRate),
      location,
      condition,
      availableForRent: availableForRent === 'true',
      ownerFarmerId,
      nextServiceDate: nextServiceDate || null,
      description,
      image: req.file ? req.file.path : null // Save the path from multer
    });

    const savedMachinery = await newMachinery.save();
    
    // Populate owner info to match what GET returns
    await savedMachinery.populate({
      path: 'ownerFarmerId',
      populate: {
        path: 'userId',
        select: 'fullName'
      }
    });

    res.status(201).json({ message: 'Equipment added successfully', machinery: savedMachinery });
  } catch (error) {    res.status(500).json({ message: 'Server error while adding machinery.', error: error.message });
  }
};

// Update existing machinery
exports.updateMachinery = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle file upload
    if (req.file) {
      // Find the old document to get the old image path
      const oldMachinery = await Machinery.findById(id).lean();
      if (oldMachinery && oldMachinery.image) {
        // Delete the old image file
        const oldImagePath = path.join(__dirname, '..', oldMachinery.image);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error("Error deleting old image:", err);
          else console.log("Old image deleted:", oldImagePath);
        });
      }
      updateData.image = req.file.path; // Set the new image path
    }

    // Convert types if necessary from form-data strings
    if (updateData.hourlyRate) updateData.hourlyRate = Number(updateData.hourlyRate);
    if (updateData.availableForRent) updateData.availableForRent = updateData.availableForRent === 'true';

    // This is the fix for the Mongoose warning.
    // { new: true } is deprecated. Use { returnDocument: 'after' }.
    const updatedMachinery = await Machinery.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after' // This returns the document AFTER the update is applied.
    }).populate({
      path: 'ownerFarmerId',
      populate: {
        path: 'userId',
        select: 'fullName'
      }
    });

    if (!updatedMachinery) {
      return res.status(404).json({ message: 'Equipment not found.' });
    }

    res.status(200).json({ message: 'Equipment updated successfully', machinery: updatedMachinery });
  } catch (error) {    res.status(500).json({ message: 'Server error while updating machinery.', error: error.message });
  }
};

// Get all machinery, with optional filter by owner
exports.getAllMachinery = async (req, res) => {
    try {
        const { owner } = req.query;
        const filter = owner ? { ownerFarmerId: owner } : {};
        const machinery = await Machinery.find(filter)
            .populate({
                path: 'ownerFarmerId',
                populate: {
                    path: 'userId',
                    select: 'fullName'
                }
            })
            .sort({ createdAt: -1 });
        res.status(200).json(machinery);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a piece of machinery
exports.deleteMachinery = async (req, res) => {
    try {
        const { id } = req.params;
        const machinery = await Machinery.findById(id);
        if (!machinery) {
            return res.status(404).json({ message: 'Equipment not found' });
        }
        // Also delete image file from server
        if (machinery.image) {
            fs.unlink(path.join(__dirname, '..', machinery.image), err => {
                if (err) console.log("Could not delete image file: ", err);
            });
        }
        await Machinery.findByIdAndDelete(id);
        res.status(200).json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create a new booking request
exports.bookMachinery = async (req, res) => {
  try {
    const booking = new MachineryBooking(req.body);
    await booking.save();
    res.status(201).json({ message: 'Booking request sent!', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate PDF Receipt for a booking
exports.generateBookingReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await MachineryBooking.findById(id)
      .populate('machineryId', 'machineName brand')
      .populate({
        path: 'ownerFarmerId',
        populate: { path: 'userId', select: 'fullName email' }
      })
      .populate({
        path: 'renterFarmerId',
        populate: { path: 'userId', select: 'fullName email' }
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-booking-${booking._id}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Equipment Rental Receipt', { align: 'center' });
    doc.moveDown();

    // Booking Info
    // Use createdAt if available (from timestamps: true), otherwise derive from _id
    const bookingDate = booking.createdAt || booking._id.getTimestamp();
    doc.fontSize(12).font('Helvetica-Bold').text('Booking ID: ', { continued: true }).font('Helvetica').text(booking._id.toString());
    doc.fontSize(12).font('Helvetica-Bold').text('Date: ', { continued: true }).font('Helvetica').text(new Date(bookingDate).toLocaleDateString());
    doc.moveDown(2);

    // Parties
    const ownerName = booking.ownerFarmerId?.userId?.fullName || 'Unknown Owner';
    const renterName = booking.renterFarmerId?.userId?.fullName || 'Unknown Renter';
    doc.fontSize(14).font('Helvetica-Bold').text('Parties Involved');
    doc.fontSize(12).font('Helvetica').text(`Owner: ${ownerName}`);
    doc.text(`Renter: ${renterName}`);
    doc.moveDown(2);

    // Equipment Details
    doc.fontSize(14).font('Helvetica-Bold').text('Rental Details');
    doc.fontSize(12).font('Helvetica').text(`Equipment: ${booking.machineryId.machineName} (${booking.machineryId.brand || 'N/A'})`);
    doc.text(`Rental Period: ${new Date(booking.startDate).toLocaleString()} to ${new Date(booking.endDate).toLocaleString()}`);
    doc.moveDown(2);

    // Cost & Status
    doc.fontSize(14).font('Helvetica-Bold').text('Payment Summary');
    doc.fontSize(12).font('Helvetica-Bold').text('Total Cost: ', { continued: true }).font('Helvetica').text(`Rs. ${booking.totalCost.toFixed(2)}`);
    doc.fontSize(18).fillColor('green').font('Helvetica-Bold').text('PAID / COMPLETED', { align: 'center', y: doc.y + 30 });
    doc.moveDown(4);
    doc.fontSize(10).fillColor('black').font('Helvetica-Oblique').text('Thank you for using CropVector!', { align: 'center' });

    doc.end();
  } catch (error) {    res.status(500).json({ message: 'Server error while generating receipt.', error: error.message });
  }
};

// Get bookings made by a specific renter
exports.getMyBookings = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const bookings = await MachineryBooking.find({ renterFarmerId: farmerId })
      .populate('machineryId', 'machineName image')
      .populate({
        path: 'ownerFarmerId',
        populate: {
          path: 'userId',
          select: 'fullName'
        }
      })
      .sort({ startDate: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get booking requests for equipment owned by a specific farmer
exports.getOwnerRequests = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const bookings = await MachineryBooking.find({ ownerFarmerId: farmerId })
      .populate('machineryId', 'machineName image')
      .populate({
        path: 'renterFarmerId',
        populate: {
          path: 'userId',
          select: 'fullName'
        }
      })
      .sort({ startDate: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update the status of a booking
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedBooking = await MachineryBooking.findByIdAndUpdate(id, { status }, { returnDocument: 'after' });
    if (!updatedBooking) return res.status(404).json({ message: 'Booking not found' });
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete/cancel a booking
exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await MachineryBooking.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Booking not found' });
        res.status(200).json({ message: 'Booking cancelled' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
