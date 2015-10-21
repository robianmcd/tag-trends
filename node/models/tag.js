var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Tag = mongoose.model('Tag',
    new Schema({
        name: {type: String, required: true, unique: true},
        usageByMonth: Object, //{numQuestions: Number}
        usageByWeek: Object //{numQuestions: Number}
    })
);

module.exports = Tag;