const mongoose  = require('mongoose');

const MessageSchema = new mongoose.Schema({

    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    recipient: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
    text: String,
    file: String,


}, {timestamps: true});

const MessageModel = mongoose.model('Message', MessageSchema);

module.exports = MessageModel;