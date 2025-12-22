const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const User = require('../models/User');
const Chat = require('../models/Chat');

// @desc    Get all Messages
// @route   GET /api/message/:chatId
// @access  Protected
const allMessages = asyncHandler(async (req, res) => {
    try {
        const messages = await Message.find({
            chat: req.params.chatId,
            deletedBy: { $ne: req.user._id }
        })
            .populate('sender', 'name pic email')
            .populate('chat');
        res.json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Create New Message
// @route   POST /api/message
// @access  Protected
const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId, type } = req.body;

    if (!content || !chatId) {
        console.log('Invalid data passed into request');
        return res.sendStatus(400);
    }

    var newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId,
        type: type || 'text',
    };

    try {
        var message = await Message.create(newMessage);

        message = await message.populate('sender', 'name pic');
        message = await message.populate('chat');
        message = await User.populate(message, {
            path: 'chat.users',
            select: 'name pic email',
        });

        await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Delete Message
// @route   DELETE /api/message/:id
// @access  Protected
const deleteMessage = asyncHandler(async (req, res) => {
    const { type } = req.body; // 'everyone' or 'me'
    const messageId = req.params.id;
    const userId = req.user._id;

    try {
        const message = await Message.findById(messageId);

        if (!message) {
            res.status(404);
            throw new Error("Message not found");
        }

        if (type === 'everyone') {
            // Check if user is sender
            if (message.sender.toString() !== userId.toString()) {
                res.status(401);
                throw new Error("You can only unsend your own messages");
            }
            await Message.findByIdAndDelete(messageId);
            res.json({ message: "Message unsent", id: messageId, chat: message.chat });
        } else if (type === 'me') {
            await Message.findByIdAndUpdate(
                messageId,
                { $addToSet: { deletedBy: userId } }
            );
            res.json({ message: "Message deleted for you", id: messageId });
        } else {
            res.status(400);
            throw new Error("Invalid delete type");
        }
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

module.exports = { allMessages, sendMessage, deleteMessage };
