'use strict';
/* globals include, Sift */

/**
 * sift-pixel-tracker. Frontend entry point
 *
 * Copyright (c) 2015 Redsift Limited. All rights reserved.
 */

var summaryView = false;

function getAllValues() {
  return new Promise(function (resolve, reject) {
    Sift.Storage.getAll({ bucket: '_tid.list' }).then(function (results) {
      //console.log('allValues=', results);
      var graph = {};
      graph.name = 'Trackers';
      graph.children = [];
      var trackers = {};
      results.forEach(function (result) {
        try {
          var obj = JSON.parse(result.value);
          Object.keys(obj.detail.trackers).forEach(function (tracker) {
            var trackerHash = trackers[tracker];
            if (!trackerHash) {
              trackerHash = {};
              trackerHash.count = 0;
              trackers[tracker] = trackerHash;
            }
            console.log('obj.detail.trackers[tracker]', obj.detail.trackers[tracker]);
            if (typeof obj.detail.trackers[tracker] === 'number') {
              trackerHash.count += obj.detail.trackers[tracker];
            } else {
              if (obj.detail.trackers[tracker].count) {
                trackerHash.count += obj.detail.trackers[tracker].count;
              }
              if (obj.detail.trackers[tracker].name) {
                trackerHash.name = obj.detail.trackers[tracker].name;
              }
            }
          });
        } catch (err) {
          console.error('getAllValues err', err);
        }
      });

      Object.keys(trackers).forEach(function (tracker) {
        graph.children.push({ id: tracker, count: trackers[tracker].count, name: trackers[tracker].name });
      });

      console.log('graph async=', graph, resolve, reject);
      resolve(graph);
    }).catch(function (err) {
      console.log('Got error', err);
      reject(err);
    });
  });
}

function loadSummaryView(value, resolve, reject) {
  summaryView = true;
  var result = {
    html: 'frontend/view.html'
  };

  getAllValues().then(function (graph) {
    result.data = { graph: graph };
    resolve(result);
  }).catch(reject);
}

// Function: loadView
// Description: Invoked when a Sift has transitioned to a final size class
// Parameters:
// @value: { 
//          sizeClass: {
//            previous: {width: 'compact'|'full', height: 'compact'|'full'}, 
//            current:  {width: 'compact'|'full', height: 'compact'|'full'}
//          },
//          type: 'compose'|'email-detail'|'summary',
//          params: {<object>}
//        }
// return: null or {html:'<string>', data: {<object>}}
// @resolve: function ({html:'<string>', data: {<object>}})
// @reject: function (error)
Sift.Controller.loadView = function (value, resolve, reject) {
  console.log('sift-pixel-tracker: loadView', value);
  var result = {
    html: 'frontend/view.html'
  };

  if (!value.params || Object.keys(value.params).length === 0) {
    if (value.type === 'summary') {
      // return async
      loadSummaryView(value, resolve, reject);
    } else {
      result.data = {
        graph: {
          'name': 'no-trackers-found',
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
      if (typeof trackers[tracker] === 'number') {
        graph.children.push({ name: tracker, count: trackers[tracker] });
      } else {
        graph.children.push({ name: tracker, count: trackers[tracker].count, url: trackers[tracker].url }); 
      }
    });

    result.data = { graph: graph };
  }

  console.log('result sync=', result);
  // Synchronous return
  return result;
};

Sift.Storage.addUpdateListener('_tid.list', function (value) {
  if (summaryView) {
    console.log('sift-pixel-tracker: storage updated: ', value);
    getAllValues().then(function (graph) {
      Sift.View.notify('graph', graph);
    });
  }
});
