const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    username: {type: String, unique: true},
    password: String,
    
},{timestamps: true});

const userModel = mongoose.model('user',userSchema);

module.exports = userModel;