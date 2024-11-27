const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    isGroup: {
        type: Boolean,
        default: false,
        required: true
    },
    groupName: { 
        type: String,
        default: null
    },
    groupDescription: { 
        type: String,
        default: null
    },
    totalMembers: { 
        type: Number,
        default: 1
    },
    admins: {
        type: Array,
        default: []
    }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
