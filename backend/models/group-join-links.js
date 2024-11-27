const mongoose = require('mongoose');

const joinLinkSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true,
        unique: true
    },
    link: {
        type: String,
        required: true
    }
}, { timestamps: true });

const JoinLink = mongoose.model('JoinLink', joinLinkSchema);

module.exports = JoinLink;
