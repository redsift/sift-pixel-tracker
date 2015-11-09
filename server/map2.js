/** 
 * Mapper for finding trackers within emails.
 */
'use strict';

// Entry point for DAG node
module.exports = function (got) {
  //console.log('MAP: mapping... got', got);
  const inData = got['in'];
  //const withData = got['with'];

  console.log('MAP2: mapping...');
  //console.log('MAP2: inData...', inData);
  //console.log('MAP: withData...', withData);
  var ret = [];
  for (var d of inData.data) {
    console.log('MAP2: key: ', d.key);
    if (d.value) {
      try {
        var value = JSON.parse(d.value);
        console.log('MAP2: value: ', value);

        ret.push({
          name: 'idList',
          key: d.key,
          value: {
            list: value,
            detail: value
          }
        });

        if (value.trackers && Object.keys(value.trackers).length > 0) {
          ret.push({
            name: 'threads',
            key: value.threadId + '/' + d.key,
            value: value.trackers
          });
        }
      }
      catch (ex) {
        console.error('MAP2: Error parsing value for: ', d.key);
        console.error('MAP2: Exception: ', ex);
        continue;
      }
    }
    else {
      console.log('MAP2: got a deletion: ', d.key);
    }
  }
  //console.log('MAP2: mapped: ', ret);
  return ret;
};
