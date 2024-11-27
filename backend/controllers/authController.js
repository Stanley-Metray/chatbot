const jwt = require('jsonwebtoken');
const path = require("path");

module.exports.generateToken = async (user) => {
    const payload = {
        id: user.id,
        email: user.email
    }
    const token = jwt.sign(payload, process.env.JWT_SECRETE_KEY, { expiresIn: '7d' });
    return token;
}

module.exports.verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token)
        return res.status(401).sendFile(path.join(__dirname, "../../frontend/views", "authError.html"));

    jwt.verify(token, process.env.JWT_SECRETE_KEY, (err, decoded) => {
        if (err)
        {
            console.log(err);
            return res.status(401).sendFile(path.join(__dirname, "../../frontend/views", "authError.html"));
        }
        req.body.userId = decoded.id;
        next();
    });
}

module.exports.verifyTokenForSocket = async (token) => {
    if (!token)
        return null;

    return jwt.verify(token, process.env.JWT_SECRETE_KEY, (err, decoded) => {
        if (err) {
            console.log(err);
            return null;
        }
        return userId = decoded.id;
    });
}