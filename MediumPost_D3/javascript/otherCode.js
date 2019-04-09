// create names for buttons
let zoomIn = d3.select('#c1')
let zoomOut = d3.select('#c2')
let zoomComOut = d3.select('#c3')

// defining the zoom
var zoom = d3.zoom().on("zoom", zoomed)

function zoomed(){
  map.attr('transform', d3.event.transform)
}

// set initial transform
var t = d3.zoomIdentity.translate(50,5).scale(1)
map.call(zoom.transform, t)

// so can't zoom without clicking the buttons
map.on(".zoom", null);

// when click active ifCondition function
zoomIn.on('click', ifCondition)
map.on('click', display)
function display() {
  console.log(d3.mouse(this)[0], d3.mouse(this)[1])
}
let i = 1;
function ifCondition() {
  i += 1
  t = d3.zoomIdentity.translate(50 - i*100,5 - i*100).scale(i*1);
  map.transition()
     .duration(600)
     .call(zoom.transform, t)
  console.log('attr', map.attr("transform"))
  console.log('t', t)
}
