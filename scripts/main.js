var width = Math.max(960, window.innerWidth),
    height = Math.max(500, window.innerHeight),
    prefix = prefixMatch(["webkit", "ms", "Moz", "O"]);

	  d3.csv("data/ted_main.csv", function(error, dataset) { createMap(dataset) });

var tile = d3.geo.tile()
    .size([width, height]);

var projection = d3.geo.mercator()
.scale((1 << 25) / 2 / Math.PI)
.translate([-width / 2, -height / 2]); // just temporary

var zoom = d3.behavior.zoom()
    .scale(projection.scale() * 2 * Math.PI)
    .scaleExtent([1 << 9, 1 << 25])
    .translate(projection([-73.975536, 40.691674]).map(function(x) { return -x; }))
    .on("zoom", zoomed);

var container = d3.select("body").append("div")
    .attr("id", "container")
    .style("width", width + "px")
    .style("height", height + "px")
    .call(zoom)
    .on("mousemove", mousemoved);

var map = container.append("g")
		.attr("id", "map")

var points = container.append("svg")
		.attr("id", "points")
				
var layer = map.append("div")
    .attr("class", "layer");

var info = map.append("div")
    .attr("class", "info");


zoomed();

function createMap(dataset) {
	d3.select("#points").selectAll("circle").data(dataset) //plotted 	locations on map
	.enter()
	.append("circle")
	.style("fill", "#14e6b7")
	.style("opacity", 0.7)
	.attr("r", 8 )
	.attr("cx", function(d) {return projection([d.lon,d.lat])[0]})
	.attr("cy", function(d) {return projection([d.lon,d.lat])[1]})
	zoomed();
}



function zoomed() {
  var tiles = tile
      .scale(zoom.scale())
      .translate(zoom.translate())
      ();

  projection
      .scale(zoom.scale() / 2 / Math.PI)
      .translate(zoom.translate());

			d3.selectAll("circle")
			.attr("cx", function(d) {return projection([d.lon,d.lat])[0]})
			.attr("cy", function(d) {return projection([d.lon,d.lat])[1]})

  var image = layer
      .style(prefix + "transform", matrix3d(tiles.scale, tiles.translate))
    .selectAll(".tile")
      .data(tiles, function(d) { return d; });

  image.exit()
      .remove();

  image.enter().append("img")
      .attr("class", "tile")
      .attr("src", function(d) { return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".basemaps.cartocdn.com/light_all/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
      .style("left", function(d) { return (d[0] << 8) + "px"; })
      .style("top", function(d) { return (d[1] << 8) + "px"; });
}

function mousemoved() {
  info.text(formatLocation(projection.invert(d3.mouse(this)), zoom.scale()));
}

function matrix3d(scale, translate) {
  var k = scale / 256, r = scale % 1 ? Number : Math.round;
  return "matrix3d(" + [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, r(translate[0] * scale), r(translate[1] * scale), 0, 1 ] + ")";
}

function prefixMatch(p) {
  var i = -1, n = p.length, s = document.body.style;
  while (++i < n) if (p[i] + "Transform" in s) return "-" + p[i].toLowerCase() + "-";
  return "";
}

function formatLocation(p, k) {
  var format = d3.format("." + Math.floor(Math.log(k) / 2 - 2) + "f");
  return (p[1] < 0 ? format(-p[1]) + "°S" : format(p[1]) + "°N") + " "
       + (p[0] < 0 ? format(-p[0]) + "°W" : format(p[0]) + "°E");
}

// topicise();