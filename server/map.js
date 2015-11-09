/** 
 * Mapper for finding trackers within emails.
 */
'use strict';

var htmlparser = require('htmlparser2');

const urlRegExp = /:\/\/([^\/]*)/i;
const trackersMap = {
  'mailfoogae.appspot.com': 'Streak',
  'bl-1.com': 'Bananatag',
  't.yesware.com': 'Yesware',
  'mandrillapp.com/track': 'Mandrill',
  'list-manage.com/track': 'MailChimp',
  'pstmrk.it/open': 'Postmark',
  'ea.postmarkapp.com/open': 'Postmark',
  't.signauxtrois.com': 'Sidekick',
  't.sidekickopen28.com': 'Sidekick',
  'tinyletterapp.com': 'TinyLetter',
  'mixmax.com/api/track': 'MixMax',
  'pixel.adsafeprotected.com': 'adsafeprotected.com',
  'ad.doubleclick.net/ddm/ad': 'DoubleClick'
};

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
      result = trackersMap[tracker];
      return true;
    }
  });
  if (result === null) {
    var newTracker = urlRegExp.exec(url);
    if (newTracker && newTracker.length > 1) {
      console.log('Found new tracker', newTracker[1]);
      return newTracker[1];
    }
  }
  return result;
}

function getPromise(msg) {
  var promise = new Promise(function (resolve, reject) {

    var result = {
      threadId: msg.threadId,
      trackers: {}
    };

    var parser = new htmlparser.Parser({
      onopentag: function (tagname, attribs) {
        //console.log('opentag=', tagname);
        if (tagname === 'img') {
          if (attribs.src && attribs.width === '1' && attribs.height === '1' || attribs.width === '0' && attribs.height === '0') {
            //console.log('name, attribs=', tagname, attribs.width, attribs.height, attribs.src);
            var tracker = checkForTracker(attribs.src);

            //console.log('tracker=', tracker);
            if (tracker !== null) {

              var count = result.trackers[tracker];
              //console.log('count=', count, typeof count);
              if (count === null || typeof count !== 'number') {
                count = 0;
              }
              count += 1;
              result.trackers[tracker] = count;
            }
          }
        }
      },
      onend: function () {
        //console.log('ending parsing!', arguments);
        resolve({
            name: 'messages',
            key: msg.id,
            value: result
          });
      }
    }, { decodeEntities: false });
    parser.write(msg.htmlBody);
    parser.end();

  });
  return promise;
}

// Entry point for DAG node
module.exports = function (got) {
  //console.log('MAP: mapping... got', got);
  const inData = got['in'];
  //const withData = got['with'];

  console.log('MAP: mapping...');
  //console.log('MAP: inData...', inData);
  //console.log('MAP: withData...', withData);
  var ret = [];
  for (var d of inData.data) {
    //console.log('MAP: key: ', d.key);
    if (d.value) {
      try {
        var msg = JSON.parse(d.value);
        //console.log('MAP: msg.ID: ', msg.id, msg.threadId);

        if (msg.htmlBody && msg.htmlBody.length > 0 /*&& msg.htmlBody.indexOf('adsafeprotected.com') > 0*/) {
          var promise = getPromise(msg);

          //console.log('pushing promise', promise);
          ret.push(promise);
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
  //console.log('MAP: mapped length: ', ret.length);
  return Promise.all(ret);
};
