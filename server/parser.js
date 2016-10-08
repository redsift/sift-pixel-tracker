/**
 * Parse trackers for incoming email messages
 *
 * Copyright (c) 2016 Redsift Limited
 */
'use strict';

var TrackerFinder = require('./utils/tracker-finder.js');
var moment = require('moment');

// Entry point for DAG node
module.exports = function (got) {
  const inData = got['in'];
  var messages = [];
  var tf = new TrackerFinder();
  for (var d of inData.data) {
    var msg = JSON.parse(d.value);
    (function (_msg) {
      messages.push(tf.find(msg.htmlBody).then(function (trackers) {
        var ct = countTrackers(trackers);
        var monthKey = moment(_msg.date).format('YYYYMM') + '/' + _msg.threadId;
        var ret = [{
          name: 'months',
          key: monthKey,
          value: {
            trackers: ct,
            sender: _msg.from
          }
        }];
        if (trackers.length > 0) {
          ret.push({ name: 'tidList', key: _msg.threadId, value: { list: { trackers: ct }, detail: { trackers: ct } } });
        }
        return ret;
      }));
    })(msg);
  }
  return Promise.all(messages).then(function (emits) {
    var ret = [];
    emits.forEach(function (e) {
      e.forEach(function (b) {
        ret.push(b);
      });
    });
    return ret;
  });
};

// Counts trackers per domain
function countTrackers(trackers) {
  var ret = {};
  trackers.forEach(function (t) {
    if (!ret[t.id]) {
      ret[t.id] = {
        name: t.name,
        count: 0
      }
    }
    ret[t.id].count++;
  });
  return ret;
}
