
var width = 960,
    height = 500;

var color = d3.scale.category10();

var force = d3.layout.force()
            .charge(-200)
            .linkDistance(100)
            .size([width, height]);

var svg = d3.select('body').append('svg')
          .attr('width', width)
          .attr('height', height);

var norm = false
var nodesize = 10

function normalize(nodes) {
  var sum = d3.sum(nodes.data().map(function(d) { return d.score }))
  nodes.data(
    nodes.data()
    .map(function (node) {
      node.score = node.score / sum
      return node
    }))
}

function updateScoreLabels(nodes) {
  nodes.select('.score').remove()
  nodes.append('text')
  .text(function(d) {
    if (norm) { return d.score.toFixed(2) }
    else { return d.score }
  })
  .attr('dx', function() { return 0 - (this.getBBox().width / 2) })
  .attr('dy', 3)
  .attr('class', 'score')
}

// build the arrow
svg.append('svg:defs').selectAll('marker')
    .data(['end'])
  .enter().append('svg:marker')
    .attr('id', String)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 26)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5');

d3.json('hubauth.json', function(error, graph) {
  force
  .nodes(graph.nodes)
  .links(graph.links)
  .start();

  var links = svg.selectAll('.link')
             .data(graph.links)
             .enter().append('line')
             .attr('class', 'link')
             .attr('marker-end', 'url(#end)');

  var nodes = svg.selectAll('.node')
             .data(graph.nodes)
             .enter().append('g')
             .attr('class', 'node')
             .call(force.drag);

  nodes.append('circle')
  .attr('r', nodesize)
  .style('fill', function(d) { return color(d.group); });

  nodes.append('text')
  .attr('dx', 12)
  .attr('dy', '.35em')
  .attr('class', 'label')
  .text(function(d) { return d.name; });

  updateScoreLabels(nodes)

  force.on('tick', function() {
    links
    .attr('x1', function(d) { return d.source.x; })
    .attr('y1', function(d) { return d.source.y; })
    .attr('x2', function(d) { return d.target.x; })
    .attr('y2', function(d) { return d.target.y; });

    nodes.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });
  });

  var hubs = nodes.filter(function(d) { return d.group == 1; });
  var auths = nodes.filter(function(d) { return d.group == 2; });
  var state = 'auths';

  $('#normalize').change(function() {
    norm = $(this).prop('checked')
    if (norm) {
      normalize(nodes)
      updateScoreLabels(nodes)
    }
    $(this).prop('disabled', true)
  })

  $('#next').click(function() {

    $('#normalize').prop('disabled', true)

    if (state == 'auths') {

      // calculate new auth scores
      auths.data(
        auths.data()
        .map(function (node) {
          node.score = d3.sum(graph.links
                              .filter(function (link) { return link.target.index == node.index; })
                              .map(function(link) { return link.source.score }))
          return node;
        }))

      if (norm) { normalize(auths) }

      state = 'hubs';

    } else { // state == 'hubs'

      // calculate new hub scores
      hubs.data(
        hubs.data()
        .map(function (node) {
          node.score = d3.sum(graph.links
                              .filter(function (link) { return link.source.index == node.index; })
                              .map(function(link) { return link.target.score }))
          return node;
        }))

      if (norm) { normalize(hubs) }

      state = 'auths';
    }

    updateScoreLabels(nodes)

    // resize nodes
    nodes
    .select('circle')
    .attr('r', function(d) {
      if (norm) {
        return d.score * nodes[0].length * nodesize
      } else {
        return nodesize + Math.log(d.score)
      }
    })

  });
});
