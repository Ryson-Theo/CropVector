const User = require('../models/User');
const Expert = require('../models/Expert');
const bcrypt = require('bcryptjs');
const { sendMail } = require('../config/mail');
const { expertWelcomeTemplate } = require('../utils/mailTemplates');

// get all experts with their user data
exports.getAllExperts = async (req, res) => {
    try {
        // Get all approved expert user accounts
        const expertUsers = await User.find({ role: 'expert', status: 'approved' }).lean();
        const expertDocs = await Expert.find().lean();

        const expertDocByUserId = new Map(expertDocs.map(doc => [String(doc.userId), doc]));

        const expertsWithUserData = expertUsers.map((user) => {
            const expert = expertDocByUserId.get(String(user._id));
            return {
                _id: expert?._id || user._id,
                userId: user._id,
                fullName: user.fullName || "",
                email: user.email || "",
                profilePic: user.profilePic || "",
                status: user.status || "pending",
                details: expert || {
                    phone: user.phone || "",
                    place: user.place || "",
                    specialization: user.specialization || "General",
                    address: user.address || ""
                }
            };
        });

        res.status(200).json(expertsWithUserData);
    } catch (err) {        res.status(500).json({ error: "Failed to fetch experts" });
    }
};

// create a new expert account
exports.createExpert = async (req, res) => {
    try {
        const { fullName, email, specialization, place, phone, address, password } = req.body;

        const normalizedEmail = email.toLowerCase();

        // Check if expert already exists
        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            return res.status(400).json({ error: "Expert with this email already exists" });
        }

        // use password provided or make a random one
        const finalPassword = password || Math.random().toString(36).substring(2, 10);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(finalPassword, salt);

        // create user
        user = new User({
            fullName,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'expert',
            status: 'approved' // auto-approve experts created by admin
        });

        const savedUser = await user.save();

        // create expert record
        await new Expert({
            userId: savedUser._id,
            phone,
            place,
            specialization,
            address
        }).save();

        // send email with login info
        try {
            await sendMail({
                to: normalizedEmail,
                subject: 'Welcome to CropVector - Your Expert Account',
                html: expertWelcomeTemplate({
                    name: fullName,
                    email: normalizedEmail,
                    password: finalPassword
                })
            });
        } catch (emailErr) {            // Continue execution, don't fail the request just because email failed
        }

        res.status(201).json({ 
            message: "Expert created successfully and credentials sent via email.",
            email: normalizedEmail
        });
    } catch (err) {        res.status(500).json({ error: "Failed to create expert" });
    }
};

// update an expert
exports.updateExpert = async (req, res) => {
    const { id } = req.params;
    const { fullName, email, specialization, place, phone, address } = req.body;
    
    try {
        const expert = await Expert.findById(id);
        if (!expert) return res.status(404).json({ error: "Expert not found" });

        const user = await User.findById(expert.userId);
        if (user && fullName) {
            user.fullName = fullName;
            await user.save();
        }

        await Expert.findByIdAndUpdate(id, {
            specialization,
            place,
            phone,
            address
        });

        res.status(200).json({ message: "Expert updated successfully" });
    } catch (err) {        res.status(500).json({ error: "Failed to update expert" });
    }
};

/**
 * ADMIN: DELETE EXPERT
 */
exports.deleteExpert = async (req, res) => {
    const { id } = req.params;
    
    try {
        const expert = await Expert.findById(id);
        if (!expert) return res.status(404).json({ error: "Expert not found" });

        const user = await User.findById(expert.userId);
        if (user) {
            await User.findByIdAndDelete(user._id);
        }

        await Expert.findByIdAndDelete(id);

        res.status(200).json({ message: "Expert deleted successfully" });
    } catch (err) {        res.status(500).json({ error: "Failed to delete expert" });
    }
};
