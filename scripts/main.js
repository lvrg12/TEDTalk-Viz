"use strict";

let width = window.innerWidth * 0.5,
    height = window.innerHeight,
    prefix = prefixMatch(["webkit", "ms", "Moz", "O"]);

// Map scale bounds
const mapScale = {
    min: 9,
    max: 25
}

// Initial map position
const mapPosition = {
    lat: 0,
    long: 0
}

const maxIDs = 10;

let mapData;

/**
 * Return projection of latitude and logitude
 * @param {number} latitude 
 * @param {number} longitude 
 */
function latLong(latitude, longitude) {
    return projection([longitude, latitude]).map(function (x) { return -x; })
}

function generateOccupations(dataset) {
    let occupations = [];
    for (let i = 0; i < dataset.length; i++) {
        let d = dataset[i];

        if (d.occupation.trim() !== "" && occupations.indexOf(d.occupation) < 0)
            occupations.push(d.occupation);
    }

    occupations.sort();

    for (let i = 0; i < occupations.length; i++) {
        let occupation = occupations[i];
        let option = document.createElement("option");
        option.innerHTML = occupation;

        document.forms.filter.occupation.appendChild(option);
    }
}

function generateEvents(dataset) {
    let locations = [];
    for (let i = 0; i < dataset.length; i++) {
        let d = dataset[i];

        if (d.location.trim() !== "" && locations.indexOf(d.location) < 0)
            locations.push(d.location)
    }

    locations.sort();

    for (let i = 0; i < locations.length; i++) {
        let location = locations[i];
        let option = document.createElement("option");
        option.innerHTML = location;

        document.forms.filter.location.appendChild(option);
    }
}

d3.csv("data/ted_main.csv", function (error, dataset) {
    mapData = dataset;
    generateOccupations(dataset);
    generateEvents(dataset);
    createMap(dataset)
});

let tile = d3.geo.tile()
    .size([width, height]);

let projection = d3.geo.mercator()
    .scale((1 << mapScale.max) / 300000)
    .translate([-width / 2, -height / 2]); // just temporary

let zoom = d3.behavior.zoom()
    .scale(projection.scale() * 2 * Math.PI)
    .scaleExtent([1 << mapScale.min, 1 << mapScale.max])
    .translate(latLong(mapPosition.lat, mapPosition.long))
    .on("zoom", zoomed);

let container = d3.select("div#map").call(zoom).on("mousemove", mousemoved);
let map = container.append("g")
    .attr("id", "map");

let points = container.append("svg")
    .attr("id", "points");

let layer = map.append("div")
    .attr("class", "layer");

zoomed();

function createMap(dataset) {
    let colorScale = d3.scaleLinear()
        .domain([150000, 1000000])
        .range(["red", "green"])
        .clamp(true);

    let radiusScale = d3.scaleLinear()
        .domain([100, 500])
        .range([5, 12])
        .clamp(true);

    let formatComma = d3.format(",");
    //let opacityValue = 0.9;

    d3.select("#points").selectAll("circle").data(dataset).exit().remove();

    d3.select("#points").selectAll("circle").data(dataset) //plotted 	locations on map
        .enter().append("circle")
        .style("opacity", .5)
        // .style("opacity", function (d) { return opacityValue(d.year, d.occupation)})
        .attr("r", function (d) { return radiusScale(d.comments) })
        .attr("cx", function (d) { return projection([d.lon, d.lat])[0] })
        .attr("cy", function (d) { return projection([d.lon, d.lat])[1] })
        .attr('fill', function (d) { return colorScale(d.views) })
        .append("title")
        .text(function (d) {
            return "Title: " + d.title + "\n"
                + "Speaker Name: " + d.main_speaker + "\n"
                + "Speaker Occupation: " + d.speaker_occupation + "\n"
                + "Comments: " + formatComma(d.comments) + "\n"
                + "Views: " + formatComma(d.views);
        });

    zoomed();
}

