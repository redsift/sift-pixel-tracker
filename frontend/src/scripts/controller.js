'use strict';
/* globals include, Redsift, Sift */

/**
 * sift-pixel-tracker. Frontend entry point
 *
 * Copyright (c) 2015 Redsift Limited. All rights reserved.
 */

var summaryView = false;

function getAllValues() {
  return new Promise(function (resolve, reject) {
    Sift.Storage.getAll({ bucket: '_email.tid' }).then(function (results) {
      //console.log('allValues=', results);
      var graph = {};
      graph.name = 'Trackers';
      graph.children = [];
      var trackers = {};
      results.forEach(function (result) {
        try {
          var obj = JSON.parse(result.value);
          Object.keys(obj.detail.trackers).forEach(function (tracker) {
            var name = obj.detail.trackers[tracker].name.toLowerCase();
            //console.log('tracker=', tracker);
            //console.log('tracker name=', name);
            var trackerHash = trackers[name];
            if (!trackerHash) {
              trackerHash = {};
              trackerHash.count = 0;
              trackers[name] = trackerHash;
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
              if (obj.detail.trackers[tracker].id) {
                trackerHash.id = obj.detail.trackers[tracker].id;
              }
            }
          });
        } catch (err) {
          console.error('getAllValues err', err);
        }
      });

      Object.keys(trackers).forEach(function (tracker) {
        //console.log('graphing:', tracker, trackers[tracker]);
        graph.children.push({ id: trackers[tracker].id, count: trackers[tracker].count, name: trackers[tracker].name });
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

Sift.Storage.addUpdateListener('_email.tid', function (value) {
  if (summaryView) {
    console.log('sift-pixel-tracker: storage updated: ', value);
    getAllValues().then(function (graph) {
      Sift.Controller.notifyListeners('graph', graph);
    });
  }
});

/**
 * Application event handlers
 */

Redsift.Client.loadMessageListView = function (listInfo, supportedTemplates) {
  console.log('sift-pixel-tracker: loadMessageListView: ', listInfo, supportedTemplates);
  return Redsift.Client.loadThreadListView(listInfo, supportedTemplates);
};

Redsift.Client.loadThreadListView = function (listInfo, supportedTemplates) {
  console.log('sift-pixel-tracker: loadThreadListView: ', listInfo, supportedTemplates);

  var ret = {
    template: '003_list_common_img'
  };
  if (listInfo && listInfo.trackers) {
    var subtitle = '';
    Object.keys(listInfo.trackers).forEach(function (tracker) {
      if (subtitle.length > 0) {
        subtitle += ', ';
      }
      subtitle += tracker;
    });

    ret.value = {
      image: {
        url: 'frontend/assets/fa-eye@2x.png'
      },
      subtitle: subtitle
    };
  }
  return ret;
};
