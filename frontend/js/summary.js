'use strict';
/* globals d3 */

/*var data = {
  "name": "cluster",
  "children": [
    { "name": "Yesware", "count": 5 },
    { "name": "Sidekick", "count": 3 },
    { "name": "Postmark", "count": 18 }
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
  return d.name + (d.count ? ' (' + d.count + ')' : '');
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
      return color(getLabel(d));
    })
    .attr('title', getLabel)
    .append('div')
    //.style('display', 'inline-block')
    .style('margin', 'auto')
    .style('width', '100%')
    .style('height', '100%')
    .style('text-align', 'center')
    /*.append('img')
    .style('width', 'auto')
    .style('height', 'auto')
    .style('margin', 'auto')
    .attr('href', 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg');*/
    .text(getLabel);
};

function updateGraph(data) {
  var node =
    div.datum(data).selectAll('.node')
      .data(treemap.nodes);

  node.enter().append('div')
    .attr('class', 'node');

  node.call(attributes);
}
