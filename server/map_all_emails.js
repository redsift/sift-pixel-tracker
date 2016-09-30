/**
 * Mapper counting all emails.
 */
"use strict";
var assert = require("assert");

// Entry point for DAG node
module.exports = function (got) {

  const inData = got["in"];
  var count = 0;

  var id = null;

  for (var d of inData.data) {
    if (d.value) {
      try {
        var msg = JSON.parse(d.value);
        count++;
        id = msg.id;
      } catch (ex) {
        console.error('MAP: Error parsing value for: ', d.key);
        console.error('MAP: Exception: ', ex);
      }
    }
  }

  assert(count === 1);

  return {
    name: "all_emails",
    key: id,
    value: null
  }
};
