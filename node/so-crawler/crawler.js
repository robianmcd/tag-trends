var Q = require('q');
var moment = require('moment');
var mongoose = require('mongoose');
mongoose.Promise = Q.promise;
var stackexchange = require('stackexchange');
var stackApi = new stackexchange({version: 2.2});

const API_KEY = `usMySuYSR)CJxiyenPM)7Q((`;
//Aug 1 2008
const firstQuestionDate = moment.utc('2008-08-01');
//Monday Aug 4 2008
const firstQuestionWeekDate = moment.utc('2008-08-04');
//10 Minutes
const WAIT_TIME_AFTER_ERROR_MS = 600000;
//1 day
const WAIT_TIME_AFTER_QUOTA_REACHED_MS = 86400000;
//1 hour
const WAIT_TIME_AFTER_UP_TO_DATE_MS = 3600000;

var Tag = require('../models/tag');
var DbMetadata = require('../models/dbMetadata');
var db = mongoose.connect('mongodb://localhost/tagTrends');

DbMetadata.findOne()
    //Initialize the dbMetadata if it does not exist
    .then(function (dbMetadata) {
        if (!dbMetadata) {
            dbMetadata = new DbMetadata({
                firstPostDate: moment.utc(firstQuestionDate),
                lastPostDate: moment.utc(firstQuestionDate)
            });
            return dbMetadata.save();
        } else {
            return dbMetadata;
        }
    })
    .then(function (dbMetadata) {
        loadMoreQuestions(dbMetadata);
    })
    .catch(function (err) {
        console.error('Error initializing the dbMetadata', err);
        process.exit(1);
    });

function loadMoreQuestions(dbMetadata) {
    var searchOptions = {
        //Add a second to avoid getting the last post again.
        fromdate: moment.utc(dbMetadata.lastPostDate).add(1, 'seconds').unix(),
        pagesize: 100,
        order: 'asc',
        key: API_KEY,
        sort: 'creation',
        site: 'stackoverflow'
    };

    Q.denodeify(stackApi.questions.questions)(searchOptions)
        .then(
            function onSuccess(responseData) {
                return processRemainingQuestion(dbMetadata, responseData.items, 0).then(function () {
                    //Just to be on the safe side wait at least 100ms before hitting the stack exchange api again to avoid being throttled.
                    //See http://api.stackexchange.com/docs/throttle for details
                    var baseWait = 100;
                    
                    var backoffWait = 0;
                    if(responseData.backoff) {
                        console.warn(`backoff returned from api. Waiting for ${responseData.backoff} seconds`);
                        backoffWait = responseData.backoff * 1000; 
                    }
                    
                    var quotaWait = 0;
                    if(responseData.quota_remaining <= 0) {
                        console.info(`Quota reached. waiting for 1 day.`);
                        quotaWait = WAIT_TIME_AFTER_QUOTA_REACHED_MS;
                    }
                    
                    var hasMoreWait = 0;
                    if(responseData.has_more === false) {
                        hasMoreWait = WAIT_TIME_AFTER_UP_TO_DATE_MS;
                    }
                    
                    return Math.max(baseWait, backoffWait, quotaWait, hasMoreWait);
                });
            },
            function onError(err) {
                console.error('Request to api failed.', err);
                return WAIT_TIME_AFTER_ERROR_MS;
            }
        )
        .then(function (waitMs) {
            setTimeout(function () {
                loadMoreQuestions(dbMetadata);
            }, waitMs);
        })
        .catch(function (error) {
            console.error('Unexpected error', error.stack || error);
            process.exit(1);
        });
}

function processRemainingQuestion(dbMetadata, questions, index) {
    if (index < questions.length) {
        var question = questions[index];
        var creationDate = moment.utc(question.creation_date, 'X');
        var monthGroup = creationDate.format('YYYY-MM');
        var weekGroup = moment(creationDate).startOf('isoWeek').format('YYYY-MM-DD');

        var updateAllTags = question.tags.map(function (tagName) {
            return getTag(tagName).then(function (tag) {
                //TODO: move this line to the mongoose model
                tag.usageByMonth = tag.usageByMonth || {};
                tag.usageByMonth[monthGroup] = tag.usageByMonth[monthGroup] || {numQuestions: 0};
                tag.usageByMonth[monthGroup].numQuestions++;

                if(creationDate.isBefore(firstQuestionWeekDate) === false) {
                    tag.usageByWeek = tag.usageByWeek || {};
                    tag.usageByWeek[weekGroup] = tag.usageByWeek[weekGroup] || {numQuestions: 0};
                    tag.usageByWeek[weekGroup].numQuestions++;
                }

                //WTF Mongoose?!?
                tag.markModified('usageByMonth');
                tag.markModified('usageByWeek');
                return tag.save()
            });
        });

        return Promise.all(updateAllTags)
            .then(function () {
                dbMetadata.lastPostDate = creationDate;
                return dbMetadata.save();
            })
            .then(function () {
                return processRemainingQuestion(dbMetadata, questions, index + 1);
            })
    } else {
        return Promise.resolve();
    }
}

function getTag(tagName) {
    return Tag.findOne({name: tagName}).then(function (tag) {
        if (!tag) {
            var newTag = new Tag({
                name: tagName,
                usageByMonth: {},
                usageByWeek: {}
            });
            return newTag.save()
        } else {
            return tag;
        }
    });
}