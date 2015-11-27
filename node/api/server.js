var Q = require('q');
var moment = require('moment');
var mongoose = require('mongoose');
mongoose.Promise = Q.promise;
var express = require('express');
var app = express();

var Tag = require('../models/tag');
var DbMetadata = require('../models/dbMetadata');
mongoose.connect('mongodb://localhost/tagTrends');

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

app.get('/api/metadata', function (req, res) {
    DbMetadata.findOne({})
        .then(function (metadata) {
            res.json(metadata);
        })
        .catch(function (err) {
            res.status(400).json(err);
        });
});

app.get('/api/tags', function (req, res) {
    req.query.matchName = req.query.matchName || '';
    var tagMatcher = new RegExp('.*' + escapeRegExp(req.query.matchName) + '.*', 'i');
    var topMatchesQuery = Tag.find({name: tagMatcher}, {name: true, totalQuestions: true}).sort('-totalQuestions');

    var max = parseInt(req.query.max);
    if (max > 0) {
        topMatchesQuery = topMatchesQuery.limit(max);
    }

    //Also search for an exact match and if one exists put it at the top of the list
    var exactMatchQuery = Tag.findOne({name: req.query.matchName});

    Q.all([topMatchesQuery, exactMatchQuery])
        .then(function (results) {
            var topMatches = results[0];
            exactMatch = results[1];

            if (exactMatch) {
                //Remove it from the top matches if it's also in there
                topMatches = topMatches.filter(function (match) {
                    return match.name !== exactMatch.name;
                });

                //Insert the exactMatch at the front
                topMatches.unshift(exactMatch);

                if(max > 0) {
                    //Remove the last element form the list if it exceeds the max
                    topMatches.splice(max, 1);
                }
            }

            res.json(topMatches);
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

app.use(express.static(__dirname + '/../../build'));

app.all('/*', function (req, res) {
    res.sendFile('index.html', {root: __dirname + '/../../build'});
});

var server = app.listen(process.env.PORT || 3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Listening at http://%s:%s', host, port);
});