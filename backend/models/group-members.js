const mongoose = require('mongoose');

const groupMembersSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    chatId: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const GroupMembers = mongoose.model('GroupMembers', groupMembersSchema);

module.exports = GroupMembers;
