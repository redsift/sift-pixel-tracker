/**
 * Monthly aggregation per sender domain
 *
 * Copyright (c) 2016 Redsift Limited
 */
'use strict';

const TreeMapper = require('./utils/tree-mapper.js');
const parseDomain = require('parse-domain');

// Entry point for DAG node
module.exports = function (got) {
  const inData = got['in'];
  const query = got['query'];
  var tm = new TreeMapper();
  var ret = { bucket: "senderdomains", key: query[0], value: {} };
  var domains = {};
  var services = {};
  var emails = 0;
  var tracked = 0;
  for (var d of inData.data) {
    var jv = JSON.parse(d.value);
    emails++;
    var tks = Object.keys(jv.trackers);
    if (tks.length > 0) {
      tracked++;
      if(jv.sender.email) {
        var pd = parseDomain(jv.sender.email.split('@')[1]);
        if(pd) {
          var domain = pd.domain + '.' + pd.tld;
          if (pd && !domains[domain]) {
            domains[domain] = { name: domain, count: 0 };
          }
          domains[domain].count += tks.length;
        }
        else {
          console.error('senderdomains.js: could not parse domain: ', jv.sender.email);
        }
      }
      tks.forEach(function (tk) {
        if (!services[tk]) {
          services[tk] = { name: jv.trackers[tk].name, count: jv.trackers[tk].count };
        }
        else {
          services[tk].count += jv.trackers[tk].count;
        }
      });
    }
  }
  ret.value.emails = emails;
  ret.value.tracked = tracked;
  ret.value.domains = Object.keys(domains).length;
  ret.value.services = services;
  ret.value.treemap = tm.make('Sender Domains', domains);
  return ret;
};
