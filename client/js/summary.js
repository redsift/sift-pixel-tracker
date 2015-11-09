'use strict';

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
    .sticky(true)
    .value(function (d) { return d.count; });

var div = d3.select('.treemap');

function position() {
  this
    .style('left', function (d) { return d.x + '%'; })
    .style('top', function (d) { return d.y + '%'; })
    .style('width', function (d) { return d.dx + '%'; })
    .style('height', function (d) { return d.dy + '%'; });
}

function getLabel(d) {
  return d.name + (d.count ? ' (' + d.count + ')' : '');
}

function updateGraph(data) {
  var node =
    div.datum(data).selectAll('.node')
      .data(treemap.nodes)
      .enter().append('div')
      .attr('class', 'node')
      .call(position)
      .style('background', function (d) {
        return color(getLabel(d));
      })
      .text(getLabel);
}
