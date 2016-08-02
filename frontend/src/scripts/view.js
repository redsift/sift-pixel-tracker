'use strict';
/* globals updateGraph, Sift */

/**
 * Redsift's callbacks
 *
 * Copyright (c) 2015 Redsift Limited. All rights reserved.
 */

/**
 * Called by the framework when the loadView callback in frontend/controller.js calls the resolve function or returns a value
 *
 * Parameters:
 * @value: {
 *  sizeClass: {
 *      previous: {width: 'compact'|'full', height: 'compact'|'full'},
 *      current: {width: 'compact'|'full', height: 'compact'|'full'}
 *    },
 *    type: 'email-detail'|'summary',
 *    data: {object} (data object returned by the load or resolve methods in the controller)
 *  }
 */
Sift.View.presentView = function (value) {
  console.log('sift-pixel-tracker: presentView: ', value);
  updateGraph(value.data.graph);
};

/**
 * Called when a sift starts to transition between size classes
 *
 * Parameters:
 * @value: {
 *  sizeClass: {
 *    previous: {width: 'compact'|'full', height: 'compact'|'full'},
 *    current: {width: 'compact'|'full', height: 'compact'|'full'}
 *  },
 *  type: 'email-detail'|'summary'
 * }
 * value.sizeClass.current: contains the new height and width of the view (height: compact|full, width: compact|full)
 * value.sizeClass.previous: contains the previous height and width of the view (height: compact|full, width: compact|full)
 */
Sift.View.willPresentView = function (value) {
  console.log('sift-pixel-tracker: willPresentView: ', value);
};

/**
 * Listens for 'graph' events from the Controller
 */
Sift.Controller.addEventListener('graph', function (graph) {
  console.log('sift-pixel-tracker: graph', graph);
  updateGraph(graph);
});
