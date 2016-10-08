/**
 * sift-pixel-tracker: email client controller
 *
 * Copyright (c) 2016 Redsift Limited
 */
import { EmailClientController, registerEmailClientController } from '@redsift/sift-sdk-web';

export default class PixelTrackerEmailClientController extends EmailClientController {
  constructor() {
    super();
  }

  loadThreadListView (listInfo) {
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
          url: 'assets/eye.svg'
        },
        subtitle: subtitle
      };
    }
    return ret;
  };
}

registerEmailClientController(new PixelTrackerEmailClientController());