function zoomed() {
    let tiles = tile
        .scale(zoom.scale())
        .translate(zoom.translate())
        ();

    projection
        .scale(zoom.scale() / 2 / Math.PI)
        .translate(zoom.translate());

    d3.selectAll("circle")
        .attr("cx", function (d) { return projection([d.lon, d.lat])[0] })
        .attr("cy", function (d) { return projection([d.lon, d.lat])[1] });

    let image = layer
        .style(prefix + "transform", matrix3d(tiles.scale, tiles.translate))
        .selectAll(".tile")
        .data(tiles, function (d) { return d; });

    image.exit()
        .remove();

    image.enter().append("img")
        .attr("class", "tile")
        .attr("src", function (d) { return "https://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".basemaps.cartocdn.com/light_all/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
        .style("left", function (d) { return (d[0] << 8) + "px"; })
        .style("top", function (d) { return (d[1] << 8) + "px"; });
}

function mousemoved() {
    // info.text(formatLocation(projection.invert(d3.mouse(this)), zoom.scale()));
}

function matrix3d(scale, translate) {
    let k = scale / 256, r = scale % 1 ? Number : Math.round;
    return "matrix3d(" + [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, r(translate[0] * scale), r(translate[1] * scale), 0, 1] + ")";
}

function prefixMatch(p) {
    let i = -1, n = p.length, s = document.body.style;
    while (++i < n) if (p[i] + "Transform" in s) return "-" + p[i].toLowerCase() + "-";
    return "";
}

function formatLocation(p, k) {
    let format = d3.format("." + Math.floor(Math.log(k) / 2 - 2) + "f");
    return (p[1] < 0 ? format(-p[1]) + "°S" : format(p[1]) + "°N") + " "
        + (p[0] < 0 ? format(-p[0]) + "°W" : format(p[0]) + "°E");
}

// let terms = topicise();
// getWordCloud( terms );

(function () {
    let ids = [];

    for (let i = 0; i < maxIDs; i++)
        ids.push(i);

    updateWordCloud(ids);
})();

function updateWordCloud(talk_ids) {
    let svg_location = "#wordCloud";
    d3.select(svg_location).select("svg").remove();

    let worker_lda = new Worker("scripts/worker/lda_worker.js");

    $.ajax({
        type: "GET",
        url: "data/transcripts.csv",
        dataType: "text",
        success: function (response) {
            let transcripts = [];
            let data = $.csv.toArrays(response);
            for (let i = 0; i < talk_ids.length; i++) {
                transcripts.push(data[talk_ids[i]][1]);
            }
            worker_lda.postMessage(transcripts);
            worker_lda.onmessage = function (event) {
                getWordCloud(event.data);
            };

        }
    });

    function getWordCloud(terms) {
        let term_count = {};
        let term_topic = {};

        for (let i = 0; i < terms.length; i++) {
            term_count[terms[i][1]] = terms[i][2];
            term_topic[terms[i][1]] = terms[i][0];
        }

        let width = $(wordCloud).width();
        let height = $(wordCloud).height();

        let fill = d3.scale.category10();

        let word_entries = d3.entries(term_count);

        let xScale = d3.scale.linear()
            .domain([0, d3.max(word_entries, function (d) {
                return d.value;
            })
            ])
            .range([10, 100]);

        d3.layout.cloud().size([width, height])
            .timeInterval(20)
            .words(word_entries)
            .fontSize(function (d) { return xScale(+d.value); })
            .text(function (d) { return d.key; })
            .rotate(function () { return ~~(Math.random() * 2) * 90; })
            .font("Impact")
            .on("end", draw)
            .start();

        function draw(words) {
            d3.select(svg_location).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + [width >> 1, height >> 1] + ")")
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", function (d) { return xScale(d.value) + "px"; })
                .style("font-family", "Impact")
                .style("fill", function (d, i) { console.log(d.text); return fill(term_topic[d.text]); })
                .attr("text-anchor", "middle")
                .attr("transform", function (d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function (d) { return d.key; });
        }

        d3.layout.cloud().stop();
    }
}

function applyFilter(updateCloud) {
    let year = document.forms.filter.year.value;
    let loc = document.forms.filter.location.value;
    let occ = document.forms.filter.occupation.value;

    if (year === "All" && loc === "All" && occ === "All") {
        createMap(mapData);

        let ids = [];

        for (let i = 0; i < maxIDs; i++)
            ids.push(i);

        updateWordCloud(ids);
    } else {
        let dataset = [];
        let ids = [];

        for (let i = 0; i < mapData.length; i++) {
            let d = mapData[i];
            if ((d.year == year || year === "All") && (d.location == loc || loc === "All") && (d.occupation == occ || occ === "All")) {
                dataset.push(d);
                if (ids.length < maxIDs)
                    ids.push(i)
            }
        }

        createMap(dataset);
        updateWordCloud(ids);
    }
}

document.forms.filter.addEventListener("submit", function (e) {
    // Do not actually submit the form
    e.preventDefault();
    applyFilter(true);
}, true);

document.forms.filter.addEventListener("change", function (e) {
    applyFilter(false);
}, true);
