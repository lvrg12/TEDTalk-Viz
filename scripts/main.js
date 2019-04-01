const winw = window.innerWidth/1.25;
const winh = window.innerHeight/1.1;
var margin = {top: 20, right: 40, bottom: 40, left: 40};
var width = winw - margin.left - margin.right;
var height = winh - margin.top - margin.bottom;

var formatPercent = d3.format(".0%");
var formatYear = d3.format("d");
var c10 = d3.scaleOrdinal(d3.schemeCategory10);
var zoomable = true;
var svg, gx, gy;

// creating scale axis
var x = d3
	.scaleTime()
	.range([0,width])

var y = d3
	.scaleLinear()
	.range([height, 0]);

var xAxis = d3
	.axisBottom(x)
	.tickSize(-height)
	.tickFormat(formatYear)
	// .ticks(20);

var yAxis = d3
	.axisRight(y)
	.tickFormat(formatPercent);
	
var zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on("zoom", zoomed);
	
// create tip
var tip = d3.tip()
  .attr('class', 'tooltip')
  .offset([-10, 0])
  .html( (d,i) => "<strong>Debt:</strong> <span style='color:red'>" + Math.round(d[i+1800]*100) + "%</span>" );

// create menu
var menu = document.createElement('div');
menu.className = "menu";
document.getElementById("container").append(menu);

// load data
d3.csv("data/data2.csv", data => initJSON(data) );

// init json
var json = {};
function initJSON( data )
{
	for( country in data )
	{
		if( !data.hasOwnProperty(country) ) continue;
		if( !data[country]["Country Name"] ) continue;

		var tmp = [];
		for( var y=1800; y<2016; y++ )
		{
			var obj = {}
			obj[y] = data[country][y] == "" ? undefined : +data[country][y] / 100;
			tmp.push( obj );
		}

		var c_name = data[country]["Country Name"].replace(" ","-");
		json[c_name] = { debt : tmp };
	}

	initSVG( json );
}

// init svg
function initSVG( data )
{
	// create svg
	svg = d3.select("#container").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.call(zoom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.call(tip);

	x.domain( [1800,2015] );
	y.domain( [0,3.0] );

  	gx = svg.append("g")
    	.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.style("fill", "white")
		.call(xAxis)

	gy = svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(" + width + ",0)")
		.style("fill", "white")
		.call(yAxis)
	
	svg.append("text")
		.attr("y", -12)
		.attr("x", width - 30)
		.style("text-anchor", "start")
		.style("fill", "white")
		.text("Debt to GDP Ratio");
	
	addMenu( data );
    
}

function addMenu( data )
{
	var space = document.createElement("div");
	space.className = "space-menu";
	menu.append(space);

	var space = document.createElement("div");
	space.className = "space-menu";

	var vertical = document.createElement("div");
	vertical.className = "vertical-menu";

	var country = Object.keys(data).sort();
	var button;

	for( var c=0; c<country.length; c++ )
	{
		button = document.createElement("a");
		button.id = country[c];
		button.innerHTML = country[c].replace("-"," ");
		button.onclick = e => toggleCountry(data,e.srcElement.id);
		vertical.append(button);
	}

	var reset = document.createElement("a");
	reset.className = "reset";
	reset.innerHTML = "RESET"
	reset.onclick = e => resetZoom();

	var toggles = document.createElement("div");
	toggles.className = "toggles";
	toggles.append(reset);

	menu.append(vertical);
	menu.append(space);
	menu.append(toggles);
}

function toggleCountry( data, country )
{
	var button = document.getElementById(country);
	var color = c10(country);

	if( button.className == "" )
	{
		button.className = "active";
		button.style.backgroundColor = color;
		addCountry( data, country, color );
	}
	else
	{
		button.className = "";
		button.style.backgroundColor = "";
		remCountry( data, country );
	}

	console.log(country);
}

function addCountry( data, country, color )
{
	drawing = true;
	// resetZoom();

	var line = d3.line()
    	.x( (d,i) => x(i+1800) )
    	.y( (d,i) => y(d[i+1800]) ? y(d[i+1800]) : y(0) )
		.curve(d3.curveMonotoneX);
		
  	// svg.selectAll(".bar")
	// 	.data(data[country].debt)
	// 	.enter().append("rect")
	// 	.attr("class", "bar")
	// 	.attr("x", (d,i) => x(i+1800) + leftOffset - winh/200 )
	// 	.attr("width", winh/100 )
	// 	.attr("y", (d,i) => y(d[i+1800]) ? y(d[i+1800]) : y(0) )
	// 	.attr("height", (d,i) => y(d[i+1800]) ? height - y(d[i+1800]) : height - y(0) )
	// 	.on('mouseover', tip.show)
	// 	.on('mouseout', tip.hide)

	var path = svg.append("path")
			.attr("class", "path")
			.attr("id", country+"-path")
			.attr("d", line(data[country].debt))
			.attr("stroke",color);

	var totalLength = path.node().getTotalLength();
	path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
		.duration(5000)
		.ease(d3.easePolyInOut)
		.attr("stroke-dashoffset", 0)
		.on( "end", (d,i) => addPoints( data, country, color ) )

}

function addPoints( data, country, color )
{
	svg.selectAll("#"+country+"-dot")
		.data(data[country].debt)
		.enter()
		.append("circle")
		.on('mouseover', tip.show)
      	.on('mouseout', tip.hide)
		.attr("class", (d,i) => y(d[i+1800]) ? "dot" : "delete" )
		.attr("id",country+"-dot")
		.attr("cx", (d,i) => x(i+1800) )
		.attr("cy", (d,i) => y(d[i+1800]) ? y(d[i+1800]) : y(0) )
		.attr("fill",color)
		.transition()
		.attr("r", (d,i) => y(d[i+1800]) ? 1.5 : 0 )
		.duration(1000)

	svg.selectAll(".delete")
		.remove();
	
}

function remCountry( data, country )
{
	svg.selectAll("#"+country+"-path")
		.remove();

	svg.selectAll("#"+country+"-dot")
		.remove();
}

function resetZoom()
{
	d3.selectAll(".path")
		.call(zoom.transform, d3.zoomIdentity)
		.transition()
		.duration(2000);
	
	d3.selectAll(".dot")
		.attr("r",1.5);
}

function zoomed()
{
	d3.selectAll(".dot")
		.attr("transform", d3.event.transform)
		.attr("r",4/d3.event.transform.k)

    d3.selectAll(".path")
        .attr("transform", d3.event.transform);
	d3.selectAll('.path')
		.style("stroke-width", 2/d3.event.transform.k);

    gx.call(xAxis.scale(d3.event.transform.rescaleX(x)));
    gy.call(yAxis.scale(d3.event.transform.rescaleY(y)));
}