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
    if (!this._summaryView) {
      return;
    }
    
    console.log('sift-pixel-tracker: storage updated: ', value);
    this._getAllValues().then(graph => this.publish('graph', graph) );
  }

  loadView(state) {
    console.log('sift-pixel-tracker: loadView', state);
    var result = {
      html: 'view.html',
      data: {
        graph: {}
      }
    };
    if (state.type === 'summary') {
      // return async
      this._summaryView = true;
      result.data = this._getAllValues().then(g => ({ graph: g}))
    } else if (state.type === 'email-thread'){
      var graph = {
        name: 'Trackers',
        children: []
      };
      var trackers = state.params.detail.trackers;

      Object.keys(trackers).forEach(tracker => {
        graph.children.push({
          l: tracker,
          v: trackers[tracker].count,
          u: `https://logo.clearbit.com/${tracker}?size=400`
        });
      });

      result.data.graph = graph;
    }else {
      result.data.graph = {
        'name': 'no-trackers-found',
        'children': []
      };
    }

    console.log('result sync=', result);
    // Synchronous return
    return result;
  }

  _getAllValues() {
    return this.storage.getAll({ bucket: '_email.tid' })
      .then(results => {
        // console.log('allValues=', results);
        let graph = {
          name: 'Trackers',
          children: []
        }
        let trackers = {};
        results.forEach(function (result) {
          try {
            let obj = JSON.parse(result.value);
            Object.keys(obj.detail.trackers).forEach(tracker => {
              let name = obj.detail.trackers[tracker].name.toLowerCase();
              //console.log('tracker=', tracker);
              //console.log('tracker name=', name);
              let trackerHash = trackers[name];
              if (!trackerHash) {
                trackerHash = { count: 0 };
                trackers[name] = trackerHash;
              }
              // console.log('obj.detail.trackers[tracker]', obj.detail.trackers[tracker]);
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

        Object.keys(trackers).forEach(tracker =>{
          //console.log('graphing:', tracker, trackers[tracker]);
          graph.children.push({
            v: trackers[tracker].count,
            l: trackers[tracker].name,
            u: `https://logo.clearbit.com/${trackers[tracker].id}?size=400`
          });
        });


        // console.log('graph async=', graph);
        return graph
      }).catch(function (err) {
        console.log('Got error', err);
      });
  }

}

// FIXXME: how can we automate the registration without developer interaction
registerSiftController(new PixelTrackerController());
