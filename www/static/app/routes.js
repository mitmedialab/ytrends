App.CountryRouter = Backbone.Router.extend({

    routes: {
        "":                                  "home",
        ":country1":                         "exploreCountry",
        "v/:videoId":                        "video", 
        ":country1/v/:videoId":              "exploreCountryWithVideo",
        ":country1/:country2":               "exploreRelated",
        ":country1/:country2/v/:videoId":    "exploreRelatedWithVideo"
    },

    home: function(){
        App.debug("Routed to root");
        App.mapView.handleMapBackgroundClick();
    },

    video: function(videoId){
        new App.FullVideoView({ 
            'videoId': videoId
        });
    },

    exploreCountryWithVideo: function(country1Alpha3, videoId){
        this.exploreCountry(country1Alpha3);
        new App.FullVideoView({ 
            country1: App.allCountries.findByAlpha3(country1Alpha3),
            'videoId': videoId
        });
    },

    exploreRelatedWithVideo: function(country1Alpha3, country2Alpha3, videoId){
        this.exploreRelated(country1Alpha3,country2Alpha3);
        new App.FullVideoView({ 
            country1: App.allCountries.findByAlpha3(country1Alpha3),
            country2: App.allCountries.findByAlpha3(country2Alpha3),
            'videoId': videoId
        });
    },

    exploreCountry: function(country1Alpha3) {
        App.debug("Routed to "+country1Alpha3);
        var country1 = App.allCountries.findByAlpha3(country1Alpha3);
        if(country1){
            App.mapView.handleValidCountryClick(country1,true);
        } else {
            //TODO
        }
    },

    exploreRelated: function(country1Alpha3, country2Alpha3) {
        App.debug("Routed to "+country1Alpha3+"/"+country2Alpha3);
        var country1 = App.allCountries.findByAlpha3(country1Alpha3);
        var country2 = App.allCountries.findByAlpha3(country2Alpha3);
        if(country1 && country2){
            App.mapView.handleValidCountryClick(country1,true);
            _.delay(function(){App.mapView.handleValidCountryClick(country2,true);},
                500);            
        } else {
            //TODO
        }
    }

});