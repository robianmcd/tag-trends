var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DbMetadata = mongoose.model('DbMetadata',
    new Schema({
        firstPostDate: Date,
        lastPostDate: Date,
        totalQuestions: Number,
        usageByMonth: Object, //{numQuestions: Number}
        usageByWeek: Object //{numQuestions: Number}
    })
);

module.exports = DbMetadata;