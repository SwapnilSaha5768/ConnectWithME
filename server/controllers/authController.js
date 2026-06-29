const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../config/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const escapeRegex = (text) => {
    return text ? text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') : '';
};

// @desc    Register new user & Send OTP
// @route   POST /api/user/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, pic } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please Enter all the Feilds');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = await User.create({
        name,
        email,
        password,
        pic,
        otp,
        otpExpires,
    });

    if (user) {
        // Send Verification OTP
        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4F46E5;">ConnecT Verification</h1>
                <p>Your OTP for email verification is:</p>
                <h2 style="background-color: #F3F4F6; padding: 10px; text-align: center; border-radius: 5px; letter-spacing: 5px;">${otp}</h2>
                <p>This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'ConnecT - Email Verification OTP',
                html: message,
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                pic: user.pic,
                // Do not send token yet, wait for verification
                message: 'OTP sent to email',
            });
        } catch (error) {
            // Delete user if email fails so they can try again
            await User.findByIdAndDelete(user._id);
            res.status(500);
            throw new Error('Email could not be sent. Please try again.');
        }
    } else {
        res.status(400);
        throw new Error('Failed to Create the User');
    }
});

// @desc    Verify OTP
// @route   POST /api/user/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(400);
        throw new Error('User not found');
    }

    if (user.isVerified) {
        const token = generateToken(user._id);
        const origin = req.get('origin') || '';
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isSecure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https' || !isLocalhost;

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            blockedUsers: user.blockedUsers,
            message: "User already verified"
        });
        return;
    }

    if (user.otp === otp && user.otpExpires > Date.now()) {
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = generateToken(user._id);
        const origin = req.get('origin') || '';
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isSecure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https' || !isLocalhost;

        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Always secure for cross-site
            sameSite: 'lax', // Required for cross-site
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            blockedUsers: user.blockedUsers,
            message: "Email verified successfully"
        });
    } else {
        res.status(400);
        throw new Error('Invalid or Expired OTP');
    }
});

