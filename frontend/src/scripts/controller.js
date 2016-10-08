/**
 * sift-pixel-tracker: frontend controller entry point.
 *
 * Copyright (c) 2016 Redsift Limited
 */

import { SiftController, registerSiftController } from '@redsift/sift-sdk-web';
import moment from 'moment/moment';

export default class PixelTrackerController extends SiftController {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();
    // Bind this so it can be used in callbacks
    this.onStorageUpdate = this.onStorageUpdate.bind(this);
  }

  loadView(state) {
    if (state.type === 'summary') {
      this.storage.subscribe(['senderdomains'], this.onStorageUpdate);
      return {
        html: 'summary.html',
        data: this._getData()
      };
    }
    else if (state.type === 'email-thread') {
      return {
        html: 'detail.html',
        data: state.params.detail
      }
    }
    else {
      console.error('sift-pixel-tracker: unsupported view type: ', state);
    }
  }

  onStorageUpdate(updated) {
    this._getData().then((data) => {
      this.publish('storageupdated', data);
    });
  }

  _getData() {
    let ps = [];
    return this.storage.get({
      bucket: 'senderdomains',
      keys: [
        moment().format('YYYYMM'),
        moment().subtract(1, 'month').format('YYYYMM'),
        moment().subtract(2, 'months').format('YYYYMM'),
        moment().subtract(3, 'months').format('YYYYMM'),
        moment().subtract(4, 'months').format('YYYYMM'),
        moment().subtract(5, 'months').format('YYYYMM')
      ]
    }).then((results) => {
      var ret = [];
      for (let i = 0; i < results.length; i++) {
        if (results[i].value) {
          ret.push({ month: results[i].key, data: JSON.parse(results[i].value) });
        }
      }
      return ret;
    });
  }
}

registerSiftController(new PixelTrackerController());
