// Specify the margin, width, and ehight of the temperature plot.
const margin = {top: 40, right: 40, bottom: 60, left: 60}
const width = 600 - margin.left - margin.right
const height = 400 - margin.top - margin.bottom

// Returns a Date object from a raw string in YYYMMDD format.
function parseDate(date) {
    const year = parseInt(date.substring(0, 4), 10);
    const month = parseInt(date.substring(4, 6), 10) - 1;
    const day = parseInt(date.substring(6, 8), 10);

    return new Date(year, month, day);
}

// Returns a Date object that is dateIdx days away from Jaunary 1st, 2017.
function dateIndexToDate(dateIdx) {
    // Get the start date.
    const targetDate = new Date(startDate);

    // Add the number of days in the index.
    targetDate.setDate(targetDate.getDate() + dateIdx);

    // Return the target date.
    return targetDate;
}

// Filters the weather data to only get values from a specific date.
function filterByDate(weatherData, date) {
    return weatherData.filter(d =>
        d.date.getFullYear() === date.getFullYear() &&
        d.date.getMonth() === date.getMonth() &&
        d.date.getDate() === date.getDate()
    );
}

// Initialize the variable to store the data.
let weatherData = [];
// Start date is January 1st, 2017 (months are zero-indexed).
const startDate = new Date(2017, 0, 1, 0, 0, 0, 0);
// Number of days past the start date to show data from.
let currDateIdx = 0;

// Bounding latitude and longitude points for contiguous U.S. (excluding Hawaii, Alaska, and territories).
const southBound = 24.52;
const northBound = 49.38;
const westBound = -124.78;
const eastBound = -66.95;

// Min and max average temperatures.
const minTemp = -20.56;
const maxTemp = 105.26;

// Load the data.
d3.csv('data/weather.csv').then(data => {
    // Remove unnecessary columns.
    data.forEach(d => {
        delete d.elevation;
        delete d.TMIN;
        delete d.TMAX;
        delete d.AWND;
        delete d.WDF5;
        delete d.WSF5;
        delete d.SNOW;
        delete d.SNWD;
        delete d.PRCP;
    });

    // Remove data points with missing values.
    data = data.filter(d => d.latitude !== "");
    data = data.filter(d => d.longitude !== "");
    data = data.filter(d => d.date !== "");
    data = data.filter(d => d.TAVG !== "");

    console.log("Removed unncessary columns and missing values.");

    return data;
}).then(data => {
    // Convert to the proper types.
    data.forEach(d => {
        d.latitude = parseFloat(d.latitude);
        d.longitude = parseFloat(d.longitude);
        d.date = parseDate(d.date);
        d.temp = parseFloat(d.TAVG);
    });

    console.log("Converted to proper types.");
    
    return data;
}).then(data => {
    // Filter for values in contiguous U.S. (excluding Hawaii, Alaska, and territories),
    data = data.filter(d => (d.latitude >= southBound) && (d.latitude <= northBound));
    data = data.filter(d => (d.longitude >= westBound) && (d.longitude <= eastBound));
    
    console.log("Filtered for contiguous U.S.");

    // Check the min and max average temperatures.
    // Min and max temps are -20.56 and 105.26.
    console.log("Min avg temp:", Math.min(...data.map(d => d.temp)));
    console.log("Max avg temp:", Math.max(...data.map(d => d.temp)));

    // Check the min and max dates.
    // Min and max dates are January 1st, 2017 and September 17th, 2017.
    console.log("Min date:", new Date(Math.min(...data.map(d => d.date))));
    console.log("Max date:", new Date(Math.max(...data.map(d => d.date))));

    return data;
}).then(data => {
    // Store the data.
    weatherData = data;

    console.log("Loaded data:", weatherData);
    console.log("Number of values loaded:", weatherData.length);

    // Update the visualization.
    updateVis(currDateIdx);
});

// Create svg and g
const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Create scales.
const xScale = d3.scaleLinear()
    .domain([westBound, eastBound]) // predefined data range
    .range([0, width]);

const yScale = d3.scaleLinear()
    .domain([southBound, northBound]) // predefined data range
    .range([height, 0]);

