/**
 * sift-pixel-tracker: summary view
 */
import { select } from 'd3-selection';
import { treemap, hierarchy } from 'd3-hierarchy';
import { scaleOrdinal} from 'd3-scale';
import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';
import { presentation10 } from '@redsift/d3-rs-theme';


export default class SummaryView extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    // Stores the currently displayed data so view can be reflown during transitions
    this._div = select('.treemap');


    // Subscribe to 'calendarupdated' updates from the Controller
    this.controller.subscribe('graph', this.onGraphUpdated.bind(this));


    // The SiftView provides lifecycle methods for when the Sift is fully loaded into the DOM (onLoad) and when it is
    // resizing (onResize).
    // this.registerOnLoadHandler(this.onLoad.bind(this));
    // this.registerOnResizeHandler(this.onResize.bind(this));
  }

  _updateGraph(data){
    // console.log('updateGraph:', data);
    let treeMap = treemap()
    .size([100, 100])
    .round(true);

    var hr = hierarchy(data)
      .sum(d => d.count)

    treeMap(hr);

    let getLabel = d => {
      return d.data.name === 'no-trackers-found' || d.children
      ? null
      : d.data.name + (d.data.count ? ' (' + d.data.count + ')' : '')
    };

    let scale = scaleOrdinal(presentation10.lighter);

    this._div
      .selectAll('.node')
      .data(hr.leaves())
      .enter().append('div')
        .attr('class', 'node')
        .attr('title', getLabel)
        .style('left', d => d.x0 + '%')
        .style('top', d => d.y0 + '%')
        .style('width', d => d.x1 - d.x0 + '%')
        .style('height', d => d.y1 - d.y0 + '%')
        .style('font-size', d => (d.x1 < 10 ? '10' : d.x1 < 20 ? '15' : '20' ) + 'px')
        .style('background', d => d.name === 'no-trackers-found' || d.children ? 'white' : scale(getLabel(d)))
      .append('div')
        .attr('class', 'node-child')
        .style('background-image', d => {
          return d.name === 'no-trackers-found' || d.children ? null
            : d.data.id ? `url("https://logo.clearbit.com/${d.data.id}?&size=200")`
            : `url("assets/fa-eye.png")`;
        })
        .style('background-size', d => d.data.id ? 'contain' : 'initial')
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
