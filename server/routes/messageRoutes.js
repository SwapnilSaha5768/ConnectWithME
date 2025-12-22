const express = require('express');
const {
    allMessages,
    sendMessage,
    deleteMessage,
    clearChatMessages,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/:chatId').get(protect, allMessages);
router.route('/').post(protect, sendMessage);
router.route('/:id').delete(protect, deleteMessage);
router.route('/clear/:chatId').delete(protect, clearChatMessages);

module.exports = router;
