// Specify margin
const margin = {
    top: 40,
    right: 40,
    bottom: 40,
    left: 60
}

const width = 600 - margin.left - margin.right
const height = 400 - margin.top - margin.bottom

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