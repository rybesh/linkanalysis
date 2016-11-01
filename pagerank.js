
var width = 960,
    height = 500;

var color = d3.scale.category10();

var force = d3.layout.force()
            .charge(-500)
            .linkDistance(150)
            .size([width, height]);

var svg = d3.select('#graph').append('svg')
          .attr('width', width)
          .attr('height', height);

var nodesize = 10

function updateScoreLabels(nodes) {
  nodes.select('.score').remove()
  nodes.append('text')
  .text(function(d) {
    return d.score.toFixed(2)
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

d3.json('pagerank.json', function(error, graph) {
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

  nodes.data(
    nodes.data()
    .map(function (node) {
      node.outlinks = graph.links
                      .filter(function (link) {
                        return link.source.index == node.index;
                      }).length
      return node
    }))

  nodes.append('circle')
  .attr('r', nodesize)
  .style('fill', function(d) { return color(d.group); });

  nodes.append('text')
  .attr('dx', 12)
  .attr('dy', '.35em')
  .attr('class', 'label')
  .text(function(d) { return d.name; });

  force.on('tick', function() {
    links
    .attr('x1', function(d) { return d.source.x; })
    .attr('y1', function(d) { return d.source.y; })
    .attr('x2', function(d) { return d.target.x; })
    .attr('y2', function(d) { return d.target.y; });

    nodes.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });
  });

  function iterate() {
    // calculate new scores
    nodes.data(
      nodes.data()
      .map(function (node) {
        if (node.score === undefined) {
          node.newscore = 1.0 / nodes[0].length
        } else {
          node.newscore = d3.sum(graph.links
                                 .filter(function (link) { return link.target.index == node.index; })
                                 .map(function(link) {
                                   return link.source.score / link.source.outlinks
                                 }))
          if (node.outlinks === 0) {
            // nodes with no outlinks pass all pagerank to themselves
            node.newscore += node.score
          }
        }
        return node;
      }))

    nodes.data(
      nodes.data()
      .map(function (node) {
        node.score = node.newscore
        return node
      }))


    updateScoreLabels(nodes)

    // resize nodes
    nodes
    .select('circle')
    .attr('r', function(d) {
      return d.score * nodes[0].length * nodesize
    })
  }

  iterate()

  $('#next').click(function() {
    iterate()
    $('#k').text(parseInt($('#k').text(), 10) + 1)
  });
});
