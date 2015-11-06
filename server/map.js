/** 
 * 
 */
'use strict';

const trackerRegExp = /<img src="(.*) width="1"|height="1"/i;
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
  trackers.forEach(function (tracker) {

    if (url.indexOf(tracker) >= 0) {
      if (result === null) {
        result = {};
      }
      result.tracker = trackersMap[tracker];
    }
  });
  if (result === null) {
    var newTracker = urlRegExp.exec(url);
    if (newTracker && newTracker.length > 1) {
      console.log('newTracker=', newTracker.length, newTracker[1]);
      result = {};
      result.tracker = newTracker;
    }
  }
  return result;
}

// Entry point for DAG node
module.exports = function (got) {
  const inData = got['in'];
  const withData = got['with'];

  console.log('MAP: mapping...');
  //console.log('MAP: inData...', inData);
  console.log('MAP: withData...', withData);
  var ret = [];
  for (var d of inData.data) {
    console.log('MAP: key: ', d.key);
    if (d.value) {
      try {
        var msg = JSON.parse(d.value);
        console.log('MAP: msg.ID: ', msg.id, msg.threadId);

        if (msg.htmlBody && msg.htmlBody.length > 0) {
          var url = trackerRegExp.exec(msg.htmlBody);
          if (url && url.length > 1) {
            //console.log('found url = ', url.length, url[1]);
            var result = checkForTracker(url[1]);
            console.log('result=', result);
            if (result !== null) {
              ret.push({
                name: 'idList',
                key: msg.id,
                value: { list: result }
              });
              
              ret.push({
                name: 'tidList',
                key: msg.threadId,
                value: { list: result }
              });
            }
          }
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
  console.log('MAP: mapped: ', ret);
  return ret;
};
