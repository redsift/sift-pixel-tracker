/**
 * Application event handlers
 */

// TODO: supportedTemplates
Redsift.App.loadMessageListView = function (listInfo, supportedTemplates) {
  console.log('sift-pixel-tracker: loadMessageListView: ', listInfo, supportedTemplates);
};

Redsift.App.loadThreadListView = function (listInfo, supportedTemplates) {
  console.log('sift-pixel-tracker: loadThreadListView: ', listInfo, supportedTemplates);

  var ret;
  if (listInfo && listInfo.trackers) {
    var tooltip = '';
    Object.keys(listInfo.trackers).forEach(function (tracker) {
      if (tooltip.length > 0) {
        tooltip += ', ';
      }
      tooltip += tracker;
    });

    ret = {
      template: 'image[+tooltip]',
      value: {
        imageUrl: 'https://dl.dropboxusercontent.com/u/10795357/fa-eye.png',
        tooltip: tooltip
      }
    };
  }
  return ret;
};
