


    let combine = function(features, csvResults) {
      // function that given a list of GeoJSON features, and csv, adds to all
      // feature object of features two new properties from the csv
      // file: Cruz, and Rourke

      // Precondition csv: csv where "ALL COUNTIES" contains
      // string values under the columns "Cruz", "Rourke" that can
      // be converted to a number
      // Parameter csv: data from Texas Senate race

      // Precondition features: array of geoJSON feature objects
      // Parameter: list of objects where each object represents a Texas county

      dict_csv = [];
      csvResults.forEach(function(d,i){
          dict_csv[d['County']] = [d['Cruz'], d['Rourke']]
      })

      features.forEach(function(d){
        let countyName = d.properties.NAME;
        countyName = countyName.toUpperCase();
        let infoFromCSV = dict_csv[countyName]
        d.properties.Cruz = infoFromCSV[0]
        d.properties.Rourke = infoFromCSV[1]
      })

      }
    // for color function

    // color function for maps
    // Two steps. First colors for each candidate, then function.
    // w3 schools is a great tool
    var BetoColors = ['#e6f2ff', '#b3d9ff', '#66b3ff', '#0066cc']
    const CruzColors = ['#ffe6e6', '#ffb3b3', '#ff6666', '#cc0000']
    
    // step two the function
    let color = function(d) {
    // this map takes a feature Geojson of a texas county, and
    // returns a color that should be filled in for that county
    //
    // Precondition d: GeoJSON containing properties Cruz, Rourke with
    // values that can be cast to numbers
    // Parameter d: A GeoJSON feature object representing a texas country
      let BetoScore = Number(d.properties.Rourke);
      let CruzScore = Number(d.properties.Cruz);
      // turn BetoScore and CruzScore to real numbers - casting
      BetoScore = Number(BetoScore);
      CruzScore = Number(CruzScore);
      if (BetoScore > CruzScore) {
        // if Beto won the county
        if (BetoScore < 50){
          return BetoColors[0]
        } else if (BetoScore < 60) {
          return BetoColors[1]
        } else if (BetoScore < 70) {
          return BetoColors[2]
        } else {
          return BetoColors[3]
        }
      } else {
        // if Cruz won the county
        if (CruzScore < 50){
          return CruzColors[0]
        } else if (CruzScore < 60) {
          return CruzColors[1]
        } else if (CruzScore < 70) {
          return CruzColors[2]
        } else {
          return CruzColors[3]
        }
      }

    }

//---------------------------------------
