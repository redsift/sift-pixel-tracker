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
  console.log('sift-pixel-tracker: load', value);
  var html;
  var data;
  if(value.sizeClass.current.height === 'list') {
    // TODO: explain that this has to be synchronous for now as all the required info should be available in 'value'
    // TODO: explain all possible templates
    html = null;
    data = {
      title: 'Example Title',
      subtitle: 'Example subtitle',
      image: {
        url: 'assets/redsift-logo.png',
        size: 'large'
      }
    };
  }
  else {
    var msg = 'returned synchronously';
    if(value.sizeClass.current.height === 'full') {
      msg = 'waiting for async response...';
      setTimeout(function () {
        // Asynchronous resolve
        resolve ({
          data: {message: 'resolved asynchronously'},
          label: 'example-sift'
        });
      }, 1500);
    }
    // TODO: return something asynchronously here
    html = 'client/index.html';
    data = {
        sizeClass: value.sizeClass.current,
        type: value.type,
        message: msg
    };
  }
  // Synchronous return
  return {
    data: data,
    html: html,
    label: 'example-sift'
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
