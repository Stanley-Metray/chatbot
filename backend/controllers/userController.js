const User = require('../models/user');
const bcrypt = require('bcrypt');
const authController = require('../controllers/authController');
const path = require('path');

let filePath = path.join(__dirname, '../../frontend/views/');

module.exports.getRegistration = (req,res)=>{
    res.status(200).sendFile(filePath + '/registration.html');
}

module.exports.postRegister = async (req, res) => {
    try {
        req.body.password = await bcrypt.hash(req.body.password, 10);
        const createdUser = await User.create(req.body);
        const token = await authController.generateToken({ id: createdUser._id, email: createdUser.email });

        let tokens = [];
        if (createdUser.tokens && createdUser.tokens.length > 0) {
            tokens = JSON.parse(createdUser.tokens);
        }
        tokens.push(token);
        createdUser.tokens = JSON.stringify(tokens);

        await createdUser.save();

        res.status(201).json({ user: createdUser.firstName, success: true, token, message: "Registration Successful" });
    } catch (error) {
        const errorMessage = Array.isArray(error.errors) ? error.errors[0].message : error;
        res.status(500).json({ message: "Internal Server Error", success: false, error: errorMessage });
        console.error(error);
    }
};

module.exports.getLoginUser = (req, res) => {
    res.status(200).sendFile(filePath + '/login.html');
}


module.exports.postLoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found, please register", success: false, error: "404 error, User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password", success: false, error: "401 error, Unauthorized" });
        }

        const token = await authController.generateToken({ id: user._id, email: user.email });

        user.tokens.push(token);

        await user.save();

        res.status(201).json({ user: user.firstName, success: true, token, message: "Login Successful" });

    } catch (error) {
        const errorMessage = Array.isArray(error.errors) ? error.errors[0].message : error;
        res.status(500).json({ message: "Internal Server Error", success: false, error: errorMessage });
        console.error(error);
    }
};

