/**
 * sift-pixel-tracker: summary view
 */

import { select } from 'd3-selection';
import { transition } from 'd3-transition';
import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';
import { html as treemap } from '@redsift/d3-rs-treemap';
import '@redsift/ui-rs-hero';

export default class SummaryView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    // Stores the currently displayed data so view can be reflown during transitions
    this._div = '#treemap';
    this._treemap = treemap('pixel-tracker')
      .appendImage(true)
      .imageFallbackLink('assets/fa-eye@3x.png')
      .filter('emboss')
    this.firstTime = true;

    this.controller.subscribe('graph', this._updateGraph.bind(this));
    this.controller.subscribe("count", this.updateHero.bind(this));

    // The SiftView provides lifecycle methods for when the Sift is fully loaded into the DOM (onLoad) and when it is
    // resizing (onResize).
    // this.registerOnLoadHandler(this.onLoad.bind(this));
    // this.registerOnResizeHandler(this.onResize.bind(this));
  }

  _updateGraph(data){
    // let getLabel = d => {
    //   return d.data.name === 'no-trackers-found' || d.children
    //   ? null
    //   : d.data.name + (d.data.count ? ' (' + d.data.count + ')' : '')
    // };

    let w = select(this._div).node().offsetWidth;
    let h = select('#home').node().offsetHeight;

    let container = select(this._div).datum(data)
    if (this.firstTime) {
      this.firstTime = false;
      container.call(this._treemap.width(w).height(h));
    } else {
      container.transition()
        .delay(data.children.length / 10 * 800)
        .duration(750)
        .call(this._treemap.width(w).height(h))
    }

  }

  onGraphUpdated(g){
    console.log('sift-pixel-tracker: graph', g);
    this._updateGraph(g);
  }

  presentView(value){
    console.log('sift-pixel-tracker: presentView: ', value);
    this._updateGraph(value.data.graph);

    if (value.data.count) {
      this.updateHero(value.data.count);
    }
  }

  updateHero({trackers, total}) {
    document.getElementById("tracked_count").innerHTML = trackers;
    var tracked_ratio = (100 * trackers / total).toFixed(0);
    document.getElementById("tracked_percentage").innerHTML = tracked_ratio + "% (" + trackers + " / " + total + ") ";
  }

  willPresentView(value){
    console.log('sift-pixel-tracker: willPresentView: ', value);
  }
}

registerSiftView(new SummaryView(window));
