//
// The central code used in deriving the NYTimes interactive map
// for the 2018 Senate election for Texas.
//
//
//

// svg for map
let frame = d3.select('#screen')
// attributes svg, margins, mapframe for the map
// make margin have room for legend, zoom buttons
let svg = {width: 400, height: 350}
let margin = {top:5,bottom:25,left:50,right:50}
let mapframe = {width: (svg.width -margin.left-margin.right),
                height: (svg.height -margin.top -margin.bottom) }

frame.attr("width", svg.width)
     .attr("height", svg.height)
     .append("g")
     .attr("transform", "translate("+margin.left+", "+margin.top+")")
     .attr("id", "map")

frame.append("g")
     .attr('id', 'background')

// there are two g windows just defined.
// map window for the map
// background window for the buttons and legend
//---------------------------------------


//// intro
/// part 1
/// part 2
/// part 3


/// intro


// use promise statement so can work with data outside this file
// but inside the directory

// map of all us counties geojson


let test =[];

const whenDataUploadsRunThisFunction = async() => {
  // featurecollection of all us counties
  const mapUSJSON = await d3.json('../Data/USMap_counties.json')
  const countyData = await d3.csv('../Data/TexasSenateRace_ByCounty.csv')
  let topoUS = await d3.json('../Data/USMap_CountiesTopo.json')

  //console.log(topoUS)
  let testUS = topojson.feature(topoUS, topoUS.objects.USMap_Counties)
  console.log("etst",testUS)



  // create array of all feature objects
  const mapUS = testUS.features//mapUSJSON.features; console.log(mapUSJSON)
  // change map_json so ONLY texas counties part of map
  // Texas's STATEFP = 48
  mapUSJSON.features = mapUS.filter(d => d.properties.STATEFP == '48')
  let mapTX = mapUSJSON;

  // define projection, and path
  let projectionTX = d3.geoAlbers()
                       .rotate([100.1,0])
                       .fitExtent([[0,0],[mapframe.width, mapframe.height]], mapTX)

  let pathTX = d3.geoPath().projection(projectionTX)

// ----------------------------------------------
  combine(mapTX.features, countyData)
// ----------------------------------------------



  //------------------------

  // part 1) create Texas map

  // first part is so we can fill in different colors for step 2
  // second part is so we can create good borders


   var txCountyBorders = topojson.mesh(topoUS, topoUS.objects.USMap_Counties, function(county1, county2){

     var checkCountyInTexas =  county1.properties.STATEFP == 48 || county2.properties.STATEFP == 48;
     return checkCountyInTexas;

   })
   let map = d3.select("#map")


  // --------------------

  // mesh needed to be after building the lines for the state

  // part 2) add color for each state

  // first part - fill with different colors
  map.selectAll('path')
      .data(mapTX.features) // mapTX.features is an array of GeoJSON objects
      .enter()
      .append('path')
      .attr('class', 'countylines')
      .attr('id', d => d.properties.NAME.replace(/[ ]/g,"&"))
              // give unique id to each county
      .attr('d', d => pathTX(d))
    //  .attr('class', 'zoom')

  map.append('path')
     .attr('id', 'outline')
     .datum(txCountyBorders)
     .attr('d', d => pathTX(d))
  //   .attr('class', 'zoom')

   d3.selectAll(".countylines")
     .attr('fill', function(d){ // creating the color for the county
         return color(d)
       })
     .attr('opacity', .9)
  //   .attr('class', 'zoom')



  // --------------------

  // part 3) has two steps:
  //    step 1: highlight borders when scroll
  //    step 2: table when mouse is scrolling over (tooltip)


  // create the borders that will appear when the mouse is scrolling over (helper for step 1)

  // let topoUS = await d3.json('../Data/USMap_CountiesTopo.json')
  // var topoTX = topoUS.objects.USMap_Counties.geometries.filter(d => d.properties.STATEFP == '48')

  // moved this code up to the top to redraw the borders
  let county_border = map.append("path")

  // create dict with keys as the county name, values as data for the county (helper for step 2)
  let dataDict = {};
  countyData.forEach(function(d) {
    countyName = d.County.replace(/[ ]/g,"&")
    var cruzData = {"votes": Number(d.REP.replace(/[,]/g,"")),"pct": Number(d.Cruz)};
    var rourkeData = {"votes": Number(d.DEM.replace(/[,]/g,"")),"pct": Number(d.Rourke)};

    dataDict[countyName] = {"cruzData": cruzData, "rourkeData": rourkeData}

  })


  // enable counties to change when mouse is over it
  d3.selectAll(".countylines").on("mousemove", mouseOnPlot);
  d3.selectAll(".countylines").on("mouseout", mouseLeavesPlot);
  function mouseOnPlot(){

    // step 1: make bold the county line
    // NEED & between for id because id does not take spaces
    var county_name = this.id;
    var interiors = topojson.mesh(topoUS, topoUS.objects.USMap_Counties, function(county1, county2){

      var checkCountyInTexas =  county1.properties.STATEFP == 48 || county2.properties.STATEFP == 48;
      var county1_name = county1.properties.NAME.replace(/[ ]/g,"&")
      var county2_name = county2.properties.NAME.replace(/[ ]/g,"&")
      var checkCountyName = (county1_name == county_name || county2_name == county_name);
      return checkCountyInTexas && checkCountyName;

    })


    county_border.datum(interiors)
                 .attr("class", "topoCountyLine")
                 .attr("stroke-width", 1.4)
                 .attr("d", pathTX) // same as d => pathTX(d)


    // step 2: create the tooltip
    // table appears near the browser's mouse


    var xPosition = event.pageX;
    var yPosition = event.pageY;
    var tooltip = d3.select('#tooltip')
    tooltip_Width = parseFloat(tooltip.style("width"));
    tooltip_Height = parseFloat(tooltip.style("height"));

    tooltip.style("left", Number(xPosition) - tooltip_Width/2)
           .style("top", Number(yPosition) + 25)
           .style("width", 2*mapframe.width/3 - 20)
           .style("height", mapframe.height/3 - 20)
           .style("visibility", "visible")


    // fill in elements based off values for county name
    // eight terms: wColor, lColor, wName, lName, wVote, lVote, wPer, lPer
    // src='../Data/CruzColor.png'

    countyName = this.id.toUpperCase();

    let dataForCounty = dataDict[countyName];
    let cruzData = dataForCounty['cruzData']; let rourkeData = dataForCounty['rourkeData'];

    // k is true if Cruz won county,
    //   is false otherwise
    let k = (cruzData['votes'] > rourkeData['votes']);

    // create formatting you want
    // GREAT GUIDE https://www.displayr.com/how-to-format-numbers-dates-and-time-using-in-d3-htmlwidgets-in-r/
    var numVotesForCruz = d3.format(',~r')(cruzData['votes']);
    var numVotesForRourke = d3.format(',~r')(rourkeData['votes']);
    var cruzPer = d3.format('.1f')(cruzData.pct) + '%'
    var rourkePer = d3.format('.1f')(rourkeData.pct) + '%'

    d3.select('#title')
      .text(this.id.replace(/[&]/g," ") + " County")

    d3.select('#wColor')
      .attr('src',  k?('../Data/CruzColor.png'):('../Data/BetoColor.png'))

    d3.select('#lColor')
      .attr('src',  k?('../Data/BetoColor.png'):('../Data/CruzColor.png'))

    d3.select('#wName')
      .text(k?('Ted Cruz'):("Beto O'Rourke"))

    d3.select('#lName')
      .text(k?("Beto O'Rourke"):("Ted Cruz"))

    d3.select('#wParty')
      .text(k?('Rep.'):("Dem."))

    d3.select('#lParty')
      .text(k?("Dem."):("Rep."))

    d3.select('#wVotes')
      .text(k?numVotesForCruz:numVotesForRourke)

    d3.select('#lVotes')
      .text(k?numVotesForRourke:numVotesForCruz)

    d3.select('#wPer')
      .text(k?cruzPer:rourkePer)

    d3.select('#lPer')
      .text(k?rourkePer:cruzPer)


  }
  // end mouseOnPlot function


  function mouseLeavesPlot(){

    d3.select(".topoCountyLine")
      .attr("stroke-width", 0)

     d3.select("#tooltip")
       .style("visibility", "hidden")

  }

  // Part Four: Add three circles: zoom in, zoom out, and complete zoom out

  // For these buttons and legend, will use the following
  let background  =  d3.select('#background')

  // let 'zoom in' be c1, 'zoom out' be c2, 'complete zoom out' be c3
  // create radius, center for the zoom in circle
  // Calculations required to get everything in proportion

  // for big circle
  let radiusZoom = (margin.right - 10)/3
  let cxZoom = mapframe.width + margin.right/2 + margin.left
  let cyZoom = margin.top + radiusZoom + 4

  // for small circle
  var radiusInnerCircle = 2.5*radiusZoom/6 // for magnifying glass
  var lineLength = Number(d3.format('.1f')(radiusInnerCircle)) - 3

  // colors
  var lightColor = '#DCDCDC';
  var darkColor =  '#B0B0B0';

  // zoom in circle - construction


   // make zoom in circle
   background.append('circle')
             .attr('r', radiusZoom) // 20 radius dope size visually
             .attr('cx', cxZoom)
             .attr('cy', cyZoom)
             .attr('fill', darkColor)//'#F0F0F0') lighter grey
             .attr('id', 'c1') // call c1 circle

   // magnifying glass circle, c1 circle
   background.append('circle')
             .attr('r', radiusInnerCircle) // 20 radius dope size visually
             .attr('cx', cxZoom - radiusZoom/12)
             .attr('cy',cyZoom - radiusZoom/12)
             .attr('fill', 'none')
             .attr('stroke', 'white')
             .attr('id', 'c1InnerCircle')
             .attr('pointer-events', 'none')

    var cxInnerC1 = Number(d3.select('#c1InnerCircle').attr('cx'))
    var cyInnerC1 = Number(d3.select('#c1InnerCircle').attr('cy'))

    // first horizontal line
    background.append('line')
              .attr('x1', cxInnerC1 - lineLength)
              .attr('x2', cxInnerC1 + lineLength)
              .attr('y1', cyInnerC1)
              .attr('y2', cyInnerC1)
              .attr('stroke', 'white')

    // first vertical line
    background.append('line')
              .attr('x1', cxInnerC1)
              .attr('x2', cxInnerC1)
              .attr('y1', cyInnerC1 - lineLength)
              .attr('y2', cyInnerC1 + lineLength)
              .attr('stroke', 'white')

    // first handle, line by -45˚ from center
    var xHandle = cxInnerC1 + Math.cos(-45*Math.PI / 180)*radiusInnerCircle
    var yHandle = cyInnerC1 + Math.sin(45*Math.PI / 180)*radiusInnerCircle

    background.append('line')
              .attr('x1', xHandle)
              .attr('x2', xHandle + 1.7*lineLength)
              .attr('y1', yHandle)
              .attr('y2', yHandle + 1.7*lineLength)
              .attr('stroke', 'white')



    // zoom out circle - construction




    cyZoom = cyZoom + 2*radiusZoom + 4

    // make zoom in circle
    background.append('circle')
              .attr('r', radiusZoom) // 20 radius dope size visually
              .attr('cx', cxZoom)
              .attr('cy',cyZoom)
              .attr('fill', lightColor)//'#F0F0F0') lighter grey
              .attr('id', 'c2') // call c2 circle


    // magnifying glass circle, c2 circle
    background.append('circle')
              .attr('r', radiusInnerCircle) // 20 radius dope size visually
              .attr('cx', cxZoom - radiusZoom/12)
              .attr('cy',cyZoom - radiusZoom/12)
              .attr('fill', 'none')
              .attr('stroke', 'white')
              .attr('id', 'c2InnerCircle')
              .attr('pointer-events', 'none')

     var cxInnerC2 = Number(d3.select('#c2InnerCircle').attr('cx'))
     var cyInnerC2 = Number(d3.select('#c2InnerCircle').attr('cy'))

     // second horizontal line
     background.append('line')
               .attr('x1', cxInnerC2 - lineLength)
               .attr('x2', cxInnerC2 + lineLength)
               .attr('y1', cyInnerC2)
               .attr('y2', cyInnerC2)
               .attr('stroke', 'white')

     // first handle, line by -45˚ from center
     xHandle = cxInnerC2 + Math.cos(-45*Math.PI / 180)*radiusInnerCircle
     yHandle = cyInnerC2 + Math.sin(45*Math.PI / 180)*radiusInnerCircle

     background.append('line')
               .attr('x1', xHandle)
               .attr('x2', xHandle + 1.7*lineLength)
               .attr('y1', yHandle)
               .attr('y2', yHandle + 1.7*lineLength)
                .attr('stroke', 'white')




      // zoom out completely circle - construction




      cyZoom = cyZoom + 2*radiusZoom + 4

      // make completely zoom out circle
      background.append('circle')
                .attr('r', radiusZoom) // 20 radius dope size visually
                .attr('cx', cxZoom)
                .attr('cy', cyZoom)
                .attr('fill', lightColor)//'#F0F0F0') lighter grey
                .attr('id', 'c3') // call c3 circle

       // creating the X

       background.append('line')
                 .attr('x1', cxZoom - 2*lineLength)
                 .attr('x2', cxZoom + 2*lineLength)
                 .attr('y1', cyZoom - 2*lineLength)
                 .attr('y2', cyZoom + 2*lineLength)
                 .attr('stroke', 'white')

      background.append('line')
                .attr('x1', cxZoom + 2*lineLength)
                .attr('x2', cxZoom - 2*lineLength)
                .attr('y1', cyZoom - 2*lineLength)
                .attr('y2', cyZoom + 2*lineLength)
                .attr('stroke', 'white')

   // end of constructing the three circles
   // --------------------



    // part 5: add interactivity to the circle, zooming and drag



    // create names for buttons
    // create names for buttons
    let zoomIn = d3.select('#c1')
    let zoomOut = d3.select('#c2')
    let zoomComOut = d3.select('#c3')

    // defining the zoom
    var zoom = d3.zoom().on("zoom", zoomed)

    function zoomed(){
      map.attr('transform', d3.event.transform)
      console.log(d3.event.transform)
    }

    // set initial transform
    //var t = d3.zoomIdentity.translate(50,5).scale(1)
    map.call(zoom)

    // so can't zoom without clicking the buttons
    // map.on(".zoom", null);

    // // when click active ifCondition function
    // zoomIn.on('click', ifCondition)
    // map.on('click', display)
    // function display() {
    //   console.log(d3.mouse(this)[0], d3.mouse(this)[1])
    // }
    // let i = 1;
    // function ifCondition() {
    //   i += 1
    //   t = d3.zoomIdentity.translate(50 - i*100,5 - i*100).scale(i*1);
    //   map.transition()
    //      .duration(600)
    //      .call(zoom.transform, t)
    //   console.log('attr', map.attr("transform"))
    //   console.log('t', t)
    // }




    // let drag = d3.drag().on('start', started);
    // function started() {
    //     map.attr('transform', d3.event.transform)
    //     console.log(d3.mouse(this[0]), d3.mouse(this[1]))
    // }
    // map.call(drag)


    // end of creating interactivty for circles
    // --------------------

    // Part 7) add city labels and include a dot for its location

    // list of Texas cities. Keys are the name of TX cities.
    // Values are the lon and lat coordinates of that city.
    let TX_cities = [
      ["Houston",[-95.358421, 29.749907]], ["Austin", [-97.750519, 30.266926]] ,
      ["Dallas", [-96.851349, 32.848152]], ["Fort Worth", [-97.309341, 32.768799]],
      ["El Paso", [-106.460953, 31.772543]], ["Corpus Christi", [-97.396378, 27.800583]],
      ["San Antonio", [-98.491142, 29.424349]]
    ];

    TX_cities.forEach(function(d,i){
      let city_name = d[0];
      let city_location = projectionTX(d[1]);

      // create circle
      map.append('circle')
          .attr('cx', city_location[0])
          .attr('cy', city_location[1])
          .attr("r", 1.5)
          .attr("fill", "black")

      // create text label
      map.append('text')
           .attr('x', city_location[0])
           .attr('y', city_location[1] - 9)
           .attr('text-anchor', 'middle')
           .attr('alignment-baseline', 'baseline')
           .attr('font-weight','bold')
           .attr('font-size', 8*mapframe.width/290 )
           .attr('id', city_name.replace(/[ ]/g,"") + "Text")
           .attr("pointer-events","none")
           .text(city_name)

      if (city_name == "Dallas") {
        d3.select('#DallasText')
          .attr('x', city_location[0] + 18)
          .attr('y', city_location[1] + 3)
      }

      if (city_name == "Fort Worth") {
        d3.select('#FortWorthText')
          .attr('x', city_location[0] - 25)
          .attr('y', city_location[1] + 2)
      }
    })
    // end of forEach loop

    // --------------------------------------------

  }
  // end of async function
  whenDataUploadsRunThisFunction()
