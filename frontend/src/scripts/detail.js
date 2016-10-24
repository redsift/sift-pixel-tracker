/**
 * sift-pixel-tracker: email-thread view
 *
 * Copyright (c) 2016 Redsift Limited
 */
import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';

const TrackerTemplate = '<img class="trackericon" src="assets/eye-purple.svg" /><span class="trackertext">%%TRACKER%%</span>';

export default class DetailView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();
  }

  presentView(value) {
    if(value.data && value.data.trackers) {
      this._trackers = value.data.trackers;
      this._updateView();
    }
  }

  _updateView() {
    if(this._trackers) {
      let ul = document.querySelector('.trackerlist');
      while(ul.firstChild) {
        ul.removeChild(ul.firstChild);
      }
      Object.keys(this._trackers).forEach((k) => {
        let tracker = document.createElement('div');
        tracker.classList.add('tracker');
        let ct = this._trackers[k].name;
        if(this._trackers[k].count > 1) {
          ct += ' (x' + this._trackers[k].count + ')';
        }
        tracker.innerHTML = TrackerTemplate.replace('%%TRACKER%%', ct);
        ul.appendChild(tracker);
      });
    }
  }

  willPresentView(value) {}
}

registerSiftView(new DetailView(window));
