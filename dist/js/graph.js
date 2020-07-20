const dimensions = { height: 300, width: 300, radius: 150 };
const center = {
  xCoordinate: dimensions.width / 2 + 5,
  yCoordinate: dimensions.height / 2 + 5,
};

const svg = d3
  .select('.canvas')
  .append('svg')
  .attr('width', dimensions.width + 150)
  .attr('height', dimensions.height + 150);

const graph = svg
  .append('g')
  .attr('transform', `translate(${center.xCoordinate}, ${center.yCoordinate})`);

const pie = d3
  .pie()
  .sort(null)
  .value((d) => d.cost);

const arcPath = d3
  .arc()
  .outerRadius(dimensions.radius)
  .innerRadius(dimensions.radius / 2);
const generateColour = d3.scaleOrdinal(d3['schemeSet3']);

const arcTweenEnter = (d) => {
  const getAngle = d3.interpolate(d.endAngle, d.startAngle);

  return function (tick) {
    d.startAngle = getAngle(tick);
    return arcPath(d);
  };
};

//real time update the data and create an arc shape
//depending on the data stored in database
const updateData = (data) => {
  // update colour scale domain
  generateColour.domain(data.map((d) => d.name));

  // join enhanced (pie) data to path elements
  const paths = graph.selectAll('path').data(pie(data));

  // handle the exit selection
  paths.exit().remove();

  // handle the current DOM path updates using merge()
  // append of path containing the data
  paths
    .enter()
    .append('path')
    .merge(paths)
    .attr('class', 'arc')
    .attr('stroke', '#f0f0f0')
    .attr('stroke-width', 3)
    .attr('fill', (d) => generateColour(d.data.name))
    .transition()
    .duration(900)
    .attrTween('d', arcTweenEnter);
};

let data = [];

// get data from firestore
db.collection('expenses').onSnapshot((res) => {
  // database will listen for any changes that was made
  try {
    res.docChanges().forEach((change) => {
      let dataChange = change.type;
      const doc = { ...change.doc.data(), id: change.doc.id };

      if (dataChange === 'added') {
        data.push(doc);
      }
      if (dataChange === 'modified') {
        const index = data.findIndex((item) => item.id === doc.id);
        data[index] = doc;
      }
      if (dataChange === 'removed') {
        data = data.filter((item) => item.id !== doc.id);
      }
    });
    // pass the data tha was added, modified or removed
    updateData(data);
  } catch (error) {
    throw new Error(error);
  }
});
