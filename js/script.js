// Specify margin.
const margin = {
    top: 40,
    right: 40,
    bottom: 100,
    left: 60
}

const width = 600 - margin.left - margin.right
const height = 400 - margin.top - margin.bottom

// Returns a Date object from a raw string in YYYMMDD format.
function parseDate(date) {
    const year = parseInt(date.substring(0, 4), 10);
    const month = parseInt(date.substring(4, 6), 10) - 1;
    const day = parseInt(date.substring(6, 8), 10);

    return new Date(year, month, day);
}

// Initialize the variable to store the data.
let weather_data = [];

// Bounding latitude and longitude points for contiguous U.S. (excluding Hawaii, Alaska, and territories).
const south_bound = 24.52;
const north_bound = 49.38;
const west_bound = -124.78;
const east_bound = -66.95;

// Min and max average temperatures.
const min_temp = -20.56;
const max_temp = 105.26;

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
    data = data.filter(d => (d.latitude >= south_bound) && (d.latitude <= north_bound));
    data = data.filter(d => (d.longitude >= west_bound) && (d.longitude <= east_bound));
    
    console.log("Filtered for contiguous U.S.");

    // Check the min and max average temperatures.
    // Min and max temps are -20.56 and 105.26.
    console.log("Min avg temp:", Math.min(...data.map(d => d.temp)));
    console.log("Max avg temp:", Math.max(...data.map(d => d.temp)));

    return data;
}).then(data => {
    // Store the data.
    weather_data = data;

    console.log("Loaded data:", weather_data);
    console.log(weather_data.length, "values loaded.")

    // Update the visualization.
    updateVis();
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
    .domain([west_bound, east_bound]) // predefined data range
    .range([0, width]);

const yScale = d3.scaleLinear()
    .domain([south_bound, north_bound]) // predefined data range
    .range([height, 0]);

const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
    .domain([100, -20]);

// Add axes.
const xAxis = d3.axisBottom(xScale)

svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)

const yAxis = d3.axisLeft(yScale)

svg.append('g')
    .attr('class', 'y-axis')
    .call(yAxis);

// Display the data.

function updateVis() {
    svg.selectAll('.point')
    .data(weather_data)
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

// Add labels
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

// Add a legend
const legendWidth = 200;
const legendHeight = 10;

const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(0, ${height + 50})`);

// Add a definition for the gradient
const defs = svg.append("defs");

const linearGradient = defs.append("linearGradient")
    .attr("id", "temperature-gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

// Define the colors 
linearGradient.selectAll("stop")
    .data([
        {offset: "0%", color: d3.interpolateRdYlBu(1)},     // blue
        {offset: "50%", color: d3.interpolateRdYlBu(0.5)},  // yellow
        {offset: "100%", color: d3.interpolateRdYlBu(0)}    //red
    ])
    .join("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

// Draw the bar
legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#temperature-gradient)");

// Create a scale for the legend axis
const legendScale = d3.scaleLinear()
    .domain([min_temp, max_temp])
    .range([0, legendWidth]);

// Add the axis
const legendAxis = d3.axisBottom(legendScale).ticks(5);

legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);

// Add a label for the legend
legend.append("text")
    .attr("x", 0)
    .attr("y", -5) // Position slightly above the bar
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Temperature (°F)");