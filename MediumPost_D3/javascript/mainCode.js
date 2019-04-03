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
let svg = {width: 450, height: 450}
let margin = {top:25,bottom:25,left:25,right:25}
let mapframe = {width: (svg.width -margin.left-margin.right),
                height: (svg.height -margin.top -margin.bottom) }

frame.attr("width", svg.width)
     .attr("height", svg.height)
     .append("g")
     .attr("transform", "translate("+margin.left+", "+margin.top+")")
     .attr("id", "map")
  //   .attr("class", "screen")

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

  // create array of all feature objects
  const mapUS = mapUSJSON.features;
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

  map.append('path')
     .attr('id', 'outline')
     .datum(txCountyBorders)
     .attr('d', d => pathTX(d))

   d3.selectAll(".countylines")
     .attr('fill', function(d){ // creating the color for the county
         return color(d)
       })
     .attr('opacity', .9)



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
           .style("width", 2*mapframe.width/3)
           .style("height", 2*mapframe.height/5)
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

  // Step two: make path bold





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
