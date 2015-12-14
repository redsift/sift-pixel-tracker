'use strict';
/* globals Redsift */

/**
 * Application event handlers
 */

// TODO: supportedTemplates
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
        url: 'frontend/assets/fa-eye.png'
      },
      subtitle: subtitle
    };
  }
  return ret;
};
