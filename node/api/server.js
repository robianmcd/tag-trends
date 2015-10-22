var Q = require('q');
var moment = require('moment');
var mongoose = require('mongoose');
mongoose.Promise = Q.promise;
var express = require('express');
var app = express();

var Tag = require('../models/tag');
var DbMetadata = require('../models/dbMetadata');
var db = mongoose.connect('mongodb://localhost/tagTrends');

app.use(express.static(__dirname + '/../../client'));

app.get('/api/metadata', function (req, res) {
    DbMetadata.findOne({}, {firstPostDate: true, lastPostDate: true, _id: false})
        .then(function (metadata) {
            res.json(metadata);
        })
        .catch(function (err) {
            res.status(400).json(err);
        });
});

app.get('/api/tags', function (req, res) {
    req.query.matchName = req.query.matchName || '';
    var tagMatcher = new RegExp('.*' + req.query.matchName + '.*', 'i');
    Tag.find({name: tagMatcher}, {name: true, totalQuestions: true})
        .then(function (tags) {
            tags.sort(function (tagA, tagB) {
                if (tagA.totalQuestions > tagB.totalQuestions) {
                    return -1;
                }
                if (tagA.totalQuestions < tagB.totalQuestions) {
                    return 1;
                }
                return 0;
            });

            var max = parseInt(req.query.max);
            if(max > 0) {
                tags = tags.slice(0, max);
            }

            res.json(tags);
        })
        .catch(function (err) {
            res.status(400).json(err);
        });
});

app.get('/api/tagByName/:tagName', function (req, res) {
    Tag.findOne({name: req.params.tagName})
        .then(function (tag) {
            if (tag) {
                res.json(tag);
            } else {
                throw {error: `Tag '${req.params.tagName}' not found.`};
            }
        })
        .catch(function (err) {
            res.status(400).json(err);
        });
});

var server = app.listen(process.env.PORT || 3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Listening at http://%s:%s', host, port);
});