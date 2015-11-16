/**
 * sift-pixel-tracker. Frontend entry point
 *
 * Copyright (c) 2015 Redsift Limited. All rights reserved.
 */
include('redsift.js');
//include('moment.js'); // Uncomment if you'd like moment.js for date utils.

// Function: loadView
// Description: Invoked when a Sift has transitioned to a final size class
// Parameters:
// @value: { 
//          sizeClass: {
//            previous: {width: 'none'|'compact'|'full', height: 'none'|'list'|'compact'|'full'}, 
//            current:  {width: 'none'|'compact'|'full', height: 'none'|'list'|'compact'|'full'}
//          },
//          type: 'compose'|'email-detail'|'summary',
//          params: {<object>}
//        }
// return: null or {html:'<string>', data: {<object>}, label:'string'}
// @resolve: function ({html:'<string>', data: {<object>}, label:'string'})
// @reject: function (error)
Sift.Controller.loadView = function (value, resolve, reject) {
  console.log('sift-pixel-tracker: loadView', value);
  var result = {
    html: 'client/view.html',
    label: 'Trackers'
  };

  if (!value.params || Object.keys(value.params).length === 0) {
    if (value.type === 'summary') {
      // return async
      loadSummaryView(value, resolve, reject);
    } else {
      result.data = {
        graph: {
          'name': 'No Trackers found!',
          'children': [
          ]
        }
      };
    }
  } else {
    var graph = {};
    graph.name = 'Trackers';
    graph.children = [];
    var trackers = value.params.detail.trackers;

    Object.keys(trackers).forEach(function (tracker) {
      graph.children.push({ name: tracker, count: trackers[tracker] });
    });

    result.data = { graph: graph };
  }

  console.log('result sync=', result);
  // Synchronous return
  return result;
};

// Function: onstorageupdate
// Description: Invoked when a Sift storage data has changed
// Parameters:
// @value: { 
//          sizeClass: { 
//            current:  {width: 'none'|'compact'|'full', height: 'none'|'list'|'compact'|'full'}
//          },
//          type: 'compose'|'email-detail'|'summary',
//          params: {<object>}
//        }
// return: null or {html:'<string>', data: {<object>}, label:'string'}
// @resolve: function ({html:'<string>', data: {<object>}, label:'string'})
// @reject: function (error)
Sift.Controller.onstorageupdate = function (value, resolve, reject) {
  return Sift.Controller.loadView(value, resolve, reject);
};

function loadSummaryView(value, resolve, reject) {
  var result = {
    html: 'client/view.html',
    label: 'Trackers'
  };
  
  // "{"list":{"trackers":{"MailChimp":1}},"detail":{"trackers":{"MailChimp":1}}}"
  
  Sift.Storage.getAllValues('_tid.list').then(function (results) {
    //console.log('allValues=', results);
    var graph = {};
    graph.name = 'Trackers';
    graph.children = [];
    var trackers = {};
    results.forEach(function (result) {
      try {
        var obj = JSON.parse(result.value);
        Object.keys(obj.detail.trackers).forEach(function (tracker) {
          var count = trackers[tracker];
          if (count === null || typeof count !== 'number') {
            count = 0;
          }
          count += obj.detail.trackers[tracker];
          trackers[tracker] = count;
        });
      } catch (err) {

      }
    });

    Object.keys(trackers).forEach(function (tracker) {
      graph.children.push({ name: tracker, count: trackers[tracker] });
    });

    result.data = { graph: graph };
    console.log('result async=', result, resolve, reject);
    resolve(result);
  }).catch(function (err) {
    console.log('Got error', err);
    reject(err);
  });
}
