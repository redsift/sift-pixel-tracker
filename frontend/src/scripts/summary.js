/**
 * sift-pixel-tracker: summary view
 */
import { select } from 'd3-selection';
import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';
import { html as treemap } from '@redsift/d3-rs-treemap';


export default class SummaryView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    // Stores the currently displayed data so view can be reflown during transitions
    this._div = select('.treemap');
    this._treemap = treemap('pixel-tracker')
      .appendImage(true)
      .imageFallbackLink("assets/fa-eye@3x.png")
      .filter('emboss')


    // Subscribe to 'calendarupdated' updates from the Controller
    this.controller.subscribe('graph', this.onGraphUpdated.bind(this));


    // The SiftView provides lifecycle methods for when the Sift is fully loaded into the DOM (onLoad) and when it is
    // resizing (onResize).
    // this.registerOnLoadHandler(this.onLoad.bind(this));
    // this.registerOnResizeHandler(this.onResize.bind(this));
  }

  _updateGraph(data){
    console.log('updating graph')
    // console.log('updateGraph:', data);

    // let getLabel = d => {
    //   return d.data.name === 'no-trackers-found' || d.children
    //   ? null
    //   : d.data.name + (d.data.count ? ' (' + d.data.count + ')' : '')
    // };

 
    let w = this._div.node().offsetWidth;
    let h = select('#home').node().offsetHeight;
    this._div.datum(data).call(this._treemap.width(w).height(h));

  }

  onGraphUpdated(g){
     console.log('sift-pixel-tracker: graph', g);
    this._updateGraph(g);
  }

  presentView(value){
    console.log('sift-pixel-tracker: presentView: ', value);
    this._updateGraph(value.data.graph);
  }
  willPresentView(value){
    console.log('sift-pixel-tracker: willPresentView: ', value);
  }
}

registerSiftView(new SummaryView(window));
