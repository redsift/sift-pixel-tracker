/** 
 * Cron test invalid node.
 */
'use strict';

// Entry point for DAG node
module.exports = function (got) {
  console.log('CRON INVALID: printing...');
  const inData = got['in'];
  const query = got.query;

  console.log('CRON INVALID: ...', inData.data.length, query);
  return null;
};
