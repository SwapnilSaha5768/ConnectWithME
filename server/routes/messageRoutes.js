const express = require('express');
const {
    allMessages,
    sendMessage,
    deleteMessage,
    clearChatMessages,
    readMessage,
    markUnread,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/:chatId').get(protect, allMessages);
router.route('/').post(protect, sendMessage);
router.route('/read').put(protect, readMessage);
router.route('/unread').put(protect, markUnread);
router.route('/:id').delete(protect, deleteMessage);
router.route('/clear/:chatId').delete(protect, clearChatMessages);

module.exports = router;
