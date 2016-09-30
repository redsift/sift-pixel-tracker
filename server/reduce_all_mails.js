/**
 * Aggregate trackers from emails into threads.
 */
'use strict';

// Entry point for DAG node
module.exports = function (got) {
  var count = got.in.data.length;
  return {
    name: "email_totals",
    key: "total",
    value: count.toString()
  }
};
