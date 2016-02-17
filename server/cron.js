/** 
 * Cron test node.
 */
'use strict';

// Entry point for DAG node
module.exports = function (got) {
  console.log('CRON: printing...');
  const inData = got['in'];
  const query = got.query;

  console.log('CRON: ...', inData.data.length, query);
  return null;
};
