// Specify margin.
const margin = {
    top: 40,
    right: 40,
    bottom: 40,
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
let weather_data;

// Bounding latitude and longitude points for contiguous U.S. (excluding Hawaii, Alaska, and territories).
let south_bound = 24.52;
let north_bound = 49.38;
let west_bound = -124.78;
let east_bound = -66.95;

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
    data = data.filter(d => d.longtitude !== "");
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
        d.TAVG = parseFloat(d.TAVG);
    });

    console.log("Converted to proper types.");
    
    return data;
}).then(data => {
    // Filter for values in contiguous U.S. (excluding Hawaii, Alaska, and territories),
    data = data.filter(d => (d.latitude >= south_bound) && (d.latitude <= north_bound));
    data = data.filter(d => (d.longitude >= west_bound) && (d.longitude <= east_bound));
    
    console.log("Filtered for contiguous U.S.");

    return data;
}).then(data => {
    // Store the data.
    weather_data = data;
    console.log("Loaded data:", weather_data);
    console.log(weather_data.length, "values loaded.")
});

// Create svg and g
const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Create scales
const xScale = d3.scaleLinear()
    .domain([0, 100]) // predefined data range
    .range([0, width]);

const yScale = d3.scaleLinear()
    .domain([0, 100]) // predefined data range
    .range([height, 0]);


// Add axes
const xAxis = d3.axisBottom(xScale)

svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)

const yAxis = d3.axisLeft(yScale)

svg.append('g')
    .attr('class', 'y-axis')
    .call(yAxis);

// Load and display the data
let currentData = [];

d3.json('data/data.json')
    .then(data => {
        console.log(data)
        currentData = data.points
        updateVis()
    })
    .catch(error => console.error('Error loading data:', error))

d3.select('.point')
    .data(data, d => d.id)
    .join(

    )

function updateVis() {
    svg.selectAll('.point')
    .data(currentData)
    .join(
        enter => {
            return enter
            .append('circle')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 5)
            .style('fill', d => d.color)
            .attr('class', 'point')
        },
        update => {
            return update
            .transition()
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
        },
        exit => {
            return exit.remove()
        }
    )
    
}

// Create functions to update data

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
.text('Number of Students');

svg.append('text')
.attr('class', 'axis-label')
.attr('transform', 'rotate(-90)')
.attr('x', -height / 2)
.attr('y', -margin.left + 15)
.style('text-anchor', 'middle')
.text('Hours of Homework');