// @desc    Authenticate User & get token
// @route   POST /api/user/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        if (!user.isVerified) {
            // Generate new OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();

            const message = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #4F46E5;">ConnecT Verification</h1>
                    <p>Your OTP for email verification is:</p>
                    <h2 style="background-color: #F3F4F6; padding: 10px; text-align: center; border-radius: 5px; letter-spacing: 5px;">${otp}</h2>
                    <p>This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
                </div>
            `;

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'ConnecT - Email Verification OTP',
                    html: message,
                });

                res.status(403).json({
                    message: "Account not verified. A new OTP has been sent to your email.",
                    isVerified: false,
                    email: user.email
                });
                return;
            } catch (error) {
                // We don't delete the user here as they already exist, just fail the login/send
                res.status(500);
                throw new Error('Email could not be sent. Please try again.');
            }
        }

        const token = generateToken(user._id);
        const origin = req.get('origin') || '';
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isSecure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https' || !isLocalhost;

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
        });
    } else {
        console.log(`Login failed for email: ${email}. User found: ${!!user}, Password matched: ${user ? 'No (or not checked)' : 'N/A'}`);
        res.status(401);
        throw new Error('Invalid Email or Password');
    }
});

// @desc    Get or Search all users
// @route   GET /api/user?search=phani
// @access  Public
const allUsers = asyncHandler(async (req, res) => {
    const searchParam = req.query.search ? escapeRegex(req.query.search.trim()) : '';
    const keyword = searchParam
        ? {
            $or: [
                { name: { $regex: searchParam, $options: 'i' } },
                { email: { $regex: searchParam, $options: 'i' } },
            ],
        }
        : {};

    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
    res.send(users);
});

// @desc    Update User Profile
// @route   PUT /api/user/profile
// @access  Protected
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.pic = req.body.pic || user.pic;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        const token = generateToken(updatedUser._id);
        const origin = req.get('origin') || '';
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isSecure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https' || !isLocalhost;

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            pic: updatedUser.pic,
            blockedUsers: updatedUser.blockedUsers,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Forgot Password Request
// @route   POST /api/user/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Please enter an email address');
    }

    const cleanEmail = email.toLowerCase().trim();
    const escapedEmail = escapeRegex(cleanEmail);
    const user = await User.findOne({ 
        $or: [
            { email: cleanEmail },
            { email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } }
        ]
    });

    if (!user) {
        res.status(404);
        throw new Error('Email address does not exist in our database. Please register first.');
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save({ validateBeforeSave: false });

    const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Password Reset OTP</h1>
            <p>Your OTP for password reset is:</p>
            <h2 style="background-color: #F3F4F6; padding: 10px; text-align: center; border-radius: 5px; letter-spacing: 5px;">${otp}</h2>
            <p>This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
        </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'ConnecT - Password Reset OTP',
            html: message,
            text: `Your OTP is ${otp}`
        });

        res.status(200).json({ success: true, message: 'OTP sent to email' });
    } catch (error) {
        console.error("Forgot Password Email Error:", error);
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(500);
        throw new Error('Email could not be sent');
    }
});

// @desc    Reset Password
// @route   PUT /api/user/resetpassword
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;

    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const escapedEmail = escapeRegex(cleanEmail);
    const user = await User.findOne({ 
        $or: [
            { email: cleanEmail },
            { email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } }
        ]
    });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.otp === otp && user.otpExpires > Date.now()) {
        user.password = password;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = generateToken(user._id);

        const origin = req.get('origin') || '';
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isSecure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https' || !isLocalhost;

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
        });
    } else {
        res.status(400);
        throw new Error('Invalid or Expired OTP');
    }
});

// @desc    Logout user / clear cookie
// @route   POST /api/user/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
    const origin = req.get('origin') || '';
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isSecure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https' || !isLocalhost;

    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
        secure: true,
        sameSite: 'lax',
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Block a user
// @route   PUT /api/user/block
// @access  Protected
const blockUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    // Check if trying to block self
    if (userId.toString() === req.user._id.toString()) {
        res.status(400);
        throw new Error("You cannot block yourself");
    }

    const user = await User.findById(req.user._id);

    // Check if already blocked
    if (user.blockedUsers.includes(userId)) {
        res.status(400);
        throw new Error("User already blocked");
    }

    user.blockedUsers.push(userId);
    await user.save();

    res.status(200).json({ message: "User blocked successfully" });
});

// @desc    Unblock a user
// @route   PUT /api/user/unblock
// @access  Protected
const unblockUser = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(req.user._id);

    // Check if not blocked
    if (!user.blockedUsers.includes(userId)) {
        res.status(400);
        throw new Error("User is not blocked");
    }

    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId.toString());
    await user.save();

    res.status(200).json({ message: "User unblocked successfully" });
});

// @desc    Check block status
// @route   GET /api/user/check-block/:userId
// @access  Protected
const checkBlockStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Check if I blocked them
    const me = await User.findById(req.user._id);
    const isBlocked = me.blockedUsers.includes(userId);

    // Check if they blocked me
    const otherUser = await User.findById(userId);
    if (!otherUser) {
        res.status(404);
        throw new Error("User not found");
    }
    const isBlockedBy = otherUser.blockedUsers.includes(req.user._id);

    res.json({ isBlocked, isBlockedBy });
});

// @desc    Get current user
// @route   GET /api/user/me
// @access  Protected
const getMe = asyncHandler(async (req, res) => {
    if (req.user) {
        res.status(200).json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            pic: req.user.pic,
            blockedUsers: req.user.blockedUsers,
        });
    } else {
        res.status(200).json(null);
    }
});

// @desc    Authenticate or Register user via Google OAuth
// @route   POST /api/user/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
    const { token, idToken, googleId } = req.body;
    const credentialToken = token || idToken;

    let email, name, picture, sub;

    if (credentialToken) {
        try {
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const ticket = await client.verifyIdToken({
                idToken: credentialToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            email = payload.email;
            name = payload.name;
            picture = payload.picture;
            sub = payload.sub;
        } catch (error) {
            if (req.body.email && req.body.name) {
                email = req.body.email;
                name = req.body.name;
                picture = req.body.picture || req.body.pic;
                sub = googleId || req.body.sub;
            } else {
                res.status(400);
                throw new Error('Invalid Google Token');
            }
        }
    } else if (req.body.email && req.body.name) {
        email = req.body.email;
        name = req.body.name;
        picture = req.body.picture || req.body.pic;
        sub = googleId;
    } else {
        res.status(400);
        throw new Error('Google authentication credentials missing');
    }

    let user = await User.findOne({ email });

    if (user) {
        if (!user.isVerified) {
            user.isVerified = true;
        }
        if (!user.googleId && sub) {
            user.googleId = sub;
        }
        await user.save();
    } else {
        const randomPassword = crypto.randomBytes(16).toString('hex');
        user = await User.create({
            name,
            email,
            password: randomPassword,
            pic: picture || 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
            isVerified: true,
            googleId: sub,
        });
    }

    const jwtToken = generateToken(user._id);
    const origin = req.get('origin') || '';
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isSecure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https' || !isLocalhost;

    res.cookie('token', jwtToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        pic: user.pic,
        blockedUsers: user.blockedUsers || [],
        token: jwtToken,
        message: 'Google login successful',
    });
});

module.exports = { registerUser, loginUser, allUsers, verifyOTP, updateUserProfile, forgotPassword, resetPassword, logoutUser, getMe, blockUser, unblockUser, checkBlockStatus, googleAuth };

