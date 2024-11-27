const Chat = require('../models/chat');
const GroupMembers = require('../models/group-members');
const JoinLink = require('../models/group-join-links');
const Message = require('../models/message');
const User = require('../models/user');
const path = require('path');


let filePath = path.join(__dirname, '../../frontend/views/');

module.exports.postCreateChat = async (req, res) => {
    try {
        const createdChat = await Chat.create(req.body);
        console.log(req.body);
        const _id = createdChat._id.toString();        
        const createdLink = await JoinLink.create({
            chatId: _id,
            link: `${process.env.GROUP_LINK}/${_id}`
        });

        const link = createdLink.link;
        await GroupMembers.create({ userId: req.body.userId, chatId: _id, userName: req.cookies.user, isAdmin: true });
        res.status(201).json({ success: true, message: "Group created, please wait", chat: createdChat, joinLink: link });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
        console.error(error);
    }
};


module.exports.getChat = async (req, res) => {
    try {
        const chatId = req.params.id;
        const chat = await Chat.findById(chatId);
        const messages = await Message.find({ chatId });
        const joinLink = await JoinLink.findOne({ chatId });
        const members = await GroupMembers.find({ chatId });
        res.status(200).json({ success: true, chat, messages, joinLink: joinLink.link, members });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
        console.error(error);
    }
};

module.exports.getAllChats = async (req, res) => {
    try {
        const userId = req.body.userId;

        // Fetch all group memberships for the user
        const groupMembers = await GroupMembers.find({ userId });

        // Fetch all chats, messages, and join links in parallel
        const chats = await Promise.all(groupMembers.map(async (gm) => {
            const chat = await Chat.findById(gm.chatId).lean(); // Convert to plain object
            const messages = await Message.find({ chatId: gm.chatId }).lean(); // Convert to plain array of objects
            const joinLink = await JoinLink.findOne({ chatId: gm.chatId }).lean();

            return {
                ...chat, // Spread the entire chat object
                messages,
                joinLink: joinLink ? joinLink.link : null // Handle missing joinLink gracefully
            };
        }));

        res.status(200).json({ success: true, chats });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error",
            success: false,
            error: error.message
        });
    }
};

// module.exports.getAllChats = async (req, res) => {
//     try {
//         const userId = req.body.userId;
//         const groupMembers = await GroupMembers.find({ userId });
//         const chats = await Promise.all(groupMembers.map(async (gm) => {
//             const chat = await Chat.findById(gm.chatId);
//             const messages = await Message.find({ chatId: gm.chatId });
//             const joinLink = await JoinLink.findOne({ chatId: gm.chatId });
//             return { ...chat._id, messages, joinLink: joinLink.link };
//         }));
//         console.log(chats);
//         res.status(200).json({ success: true, chats });
//     } catch (error) {
//         res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
//         console.error(error);
//     }
// };

module.exports.getCreateGroup = (req, res) => {
    res.status(200).sendFile(filePath + '/create-group.html');
}

module.exports.joinGroup = async (req, res) => {
    try {
        const linkId = req.params.linkId;
        const joinLink = await JoinLink.findOne({ _id: linkId });
        if (!joinLink) {
            return res.status(404).json({ success: false, message: "Invalid link" });
        }
        const userId = req.body.userId;
        const chatId = joinLink.chatId;
        const memberExists = await GroupMembers.findOne({ chatId, userId });
        if (memberExists) {
            return res.status(400).send('You are already a member of this group');
        }
        await GroupMembers.create({ userId, chatId, userName: req.cookies.user });
        res.status(200).send('You have joined the group');
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
        console.error(error);
    }
};

module.exports.postMakeAdmin = async (req, res) => {
    try {
        const { userId, chatId, makeAdminId } = req.body;
        const member = await GroupMembers.findOne({ userId, chatId });
        if (member && member.isAdmin) {
            const makeAdminMember = await GroupMembers.findOneAndUpdate(
                { userId: makeAdminId, chatId },
                { isAdmin: true },
                { new: true }
            );
            res.status(200).json({ success: true, message: `${makeAdminMember.userName} is now an Admin` });
        } else {
            res.status(403).json({ success: false, message: "Only Group Admin can perform this action" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", success: false, error: error.message });
        console.error(error);
    }
};



module.exports.postAddMember = async (req, res) => {
    try {
        const { userId, chatId, phone } = req.body;

        const user = await GroupMembers.findOne({ userId, chatId });

        if (user && user.isAdmin) {
            
            const member = await User.findOne({ phone: phone }, '_id firstName');

            if (!member) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            const isMember = await GroupMembers.findOne({ userId: member._id, chatId });

            if (isMember) {
                return res.status(404).json({ success: false, message: "Already a member" });
            }

            // Add the user to the group
            const createdMember = await GroupMembers.create({
                chatId: chatId,
                userId: member._id,
                userName: member.firstName
            });

            // Find the chat and update the total members count
            const chat = await Chat.findById(chatId);
            if (chat) {
                chat.totalMembers = parseInt(chat.totalMembers) + 1;
                await chat.save();
                res.status(200).json({ success: true, message: "Added", member: createdMember });
            } else {
                res.status(404).json({ success: false, message: "Chat not found" });
            }
        } else {
            res.status(403).json({ success: false, message: "Only Group Admin Can Do This" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


module.exports.removeMember = async (req, res) => {
    try {
        const { userId, chatId, removeMemberId } = req.body;

        const member = await GroupMembers.findOne({ userId, chatId });
        
        if (member && member.isAdmin) {
            await GroupMembers.deleteOne({ userId: removeMemberId, chatId });

            const chat = await Chat.findById(chatId);
            if (chat) {
                chat.totalMembers = parseInt(chat.totalMembers) - 1;
                await chat.save();
                
                res.status(200).json({ success: true, message: "Removed, please wait" });
            } else {
                res.status(404).json({ success: false, message: "Chat not found" });
            }
        } else {
            res.status(403).json({ success: false, message: "Only Group Admin Can Do This" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


module.exports.postSearchMemberByPhone = async (req, res) => {
    try {
        const { phone } = req.body;

        const member = await User.findOne({ phone: phone }, 'id firstName');

        if (member) {
            res.status(200).json({ success: true, member: member });
        } else {
            res.status(404).json({ success: false, message: "User not found!" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


module.exports.postSendMessage = async (req, res) => {
    try {
        const message = new Message(req.body);
        await message.save();
        res.status(201).json({ success: true, message: message });
    } catch (error) {
        console.error(error);

        if (error instanceof mongoose.Error.ValidationError) {
            // Handling validation error
            res.status(500).json({
                message: "Internal Server Error",
                success: false,
                error: error.message,
            });
        } else {
            // Handling general error
            res.status(500).json({
                message: "Internal Server Error",
                success: false,
                error: error,
            });
        }
    }
};


module.exports.getMessages = async (req, res) => {
    try {
        const chatId = req.params.id;
        const messages = await Message.find({ chatId: chatId });
        res.status(200).json({ success: true, message: messages });
    } catch (error) {
        console.error(error);
        if (error instanceof mongoose.Error.ValidationError) {
            res.status(500).json({
                message: "Internal Server Error",
                success: false,
                error: error.message,
            });
        } else {
            res.status(500).json({
                message: "Internal Server Error",
                success: false,
                error: error,
            });
        }
    }
};







