/**
 * Slack test
 */
'use strict';

var https = require('https');

// Entry point for DAG node
module.exports = function (got) {
  console.log('MAP: mapping... got', got);
  const inData = got['in'];
  //const withData = got['with'];

  console.log('MAP: mapping...');
  //console.log('MAP: inData...', inData);
  //console.log('MAP: withData...', withData);

  var promise = null;

  for (var d of inData.data) {
    console.log('MAP: data: ', d);
    if (d.value) {
      try {
        var msg = JSON.parse(d.value);
        console.log('MAP: msg: ', msg);
        var botToken = process.env._SLACK_BOT_TOKEN;
        var url = 'https://slack.com/api/chat.postMessage?token=' + botToken + '&channel=' + msg.channel + '&text=Hello%20from%20bot';

        var options = {
          host: 'slack.com',
          port : 443,
          path: '/api/chat.postMessage?token=' + botToken + '&channel=' + msg.channel + '&text=Hello%20from%20bot'
        };

        promise = new Promise(function (resolve, reject) {
          https.request(options, function (response) {
            var str = '';

            //another chunk of data has been recieved, so append it to `str`
            response.on('data', function (chunk) {
              str += chunk;
            });

            //the whole response has been recieved, so we just print it out here
            response.on('end', function () {
              console.log(str);
              resolve(null);
            });

            response.on('error', function (err) {
              reject(err);
            });
          }).end();
        });
    } catch (ex) {
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
  return promise;
};
