const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get messages for a specific appointment with pagination
router.get('/:appointmentId', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    console.log('Fetching messages for appointment:', req.params.appointmentId);

    const messages = await Message.find({ 
      appointmentId: req.params.appointmentId 
    })
    .sort({ createdAt: 1 }) // Tri par ordre chronologique
    .skip(skip)
    .limit(limit)
    .lean();

    const totalMessages = await Message.countDocuments({ 
      appointmentId: req.params.appointmentId 
    });

    console.log('Messages found:', messages);

    res.json({
      messages,
      hasMore: totalMessages > skip + messages.length,
      total: totalMessages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error in GET /messages/:appointmentId:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Send a new message
router.post('/', auth, async (req, res) => {
  try {
    const { appointmentId, senderId, receiverId, content } = req.body;
    
    console.log('Creating new message:', { appointmentId, senderId, receiverId, content });

    const newMessage = new Message({
      appointmentId,
      senderId,
      receiverId,
      content,
      createdAt: new Date()
    });

    const savedMessage = await newMessage.save();
    const messageToSend = savedMessage.toObject();

    console.log('Message saved:', messageToSend);

    res.status(201).json(messageToSend);
  } catch (error) {
    console.error('Error in POST /messages:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Get unread messages for a specific appointment
router.get('/:appointmentId/unread', auth, async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const unreadMessages = await Message.find({ 
      appointmentId: req.params.appointmentId,
      receiverId: userId,
      isRead: false
    }).sort({ createdAt: -1 });

    res.json(unreadMessages);
  } catch (error) {
    console.error('Error in GET /messages/:appointmentId/unread:', error);
    res.status(500).json({ message: 'Error fetching unread messages', error: error.message });
  }
});

// Mark message as read
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error in PUT /messages/:messageId/read:', error);
    res.status(500).json({ message: 'Error marking message as read', error: error.message });
  }
});

module.exports = router; 