var fs = require('fs');
var Q = require('Q');
var XmlStream = require('xml-stream');
var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Tag = require('../models/tag');
var DbMetadata = require('../models/dbMetadata');
var db = mongoose.connect('mongodb://localhost/tagTrends');

Tag.find().remove().exec()
    .then(function () {
        console.log('Tags collection removed');
        return DbMetadata.find().remove().exec();
    })
    .then(function () {
        console.log('DbMetadata collection removed');
        parseXml();
    })
    //Error handler
    .then(null, function () {
        console.error('exiting with error:', err);
        process.exit(1);
    });

function parseXml() {
    var stream = fs.createReadStream('sample-posts.xml');
    var xml = new XmlStream(stream);

    var tags = {};
    var numQuestions = 0;
    var dbMetadata = new DbMetadata();

    xml.on('endElement: row', (postObj) => {
        try {
            var post = postObj.$;
            var postTags;
            var creationDate = moment(post.CreationDate);

            //If the post is a question
            if (post.PostTypeId === '1') {
                postTags = post.Tags.substr(1, post.Tags.length - 2).split('><');

                if (numQuestions % 5000 === 0) {
                    console.log(`Questions: ${numQuestions}. Tags: ${Object.keys(tags).length}. Date: ${creationDate.format('YYYY-MM-DD')}`);
                }
                numQuestions++;

                //post.Tags looks like this '<comments><anti-patterns>'.

                var dateGroup = creationDate.format('YYYY-MM');

                postTags.forEach(function (tag) {
                    if(!tags.hasOwnProperty(tag)) {
                        tags[tag] = new Tag({
                            name: tag,
                            usageByMonth: {}
                        });
                    }

                    tags[tag].usageByMonth[dateGroup] = tags[tag].usageByMonth[dateGroup] || {numQuestions: 0};
                    tags[tag].usageByMonth[dateGroup].numQuestions++;
                });
            }

            if(!dbMetadata.firstPostDate || moment(dbMetadata.firstPostDate).isAfter(creationDate)) {
                dbMetadata.firstPostDate = creationDate;
            }

            if(!dbMetadata.lastPostDate || moment(dbMetadata.lastPostDate).isBefore(creationDate)) {
                dbMetadata.lastPostDate = creationDate;
            }

            /*
            var internalPost = {
                seId: post.Id,
                type: post.PostTypeId === '1' ? 'question' : 'answer',
                creationDate: creationDate,
                score: post.Score,
                viewCount: post.ViewCount,
                commentCount: post.CommentCount,
                favouriteCount: post.FavouriteCount
            };
            if (internalPost.type === 'question') {
                internalPost.tags = postTags;
                internalPost.answerCount = post.AnswerCount;
                internalPost.acceptedAnswerSeId = post.AcceptedAnswerId;
            } else {
                internalPost.questionSeId = post.ParentId;
            }

            xml.pause();
            var mongoPost = new Post(internalPost);
            mongoPost.save(function (err) {
                xml.resume();
                if (err) {
                    console.error(`Failed to save post: ${internalPost.seId}`, err);
                }
            });
            */

        } catch (e) {
            console.error('Exception thrown while reading XML', e);
            process.exit(1);
        }
    });

    xml.on('endElement: posts', () => {
        var tagsSaved = Object.keys(tags).map(function (tagName) {
            return tags[tagName].save();
        });

        Q.all(tagsSaved.concat([dbMetadata.save()]))
            .then(function () {
                console.log(`Done. Parsed ${numQuestions} questions.`);
                process.exit();
            })
            .catch(function (err) {
                console.error(`Failed save`, err);
                process.exit(1);
            });
    });
}
