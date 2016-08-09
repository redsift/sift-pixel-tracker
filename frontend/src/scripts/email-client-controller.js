import { EmailClientController, registerEmailClientController } from '@redsift/sift-sdk-web';

export default class PixelTrackerEmailClientController extends EmailClientController {
  constructor() {
    super();
  }

  loadThreadListView (listInfo) {
    console.log('sift-pixel-tracker: loadThreadListView: ', listInfo);
    let ret = {
      template: '003_list_common_img'
    };
    if (listInfo && listInfo.trackers) {
      let subtitle = '';
      Object.keys(listInfo.trackers).forEach(function (tracker) {
        if (subtitle.length > 0) {
          subtitle += ', ';
        }
        subtitle += tracker;
      });

      ret.value = {
        image: {
          url: 'assets/fa-eye@2x.png'
        },
        subtitle: subtitle
      };
    }
    return ret;
  };
}

registerEmailClientController(new PixelTrackerEmailClientController());
