/**
 * Slack test
 */
'use strict';

// Entry point for DAG node
module.exports = function (got) {
  console.log('MAP: mapping... got', got);
  const inData = got['in'];
  //const withData = got['with'];

  console.log('MAP: mapping...');
  //console.log('MAP: inData...', inData);
  //console.log('MAP: withData...', withData);

  for (var d of inData.data) {
    console.log('MAP: data: ', d);
    if (d.value) {
      try {
        var msg = JSON.parse(d.value);
        console.log('MAP: msg: ', msg);
      }
      catch (ex) {
        console.error('MAP: Error parsing value for: ', d.key);
        console.error('MAP: Exception: ', ex);
        continue;
      }
    }
    else {
      console.log('MAP: got a deletion: ', d.key);
    }
  }
  //console.log('MAP: mapped: ', ret);
  //console.log('MAP: mapped length: ', ret, ret.length);
  return null;
};
