/**
 * Finds pixel trackers in emails
 *
 * Copyright (c) 2016 Redsift Limited
 */
const htmlparser = require('htmlparser2');
const parseDomain = require('parse-domain');
const trackersRegExp = require('./trackers-regexp.json')
const url = require('url');

const styleHeightRegExp = /(?:max-|)height\s*:\s*([01]\s*px)/i;
const styleWidthRegExp = /(?:max-|)width\s*:\s*([01]\s*px)/i;

function TrackerFinder() { }

TrackerFinder.prototype.find = function (html) {
  var ret = [];
  if (!html) {
    return Promise.resolve([]);
  }
  return new Promise(function (resolve, reject) {
    var parser = new htmlparser.Parser({
      onopentag: function (tagname, attribs) {
        if (hasTracker(tagname, attribs)) {
          var tracker = trackerInfo(attribs.src);
          if (tracker) {
            ret.push(tracker);
          }
        }
      },
      onend: function () {
        resolve(ret);
      }
    }, { decodeEntities: false });
    parser.write(html);
    parser.end();
  });
};

function trackerInfo(href) {
  var u = url.parse(href);
  var di = parseDomain(u.hostname);
  var ret = null;
  if (di) {
    ret = { id: di.domain + '.' + di.tld, name: di.domain + '.' + di.tld };
    for (var i = 0; i < trackersRegExp.length; i++) {
      var re = new RegExp(trackersRegExp[i].regexp, 'i');
      if (re.test(di.domain)) {
        ret.name = trackersRegExp[i].name;
        return ret;
      }
    }
    return ret;
  }
  return;
}

function hasTracker(tagname, attribs) {
  if (tagname === 'img' && attribs.src) {
    if (attribs.width === '1' && attribs.height === '1' ||
      attribs.width === '0' && attribs.height === '0') {
      return true;
    }
    if (attribs.style) {
      var heightVal = styleHeightRegExp.exec(attribs.style);
      var widthVal = styleWidthRegExp.exec(attribs.style);
      if (heightVal && widthVal && heightVal.length > 1 && widthVal.length > 1) {
        if ((heightVal[1] === '0px' || heightVal[1] === '1px') && (widthVal[1] === '0px' || widthVal[1] === '1px')) {
          return true;
        }
      }
    }
    // TODO: tracking could also be in a normal image that has a ?id=xxxxx
  }
  return false;
}

module.exports = TrackerFinder;
