const mongoose = require('mongoose');
const Message = require('../models/message');
const Chat = require('../models/chat');
const JoinLink = require('../models/group-join-links');

module.exports.config = () => {
    // User and Chat Relationship
    Chat.schema.add({
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    });

    // Chat and Message Relationship
    Message.schema.add({
        chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true }
    });

    // Chat and JoinLink Relationship
    JoinLink.schema.add({
        chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true }
    });

    // User and Message Relationship
    Message.schema.add({
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    });

    // Optional: Middleware for Cascading Deletes
    // Chat.pre('remove', async function (next) {
    //     await Message.deleteMany({ chatId: this._id });
    //     await JoinLink.deleteOne({ chatId: this._id });
    //     next();
    // });

    // User.pre('remove', async function (next) {
    //     await Chat.deleteMany({ userId: this._id });
    //     await Message.deleteMany({ userId: this._id });
    //     next();
    // });
};
