var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DbMetadata = mongoose.model('DbMetadata',
    new Schema({
        firstPostDate: Date,
        lastPostDate: Date
    })
);

module.exports = DbMetadata;