const colorScale = d3.scaleDiverging()
  .domain([maxTemp, 50, minTemp]) // [minimum, center/zero, maximum]
  .interpolator(d3.interpolateRdYlBu);

// Add axes.
const xAxis = d3.axisBottom(xScale)

svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)

const yAxis = d3.axisLeft(yScale)

svg.append('g')
    .attr('class', 'y-axis')
    .call(yAxis);

// Updates the visualization to show temperature data from a specific data.
function updateVis(currDateIdx) {
    // Filter weatherData to get data from the specified date.
    let currDate = dateIndexToDate(currDateIdx);
    const filteredData = filterByDate(weatherData, currDate);

    console.log("Filtered for values from date:", currDate);

    // Update the visualization.
    svg.selectAll('.point')
    .data(filteredData)
    .join(
        enter => {
            return enter
            .append('circle')
            .attr('cx', d => xScale(d.longitude))
            .attr('cy', d => yScale(d.latitude))
            .attr('r', 3)
            .style('fill', d => colorScale(d.temp))
            .attr('opacity', 0.6)
            .attr('class', 'point')
        },
        update => {
            return update
            .transition()
            .attr('cx', d => xScale(d.longitude))
            .attr('cy', d => yScale(d.latitude))
            .style('fill', d => colorScale(d.temp))
        }
    )
}

// Create functions to update data (from lab 3)
function addRandomPoint() {
    // for debugging
    console.log('add point')
    const newPoint = {
        x: Math.floor(Math.random() * (101)),
        y: Math.floor(Math.random() * (101)),
        color: 'red'
    };
    currentData.push(newPoint);
    // call to update visualization
    updateVis();
}

function removeRandomPoint() {
    // for debugging
    console.log('remove point')
    currentData.pop();
    // call to update visualization
    updateVis();
}

function updateRandomPoints() {
    // for debugging
    console.log('update points')
    currentData = currentData.map(d => ({
        id: currentData.length + 1,
        x: d.x + Math.floor(Math.random() * (11)) - 5,
        y: d.y + Math.floor(Math.random() * (11)) - 5
    }));
    // call to update visualization
    updateVis();
}

// Add event listeners
d3.select('#addPoint')
    .on('click', addRandomPoint);

d3.select('#removePoint')
    .on('click', removeRandomPoint);

d3.select('#updatePoints')
    .on('click', updateRandomPoints);

// Add labels for the axes.
svg.append('text')
.attr('class', 'axis-label')
.attr('x', width / 2)
.attr('y', height + margin.bottom - 10)
.style('text-anchor', 'middle')
.text('Longitude');

svg.append('text')
.attr('class', 'axis-label')
.attr('transform', 'rotate(-90)')
.attr('x', -height / 2)
.attr('y', -margin.left + 15)
.style('text-anchor', 'middle')
.text('Latitude');

// Add a legend.
const legendWidth = 200;
const legendHeight = 10;

// Create a SVG for the legend below the plot.
const legendSvg = d3.select('#legend')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', 80);   // controls spacing below the axis label

const legend = legendSvg.append('g')
    .attr('transform', `translate(${(width - legendWidth)/2 + margin.left}, 25)`);

// Add a definition for the gradient.
const defs = legendSvg.append("defs");

const linearGradient = defs.append("linearGradient")
    .attr("id", "temperature-gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

// Define the colors .
linearGradient.selectAll("stop")
    .data([
        {offset: "0%", color: d3.interpolateRdYlBu(1)},     // blue
        {offset: "50%", color: d3.interpolateRdYlBu(0.5)},  // yellow
        {offset: "100%", color: d3.interpolateRdYlBu(0)}    //red
    ])
    .join("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

// Draw the bar.
legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#temperature-gradient)");

// Create a scale for the legend axis
const legendScale = d3.scaleLinear()
    .domain([minTemp, maxTemp])
    .range([0, legendWidth]);

// Add the axis.
const legendAxis = d3.axisBottom(legendScale).ticks(5);

legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);

// Add a label for the legend.
legend.append("text")
    .attr("x", 0)
    .attr("y", -5)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Temperature (°F)");