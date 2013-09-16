var CountryRouter = Backbone.Router.extend({

  routes: {
    "":                    "home",
    ":country1":            "exploreCountry",
    ":country1/:country2":  "exploreRelated"
  },

  home: function(){
    console.log("Routed to root");
    window.mapView.handleMapBackgroundClick();
  },

  exploreCountry: function(country1Alpha3) {
    console.log("Routed to "+country1Alpha3);
    var country1 = window.allCountries.findByAlpha3(country1Alpha3);
    if(country1){
      window.mapView.handleValidCountryClick(country1);
    } else {
      //TODO
    }
  },

  exploreRelated: function(country1Alpha3, country2Alpha3) {
    console.log("Routed to "+country1Alpha3+"/"+country2Alpha3);
    var country1 = window.allCountries.findByAlpha3(country1Alpha3);
    var country2 = window.allCountries.findByAlpha3(country2Alpha3);
    if(country1 && country2){
      window.mapView.handleValidCountryClick(country1);
      window.mapView.handleValidCountryClick(country2);
    } else {
      //TODO
    }
  }

});