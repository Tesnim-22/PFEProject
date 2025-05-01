const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    tags: [{
        type: String
    }],
    imageUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Article', articleSchema);
