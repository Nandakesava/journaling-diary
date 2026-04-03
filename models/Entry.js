const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
    content: String,
    date: Date
});

module.exports = mongoose.model('Entry', entrySchema);
