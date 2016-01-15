'use strict';
/* globals d3 */

/*var data = {
  "name": "cluster",
  "children": [
    { "name": "Yesware", "count": 5, "url": "" },
    { "name": "Sidekick", "count": 3, "url": "" },
    { "name": "Postmark", "count": 18, "url": "" }
  ]
};*/

var color = d3.scale.category20c();

var treemap =
  d3.layout.treemap()
  // use 100 x 100 px, which we'll apply as % later
    .size([100, 100])
    .sticky(false)
    .value(function (d) { return d.count; });

var div = d3.select('.treemap');

function getLabel(d) {
  if (d.name === 'no-trackers-found' || d.children) {
    return null;
  }
  return d.name + (d.count ? ' (' + d.count + ')' : '');
}

function hexToRgba(hex, alpha) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 'rgba(' + parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) + ',' + alpha + ')': hex; 
}

var attributes = function () {
  this
    .style('left', function (d) { return d.x + '%'; })
    .style('top', function (d) { return d.y + '%'; })
    .style('width', function (d) { return d.dx + '%'; })
    .style('height', function (d) { return d.dy + '%'; })
    .style('border-width', '1px')
    .style('border-color', 'white')
    .style('border-style', 'solid')
    .style('box-sizing', 'border-box')
    .style('font-size', function (d) {
      //console.log(d.dx + '%, d.dy=' + d.dy + ", d.depth=" + d.depth + ", d.area=" + d.area);

      if (d.dx < 10) {
        return '10px';
      } else if (d.dx < 20) {
        return '15px';
      }
      
      return '20px';
      })
    .style('text-anchor', 'middle')
    .style('text-align', 'center')
    .style('background', function (d) {
      if (d.name === 'no-trackers-found' || d.children) {
        return 'white';
      }
      return hexToRgba(color(getLabel(d)), 0.5);
    })
    .attr('title', getLabel);
    
    this.html('');
    this
    .append('div')
    .attr('class', 'node-child')
    //.style('display', 'inline-block')
    .style('margin', 'auto')
    .style('width', '50%')
    .style('height', '50%')
    .style('max-height', '100px')
    .style('max-width', '100px')
    .style('text-align', 'center')
    .style('background-image', function (d) {
      console.log('d.children=', d.children, d.name);
      
      if (d.name === 'no-trackers-found' || d.children) {
        return null;
      }
      
      if (d.id) {
        return 'url("' + 'https://logo.clearbit.com/' + d.id + '?&size=200' + '")';
      }
      
      return 'url("../frontend/assets/fa-eye.png")';
    })
    .style('background-position', 'center')
    .style('background-repeat', 'no-repeat')
    .style('background-size', function (d) {
      if (d.id) {
        return 'contain';
      }
      return 'initial';
    });
    //.text(getLabel);
};

function updateGraph(data) {
  var node =
    div.datum(data).selectAll('.node')
      .data(treemap.nodes);

  node.enter().append('div')
    .attr('class', 'node');

  node.call(attributes);
}
