var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Post = mongoose.model('Post',
    new Schema({
        seId: String, //Id from stack exchange
        type: String, //'question' or 'answer'
        creationDate: Date,
        score: Number,
        viewCount: Number,
        commentCount: Number,
        favouriteCount: Number,
        tags: [String], //only for questions
        answerCount: Number, //only for questions
        acceptedAnswerSeId: String, //Only for questions
        questionSeId: String //Only for answers
    })
);

module.exports = Post;