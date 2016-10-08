/**
 * sift-pixel-tracker: summary view
 *
 * Copyright (c) 2016 Redsift Limited
 */

import { select, selectAll } from 'd3-selection';
import { transition } from 'd3-transition';
import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';
import { body as tip } from "@redsift/d3-rs-tip";
import { html as treemap } from '@redsift/d3-rs-treemap';
import moment from 'moment/moment';
import '@redsift/ui-rs-hero';

export default class SummaryView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    this._months = 0;
    // Bind this to method so it can be used in callbacks
    this.onStorageUpdate = this.onStorageUpdate.bind(this);
    // Register for UI events
    this.registerOnResizeHandler(this.onResize.bind(this));
    this.registerOnLoadHandler(this.onLoad.bind(this));
  }

  presentView(value) {
    this._sizeClass = value.sizeClass.current;
    if (value.data.length > 0) {
      this._data = value.data;
      this._selected = value.data[0].month;
      this._updateMonths();
      this._updateScreen(this._selected);
    }
  }

  willPresentView(value) { }

  onLoad() {
    document.getElementById('monthselector').onchange = this._updateSelection.bind(this);
    this.controller.subscribe('storageupdated', this.onStorageUpdate);
  }

  onResize() {
    this._updateTreeMap(this._selected, 1);
  }

  onStorageUpdate(data) {
    if(!this._selected) {
      this._selected = data[0].month;
    }
    this._data = data;
    this._updateMonths();
    this._updateScreen(this._selected);
  }

  _getMonth(month, data) {
    if (month && data) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].month === month) {
          return data[i].data;
        }
      }
    }
    return;
  }

  _updateSelection(ev) {
    this._selected = ev.target.value;
    this._updateScreen(this._selected);
  }

  _updateScreen(selected) {
    if (this._sizeClass.width === 230 || this._sizeClass.height === 230) {
      document.getElementById('summary').style.display = 'none';
      document.getElementById('compact').style.display = '';
      this._updateHero();
    }
    else {
      document.getElementById('summary').style.display = '';
      document.getElementById('compact').style.display = 'none';
      this._updateHero();
      this._updateStats(selected);
      this._updateTreeMap(selected);
    }
  }

  _updateMonths() {
    let months = this._data || [];
    if (months.length !== this._months) {
      this._months = months.length;
      let ms = document.getElementById('monthselector');
      while (ms.firstChild) {
        ms.removeChild(ms.firstChild);
      }
      for (let i = 0; i < months.length; i++) {
        let option = document.createElement('option');
        option.value = months[i].month;
        option.textContent = moment(months[i].month, 'YYYYMM').format('MMM YY');
        ms.appendChild(option);
      }
      if (this._selected) {
        ms.value = this._selected;
      }
    }
  }

  _updateStats(selected) {
    let month = this._getMonth(selected, this._data);
    if (month) {
      let data = month;
      let percent = 0;
      if (data.emails && data.tracked) {
        document.getElementById('monthtracked').textContent = (100 * data.tracked / data.emails).toFixed(0) + '%';
      }
    }
  }

  _updateTreeMap(selected, delay) {
    let month = this._getMonth(selected, this._data);
    let data;
    if (month) {
      data = month.treemap;
    }
    let w = select('#treemap').node().offsetWidth;
    let h = select('#home').node().offsetHeight;
    if (w && h) {
      if (!this._tm) {
        this._tm = treemap('pixel-tracker')
          .appendImage(true)
          .fill(['#ccc'])
          .imageFallbackLink('assets/eye-purple.svg');
        select('#treemap').datum(data).call(this._tm.width(w).height(h));
        this._tip = tip().html(d => { return 'Company: ' + d.data.l + '<br>Tracked emails: ' + d.data.v; });
      }
      else {
        select('#treemap').datum(data)
          .transition()
          .delay(delay || 1000)
          .duration(1000)
          .call(this._tm.width(w).height(h));
      }
      select('svg').call(this._tip);
      selectAll('.node')
        .on('mouseover', this._tip.show)
        .on('mouseout', this._tip.hide);
    }
  }

  _updateHero() {
    let current = this._getMonth(moment().format('YYYYMM'), this._data);
    if (current) {
      let percent = 0;
      if (current.emails && current.tracked) {
        percent = (100 * current.tracked / current.emails).toFixed(0);
      }
      let pt = document.getElementsByClassName('currentpercent');
      for (let i = 0; i < pt.length; i++) {
        pt[i].textContent = percent + '%';
      }
    }
  }
}

registerSiftView(new SummaryView(window));
