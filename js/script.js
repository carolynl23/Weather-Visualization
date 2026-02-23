const margin = { top: 40, right: 40, bottom: 60, left: 60 };
const width = 1000 - margin.left - margin.right;
const height = 640 - margin.top - margin.bottom;

// Contiguous U.S. bounds (excluding AK/HI/territories)
const southBound = 24.52;
const northBound = 49.38;
const westBound = -124.78;
const eastBound = -66.95;

// Start date: Jan 1, 2017
const startDate = new Date(2017, 0, 1);

// Helpers functions
function parseDate(dateStr) {
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);
  return new Date(year, month, day);
}

function dateIndexToDate(idx) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + idx);
  return d;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(d) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// State
let weatherData = [];
let minTemp = Infinity;
let maxTemp = -Infinity;
let projection = null;
let geoPath = null;

// Build SVG
const svgRoot = d3
  .select("#vis")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const svg = svgRoot
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// All map + points go inside this so zoom works on everything
const mapLayer = svg.append("g").attr("class", "map-layer");
const statesLayer = mapLayer.append("g").attr("class", "states-layer");
const pointsLayer = mapLayer.append("g").attr("class", "points-layer");

// Scales
const xScale = d3.scaleLinear().domain([westBound, eastBound]).range([0, width]);
const yScale = d3.scaleLinear().domain([southBound, northBound]).range([height, 0]);

// Axes
svg.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(xScale));

svg.append("g")
  .call(d3.axisLeft(yScale));

// Axis labels
svg.append("text")
  .attr("class", "axis-label")
  .attr("x", width / 2)
  .attr("y", height + margin.bottom - 10)
  .style("text-anchor", "middle")
  .text("Longitude");

