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

// legend set up
const legendGroup = svg
  .append('g')
  .attr('transform', `translate(${dimensions.width + 40}, 10)`);

const legend = d3
  .legendColor()
  .shape('circle')
  .shapePadding(10)
  .scale(generateColour);

// Tooltip in pie chart
const tip = d3
  .tip()
  .attr('class', 'tip card')
  .html((d) => {
    let content = `<div class="name">${d.data.name}</div>`;
    content += `<div class="cost">Php ${d.data.cost}</div>`;
    content += `<div class="delete">Click slice to delete</div>`;
    return content;
  });

graph.call(tip);
//real time update the data and create an arc shape
//depending on the data stored in database
const updateData = (data) => {
  // update colour scale domain
  generateColour.domain(data.map((d) => d.name));

  // update and call legend
  legendGroup.call(legend);
  legendGroup.selectAll('text').attr('fill', 'grey');

  // join enhanced (pie) data to path elements
  const paths = graph.selectAll('path').data(pie(data));

  // handle the exit selection
  paths.exit().transition().duration(900).attrTween('d', arcTweenExit).remove();

  // handle the current DOM path updates
  paths
    .attr('d', arcPath)
    .transition()
    .duration(900)
    .attrTween('d', arcTweenUpdate);
  // append of path containing the data
  paths
    .enter()
    .append('path')
    .attr('class', 'arc')
    .attr('stroke', '#f0f0f0')
    .attr('stroke-width', 3)
    .attr('fill', (d) => generateColour(d.data.name))
    .each(function (d) {
      this._current = d;
    })
    .transition()
    .duration(900)
    .attrTween('d', arcTweenEnter);

  // event for mouse hover
  graph
    .selectAll('path')
    .on('mouseover', (d, i, n) => {
      tip.show(d, n[i]);
      mouseOverHandler(d, i, n);
    })
    .on('mouseout', (d, i, n) => {
      tip.hide(d, n[i]);
      mouseOutHandler(d, i, n);
    })
    .on('click', deleteEventHandler);
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

const arcTweenEnter = (d) => {
  const getAngle = d3.interpolate(d.endAngle, d.startAngle);

  return function (tick) {
    d.startAngle = getAngle(tick);
    return arcPath(d);
  };
};

const arcTweenExit = (d) => {
  const i = d3.interpolate(d.startAngle, d.endAngle);

  return function (t) {
    d.startAngle = i(t);
    return arcPath(d);
  };
};

// use function keyword to allow use of 'this'
function arcTweenUpdate(d) {
  // interpolate between the two objects
  const i = d3.interpolate(this._current, d);
  // update the current prop with new update data
  this._current = d;

  return function (t) {
    return arcPath(i(t));
  };
}

const mouseOverHandler = (d, i, n) => {
  d3.select(n[i])
    .transition('changeSliceFill')
    .duration(300)
    .attr('fill', '#fff');
};
const mouseOutHandler = (d, i, n) => {
  d3.select(n[i])
    .transition('changeSliceFill')
    .duration(300)
    .attr('fill', generateColour(d.data.name));
};

const deleteEventHandler = (d) => {
  const id = d.data.id;
  db.collection('expenses').doc(id).delete();
};
