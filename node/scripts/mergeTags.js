var mongoose = require('mongoose');
var Tag = require('../models/tag');
var db = mongoose.connect('mongodb://localhost/tagTrends');

var mergeFrom = 'pwa';
var mergeTo = 'progressive-web-apps';

Promise.all([
  Tag.findOne({name: mergeFrom}),
  Tag.findOne({name: mergeTo})
]).then(function(tags) {
  fromTag = tags[0];
  toTag = tags[1];

  Object.keys(fromTag.usageByMonth).forEach(month => {
    toTag.usageByMonth[month] = toTag.usageByMonth[month] || {numQuestions: 0};
    toTag.usageByMonth[month].numQuestions += fromTag.usageByMonth[month].numQuestions;
    toTag.totalQuestions += fromTag.usageByMonth[month].numQuestions;
  });

  Object.keys(fromTag.usageByWeek).forEach(month => {
    toTag.usageByWeek[month] = toTag.usageByWeek[month] || {numQuestions: 0};
    toTag.usageByWeek[month].numQuestions += fromTag.usageByWeek[month].numQuestions;
  });

  toTag.markModified('usageByMonth');
  toTag.markModified('usageByWeek');

  return Promise.all([toTag.save(), Tag.findByIdAndRemove(fromTag._id)])
})
  .then(function() {
    console.log('Finished');
    process.exit(0);
  })
  .catch(function(err) {
    console.error(err);
    process.exit(1);
  });
