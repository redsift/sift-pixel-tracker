/**
 * Redsift's callbacks
 *
 * Copyright (c) 2015 Redsift Limited. All rights reserved.
 */

/**
 * Sets the custom font to match the application.
 *
 * Parameters:
 * value.fontFamily: contains the string for the CSS font-family.
 * i.e: Trebuchet MS,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Tahoma,sans-serif;
 */
Sift.View.customFont = function (value) {
  // Remove if you want to control the fonts you use
  //document.body.style.fontFamily = value.fontFamily;
};

/**
 * Called by the framework when fe/index.js calls the resolve function
 *
 * Parameters:
 * value: {object} (data object returned by the load or resolve methods in the controller)
 */
Sift.View.presentView = function (value) {
  console.log('sift-pixel-tracker: presentView: ', value);
  updateGraph(value.graph);
  /*if (value.sizeClass) {
    var w = document.getElementById('width');
    w.textContent = value.sizeClass.width;
    w.style.color = '#231F20';

    var h = document.getElementById('height');
    h.textContent = value.sizeClass.height;
    h.style.color = '#231F20';
  }
  if (value.message) {
    var m = document.getElementById('message');
    m.textContent = value.message;
    m.style.color = '#231F20';
  }
  if (value.type) {
    var t = document.getElementById('type');
    t.textContent = value.type;
    t.style.color = '#231F20';
  }*/
};

/**
 * Called when a sift starts to transition between size classes
 *
 * Parameters:
 * @value: {
 *  sizeClass: {
 *    previous: {width: 'none'|'compact'|'full', height: 'none'|'list'|'compact'|'full'}, 
 *    current: {width: 'none'|'compact'|'full', height: 'none'|'list'|'compact'|'full'}
 *  },
 *  type: 'compose'|'email-detail'|'summary'
 * }
 * value.size: contains the new height and width of the view (height: text|compact|full, width: compact|full)
 * value.previous: contains the previous height and width of the view (height: text|compact|full, width: compact|full)
 */
Sift.View.willPresentView = function (value) {
  console.log('sift-pixel-tracker: willPresentView: ', value);
  /*var currWidth  = value.sizeClass.current.width;
  var prevWidth  = value.sizeClass.previous.width;
  var currHeigth = value.sizeClass.current.height;
  var prevHeight = value.sizeClass.previous.height;
  var w = document.getElementById('width');
  if (currWidth !== prevWidth) {
    w.textContent = prevWidth + ' > ' + currWidth;
    w.style.color = '#ED1651';
  }
  var h = document.getElementById('height');
  if (currHeigth !== prevHeight) {
    h.textContent = prevHeight + ' > ' + currHeigth;
    h.style.color = '#ED1651';
  }
  var m = document.getElementById('message');
  m.textContent = 'will present view';
  m.style.color = '#ED1651';*/
};
