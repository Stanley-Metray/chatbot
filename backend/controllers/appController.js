const path = require('path');

let filePath = path.join(__dirname, '../../frontend/views/');

module.exports.getHomePage = (req, res)=>{
    res.status(200).sendFile(path.join(filePath+'index.html'));
}

module.exports.getErrorPage = (req,res)=>{
    res.status(200).sendFile(path.join(filePath+'authError.html'));
}

