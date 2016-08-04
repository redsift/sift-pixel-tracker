/**
 * sift-pixel-tracker: frontend controller entry point.
 *
 * Copyright (c) 2016 Redsift Limited. All rights reserved.
 */

import { SiftController, registerSiftController } from '@redsift/sift-sdk-web';

export default class PixelTrackerController extends SiftController {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    this._summaryView = false;


    // // This is how you subscribe to the storage  (to use class variables and functions don't
    // // forget to bind the 'this' pointer!):
    // this.storage.subscribe(['year', 'month', 'day'], this.onStorageUpdate.bind(this));
    // // Subscribe to your custom events from the Sift view like so (to use class variables and functions don't
    // // forget to bind the 'this' pointer!):
    // this.view.subscribe('currency', this.onCurrencyChange.bind(this));
    this.storage.subscribe('_email.tid', this.threadUpdates.bind(this))
  }

  // Function: loadView
  // Description: Invoked when a Sift has transitioned to a final size class or when its storage has been updated
  // Parameters:
  // @value: {
  //          sizeClass: {
  //            previous: {width: 'small'|'medium'|'full', height: 'medium'|'full'},
  //            current:  {width: 'small'|'medium'|'full', height: 'medium'|'full'}
  //          },
  //          type: 'email-compose'|'email-detail'|'summary',
  //          params: {<object>}
  //        }
  // return: null or {html:'<string>', data: {<object>}}
  // @resolve: function ({html:'<string>', data: {<object>})
  // @reject: function (error)
  threadUpdates(value){
    if (!this._summaryView) return;

    console.log('sift-pixel-tracker: storage updated: ', value);
    this._getAllValues().then(graph => this.publish('graph', graph) );
  }

  loadView(state) {
    console.log('sift-pixel-tracker: loadView', state);
    var result = {
      html: 'view.html'
    };

    if (!state.params || Object.keys(state.params).length === 0) {
      if (state.type === 'summary') {
        // return async
        this._summaryView = true;
        result.data = this._getAllValues().then(g => ({ graph: g }))
      } else {
        result.data = {
          graph: {
            'name': 'no-trackers-found',
            'children': []
          }
        };
      }
    } else {
      var graph = {
        name: 'Trackers',
        children: []
      };
      var trackers = state.params.detail.trackers;

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
  }

  _getAllValues() {
    let out = this.storage;
    return new Promise(function (resolve, reject) {
      out.getAll({ bucket: '_email.tid' }).then(function (results) {
        console.log('allValues=', results);
        var graph = {
          name: 'Trackers',
          children: []
        }
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

}

// FIXXME: how can we automate the registration without developer interaction
registerSiftController(new PixelTrackerController());
