/** 
 * Aggregate trackers from emails into threads.
 */
'use strict';

// Entry point for DAG node
module.exports = function (got) {
  console.log('THREADS: aggregating...');
  const inData = got['in'];
  const query = got.query;

  //console.log('THREADS: ...', inData, query);
  
  var epoch = 0; // We'll assign the latest epoch to the thread
  var trackers = {};
  for (var d of inData.data) {
    console.log('THREADS: key: ', d.key);
    console.log('THREADS: epoch: ', d.epoch);
    //console.log('THREADS: value: ', d.value);
    
    if (d.epoch > epoch) {
      epoch = d.epoch;
    }
    
    var value = {};
    try {
      value = JSON.parse(d.value);
    } catch (err) {

    }
    Object.keys(value).forEach(function (tracker) {
      console.log('tracker threads=', tracker, value[tracker]);
      var count = 0;
      var trackerHash = trackers[tracker];
      if (trackerHash) {
        count = trackerHash.count;
      } else {
        trackerHash = {};
        trackerHash.count = 0;
        trackers[tracker] = trackerHash;
      }
      trackerHash.count += value[tracker].count;
      if (value[tracker].id) {
        trackerHash.id = value[tracker].id;
      }
      if (value[tracker].name) {
        trackerHash.name = value[tracker].name;
      }
    });
  }
  console.log('THREADS: done: ', trackers);
  //console.log('MAP: mapped length: ', ret.length);
  return { name: 'tidList', key: query[0], value: { list: { trackers: trackers }, detail: { trackers: trackers } }, epoch: epoch };
};
