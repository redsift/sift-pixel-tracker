/** 
 * Mapper for finding trackers within emails.
 */
'use strict';

var htmlparser = require('htmlparser2');

const styleHeightRegExp = /(?:max-|)height\s*:\s*([01]\s*px)/i;
const styleWidthRegExp = /(?:max-|)width\s*:\s*([01]\s*px)/i;

const urlRegExp = /:\/\/([^\/]*)/i;
const trackersMap = require('./trackers.json');

var trackers = [];
Object.keys(trackersMap).forEach(function (key) {
  trackers.push(key);
});

//console.log('trackers=', trackers);

function checkForTracker(url) {
  var result = null;
  trackers.some(function (tracker) {
    //console.log('checkForTracker', tracker);
    if (url.indexOf(tracker) >= 0) {
      //console.log('fround tracker', trackersMap[tracker]);
      result = trackersMap[tracker].name;
      return;
    }
  });

  var newTracker = urlRegExp.exec(url);
  if (newTracker && newTracker.length > 1) {
    //console.log('Found new tracker', newTracker[1]);
    return { id: newTracker[1], name: result ? result : newTracker[1] };
  }

  return { id: result, name: result };
}

function getPromises(msg, epoch) {
  var promise = new Promise(function (resolve, reject) {

    var result = {
      id: msg.id,
      threadId: msg.threadId,
      trackers: {}
    };

    var parser = new htmlparser.Parser({
      onopentag: function (tagname, attribs) {
        //console.log('opentag=', tagname);
        if (tagname === 'img' && attribs.src) {
          var foundTracker = attribs.width === '1' && attribs.height === '1' ||
            attribs.width === '0' && attribs.height === '0';

          if (!foundTracker) {
            if (attribs.style) {
              var heightVal = styleHeightRegExp.exec(attribs.style);
              var widthVal = styleWidthRegExp.exec(attribs.style);
              //console.log('heightVal,widthVal', heightVal, widthVal);
              if (heightVal && widthVal && heightVal.length > 1 && widthVal.length > 1) {
                if ((heightVal[1] === '0px' || heightVal[1] === '1px') && (widthVal[1] === '0px' || widthVal[1] === '1px')) {
                  foundTracker = true;
                }
              }
            }
          }
          //console.log('attribs=', attribs);
          if (foundTracker) {
            //console.log('name, attribs=', tagname, attribs.width, attribs.height, attribs.src);
            var tracker = checkForTracker(attribs.src);

            //console.log('tracker map=', tracker);
            if (tracker !== null && tracker.id != null) {

              var trackerHash = result.trackers[tracker.id];
              var count = 0;
              //console.log('count=', count, typeof count);
              if (trackerHash) {
                count = trackerHash.count;
              } else {
                trackerHash = {};
                result.trackers[tracker.id] = trackerHash;
              }
              count += 1;
              trackerHash.count = count;
              if (tracker.id) {
                trackerHash.id = tracker.id;
              }
              if (tracker.name) {
                trackerHash.name = tracker.name;
              }
            }
          }
        }
      },
      onend: function () {
        //console.log('ending parsing!', arguments);
        resolve(result);
      }
    }, { decodeEntities: false });
    parser.write(msg.htmlBody);
    parser.end();

  });

  var promise1 = promise.then(function (result) {
    if (result.trackers && Object.keys(result.trackers).length > 0) {
      //console.log('promise1 result=', result);
      return {
        name: 'idList',
        key: result.id,
        value: {
          list: { trackers: result.trackers },
          detail: { trackers: result.trackers }
        },
        epoch: epoch
      };
    } else {
      return null;
    }
  });
  var promise2 = promise.then(function (result) {
    if (result.trackers && Object.keys(result.trackers).length > 0) {
      //console.log('promise2 result=', result);
      return {
        name: 'threads',
        key: result.threadId + '/' + result.id,
        value: result.trackers,
        epoch: epoch
      };
    } else {
      return null;
    }

  });

  return [promise1, promise2];
}

// Entry point for DAG node
module.exports = function (got) {
  console.log('env var:', process.env.REDSIFT_LARGE_STORAGE_attachments);
  var arrayOfFiles = require('fs').readdirSync(process.env.REDSIFT_LARGE_STORAGE_attachments);
  console.log('arrayOfFiles=', arrayOfFiles);
  //console.log('MAP: mapping... got', got);
  const inData = got['in'];
  //const withData = got['with'];

  console.log('MAP: mapping...');
  //console.log('MAP: inData...', inData);
  //console.log('MAP: withData...', withData);
  var ret = [];
  for (var d of inData.data) {
    //console.log('MAP: data: ', d);
    if (d.value) {
      try {
        var msg = JSON.parse(d.value);
        //console.log('MAP: msg.ID: ', msg.id, msg.threadId);

        if (msg.htmlBody && msg.htmlBody.length > 0) {
          var promises = getPromises(msg, d.epoch);
          //console.log('pushing promise', promise);
          ret.push(promises[0]);
          ret.push(promises[1]);
        }
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
  return Promise.all(ret);
};
