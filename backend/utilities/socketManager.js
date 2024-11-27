const authController = require('../controllers/authController');
const MissedMessage = require('../models/missedMessage');
const Message = require('../models/message');

module.exports.chatSocket = (io) => {
    io.on('connection', (socket) => {
        const { token, chatId } = socket.handshake.query;

        authController.verifyTokenForSocket(token)
            .then(async (userId) => {
                // Join the chat room
                socket.join(chatId);

                // Send any missed messages to the user
                if (chatId) {
                    const missedMessages = await MissedMessage.find({ userId, chatId });
                    missedMessages.forEach((missedMessage) => {
                        socket.emit('message', {
                            sender: missedMessage.sender,
                            content: missedMessage.content,
                        });
                    });

                    // Clear missed messages after sending
                    await MissedMessage.deleteMany({ userId, chatId });
                }

                // Listen for incoming group chat messages
                socket.on('groupChat', async (message) => {
                    const senderId = userId;

                    // Save the message to the database
                    const createdMessage = await Message.create({
                        userId: senderId,
                        chatId: message.chatId,
                        content: message.msg.content,
                        sender: message.user,
                    });

                    // Broadcast to the specific chat room
                    if (message.msg.isAttachment) {
                        io.to(chatId).emit('file-message', {
                            sender: createdMessage.sender,
                            content: {
                                content: createdMessage.content,
                                link: createdMessage.link,
                                createdAt: createdMessage.createdAt,
                            },
                        });
                    } else {
                        io.to(chatId).emit('message', {
                            sender: createdMessage.sender,
                            content: {
                                content: createdMessage.content,
                                createdAt: createdMessage.createdAt,
                            },
                        });
                    }
                });

                // Emit a broadcast when a new member is added
                socket.on('add-member', () => {
                    io.to(chatId).emit('member-added', { fetch: true });
                });

                // Handle socket disconnection
                socket.on('disconnect', async () => {
                    await MissedMessage.deleteMany({ userId, chatId });
                });
            })
            .catch((err) => {
                console.error("Authentication error:", err);
                socket.disconnect();
            });
    });
};