svg.append("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -margin.left + 15)
  .style("text-anchor", "middle")
  .text("Latitude");

// Tooltip style (basic details of station that is plotted)
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("padding", "8px 10px")
  .style("border-radius", "8px")
  .style("pointer-events", "none")
  .style("opacity", 0)
  .style("box-shadow", "0 8px 20px rgba(0,0,0,0.12)")
  .style("font-family", "Noto Sans, sans-serif")
  .style("font-size", "12px")
  .style("line-height", "1.3");

// Zoom in and out of the map
const zoom = d3.zoom()
  .scaleExtent([1, 10])
  .on("zoom", (event) => {
    mapLayer.attr("transform", event.transform);
  });

svgRoot.call(zoom);

// Slider wiring
const slider = d3.select("#dateSlider");
const dateLabel = d3.select("#dateLabel");

slider.on("input", function () {
  const idx = +this.value;
  updateVis(idx);
});

// Legend
function drawLegend(colorScale, domainMin, domainMax) {
  d3.select("#legend").selectAll("*").remove();

  const legendWidth = 280;
  const legendHeight = 10;

  const legendSvg = d3.select("#legend")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", 90);

  const legendG = legendSvg.append("g")
    .attr("transform", `translate(${(width - legendWidth) / 2 + margin.left}, 25)`);

  const defs = legendSvg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

  // Build gradient stops by sampling the color scale
  const stops = d3.range(0, 1.00001, 0.1);
  gradient.selectAll("stop")
    .data(stops)
    .join("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => colorScale(domainMin + d * (domainMax - domainMin)));

  legendG.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  const legendScale = d3.scaleLinear()
    .domain([domainMin, domainMax])
    .range([0, legendWidth]);

  legendG.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(d3.axisBottom(legendScale).ticks(6));

  legendG.append("text")
    .attr("x", 0)
    .attr("y", -8)
    .style("font-size", "12px")
    .style("font-weight", "600")
    .text("Average Temperature (°F)");
}

// Main update to graph function
function updateVis(currDateIdx) {
  const currDate = dateIndexToDate(currDateIdx);
  dateLabel.text(formatDate(currDate));

  // Filter to current date and points that project into mainland US
  const dayData = weatherData
    .filter((d) => sameDay(d.date, currDate))
    .filter((d) => projection([d.longitude, d.latitude]) !== null)
    .filter((d) => d.TAVG !== null); // first version uses TAVG

  // If no data, then should not see a point
  if (dayData.length === 0) {
    pointsLayer.selectAll(".point").remove();
    return;
  }

  // bolder colors via per-day percentile domain
  const values = dayData
    .map((d) => d.TAVG)
    .filter((v) => v != null)
    .sort(d3.ascending);

  const lo = d3.quantile(values, 0.05);
  const hi = d3.quantile(values, 0.95);

  const colorScale = d3
    .scaleSequential()
    .domain([hi, lo])
    .clamp(true)
    .interpolator(d3.interpolateRdYlBu);

  // Draw update points
  pointsLayer
    .selectAll(".point")
    .data(dayData, (d) => `${d.station}_${d.latitude}_${d.longitude}`)
    .join(
      (enter) =>
        enter
          .append("circle")
          .attr("class", "point")
          .attr("r", 3.2)
          .attr("opacity", 0.75)
          .attr("cx", (d) => projection([d.longitude, d.latitude])[0])
          .attr("cy", (d) => projection([d.longitude, d.latitude])[1])
          .style("fill", (d) => colorScale(d.TAVG))
          .on("mouseover", (event, d) => {
            tooltip
              .style("opacity", 1)
              .html(
                `
                <div><b>${d.station}</b> (${d.state})</div>
                <div>${formatDate(d.date)}</div>
                <div>Lat: ${d.latitude.toFixed(2)}, Lon: ${d.longitude.toFixed(2)}</div>
                <div><b>TAVG:</b> ${d.TAVG} °F</div>
              `
              );
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", event.pageX + 12 + "px")
              .style("top", event.pageY + 12 + "px");
          })
          .on("mouseout", () => tooltip.style("opacity", 0)),
      (update) =>
        update
          .transition()
          .duration(120)
          .attr("cx", (d) => projection([d.longitude, d.latitude])[0])
          .attr("cy", (d) => projection([d.longitude, d.latitude])[1])
          .style("fill", (d) => colorScale(d.TAVG)),
      (exit) => exit.remove()
    );

  // Legend (use percentile domain so it matches stronger contrast)
  drawLegend(colorScale, lo, hi, "Average Temperature (°F) — (5th–95th percentile)");
}

// Slider event
slider.on("input", function () {
  updateVis(+this.value);
});

// Load map and data
Promise.all([
  d3.json("data/gz_2010_us_040_00_500k.json"),
  d3.csv("data/weather.csv"),
]).then(([usGeo, data]) => {
  // --- projection + path ---
  projection = d3
    .geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(1350);

  geoPath = d3.geoPath().projection(projection);

  const props = usGeo.features?.[0]?.properties || {};
  const hasSTATE = Object.prototype.hasOwnProperty.call(props, "STATE");
  const hasSTATEFP = Object.prototype.hasOwnProperty.call(props, "STATEFP");
  const hasNAME = Object.prototype.hasOwnProperty.call(props, "NAME");

  const excludeByCode = new Set(["02", "15", "72"]); // AK, HI, PR
  const excludeByName = new Set(["Alaska", "Hawaii", "Puerto Rico"]);

  const contiguousFeatures = usGeo.features.filter((f) => {
    if (hasSTATE && excludeByCode.has(f.properties.STATE)) return false;
    if (hasSTATEFP && excludeByCode.has(f.properties.STATEFP)) return false;
    if (hasNAME && excludeByName.has(f.properties.NAME)) return false;
    return true;
  });

  // --- Draw states (background) ---
  statesLayer
    .selectAll("path")
    .data(contiguousFeatures)
    .join("path")
    .attr("d", geoPath)
    .attr("fill", "#f6f6f6")
    .attr("stroke", "#9a9a9a")
    .attr("stroke-width", 0.6);

  // --- Parse weather data ---
  weatherData = data
    .filter((d) => d.latitude !== "" && d.longitude !== "" && d.date !== "")
    .map((d) => ({
      station: d.station,
      state: d.state,
      latitude: +d.latitude,
      longitude: +d.longitude,
      date: parseDate(d.date),

      // parse for future use maybe?
      TMIN: d.TMIN === "" ? null : +d.TMIN,
      TMAX: d.TMAX === "" ? null : +d.TMAX,
      TAVG: d.TAVG === "" ? null : +d.TAVG,
      AWND: d.AWND === "" ? null : +d.AWND,
      WDF5: d.WDF5 === "" ? null : +d.WDF5,
      WSF5: d.WSF5 === "" ? null : +d.WSF5,
      SNOW: d.SNOW === "" ? null : +d.SNOW,
      SNWD: d.SNWD === "" ? null : +d.SNWD,
      PRCP: d.PRCP === "" ? null : +d.PRCP,
    }));

  // Determine slider range based on available dates in the data
  const minDate = d3.min(weatherData, (d) => d.date);
  const maxDate = d3.max(weatherData, (d) => d.date);

  const minIdx = Math.max(
    0,
    Math.round((minDate - startDate) / (1000 * 60 * 60 * 24))
  );
  const maxIdx = Math.max(
    0,
    Math.round((maxDate - startDate) / (1000 * 60 * 60 * 24))
  );

  slider.attr("min", minIdx).attr("max", maxIdx).attr("value", minIdx);

  // Initial render
  updateVis(minIdx);

  console.log("Loaded weather rows:", weatherData.length);
  console.log("Weather date range:", minDate, "to", maxDate);
  console.log("GeoJSON properties example:", props);
});