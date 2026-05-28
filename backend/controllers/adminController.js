const mongoose = require('mongoose');
const User = require('../models/User');
const Farmer = require('../models/Farmer');
const Buyer = require('../models/Buyer');
const Expert = require('../models/Expert');
const Contact = require('../models/Contact');

// get all users with their details
exports.getAllUsers = async (req, res) => {
    try {
        // get all users from database
        const users = await User.find().sort({ createdAt: -1 }).lean();

        // add the extra details for each user based on their role
        const usersWithDetails = await Promise.all(users.map(async (user) => {
            let roleData = null;
            if (user.role === 'farmer') {
                roleData = await Farmer.findOne({ userId: user._id });
            } else if (user.role === 'buyer') {
                roleData = await Buyer.findOne({ userId: user._id });
            } else if (user.role === 'expert') {
                roleData = await Expert.findOne({ userId: user._id });
            }

            return {
                ...user,
                details: roleData 
            };
        }));

        res.status(200).json(usersWithDetails);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

// change user status or delete
exports.updateUserStatus = async (req, res) => {
    const { id, action } = req.params; 
    try {
        const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { firebaseUid: id };

        if (action === 'delete') {
            const user = await User.findOne(query);
            if (user) {
                // Cleanup secondary role models
                if (user.role === 'farmer') await Farmer.deleteOne({ userId: user._id });
                if (user.role === 'buyer') await Buyer.deleteOne({ userId: user._id });
                if (user.role === 'expert') await Expert.deleteOne({ userId: user._id });
                await User.deleteOne({ _id: user._id });
            }
            return res.status(200).json({ message: "User permanently deleted" });
        }

        let newStatus;
        if (action === 'approve') newStatus = 'approved';
        else if (action === 'reject' || action === 'block') newStatus = 'rejected';

        const updatedUser = await User.findOneAndUpdate(
            query,
            { status: newStatus },
            { returnDocument: 'after' }
        );

        if (!updatedUser) return res.status(404).json({ error: "User not found" });

        res.status(200).json({ message: `User status updated to ${newStatus}`, user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: "Action failed" });
    }
};

// get all contact form messages
exports.getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.status(200).json(contacts);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};

// delete a contact message
exports.deleteContact = async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Message deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete message" });
    }
};
