const mongoose = require('mongoose');

const archivedMessageSchema = new mongoose.Schema({
    content: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
    },
    sender: {
        type: String,
        required: true,
    },
    isAttachment: {
        type: Boolean,
        required: true,
        default: false,
    },
}, {
    timestamps: true, 
});

const ArchivedMessage = mongoose.model('ArchivedMessage', archivedMessageSchema);

module.exports = ArchivedMessage;
