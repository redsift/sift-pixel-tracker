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
  var html = 'client/summary.html';

  if (!value.params || Object.keys(value.params).length === 0) {
    value.params = {
      'name': 'No Trackers found!',
      'children': [
      ]
    };
  } else {
    var graph = {};
    graph.name = 'Trackers';
    graph.children = [];
    var trackers = value.params.trackers;

    Object.keys(trackers).forEach(function (tracker) {
      graph.children.push({ name: tracker, count: trackers[tracker] });
    });

    value.params = graph;
  }
  var data = { graph: value.params };

  // Synchronous return
  return {
    data: data,
    html: html,
    label: 'Trackers'
  };
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
