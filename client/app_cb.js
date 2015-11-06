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
  if (listInfo.tracker) {
    ret = {
      template: 'image[+toolip]',
      value: {
        imageUrl: 'https://dl.dropboxusercontent.com/u/10795357/fa-eye.png',
        tooltip: listInfo.tracker
      }
    };
  }
  return ret;
};
