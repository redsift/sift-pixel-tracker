/**
 * Creates a tree-map structure
 *
 * Copyright (c) 2016 Redsift Limited
 */
function TreeMapper() {}

TreeMapper.prototype.make = function (name, ob) {
  var ret = {
    name: name,
    children: []
  };
  Object.keys(ob).forEach(function (k) {
    ret.children.push({
      u: 'https://logo.clearbit.com/' + k + '?size=400',
      v: ob[k].count,
      l: ob[k].name
    });
  });
  return ret;
};

module.exports = TreeMapper;
