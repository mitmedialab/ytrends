App.CountryRouter = Backbone.Router.extend({

    routes: {
        "":                                              "home",
        "all":                                           "home",
        ":country1":                                     "exploreCountry",
        "v/:videoId":                                    "video", 
        ":country1/v/:videoId":                          "exploreCountryWithVideo",
        ":country1/:country2":                           "exploreRelated",
        ":country1/:country2/v/:videoId":                "exploreRelatedWithVideo",
        "r/:days":                                  "home",
        "all/r/:days":                              "home",
        ":country1/r/:days":                        "exploreCountry",
        "v/:videoId/r/:days":                       "video", 
        ":country1/v/:videoId/r/:days":             "exploreCountryWithVideo",
        ":country1/:country2/r/:days":              "exploreRelated",
        ":country1/:country2/v/:videoId/r/:days":    "exploreRelatedWithVideo"
    },

    home: function(){
        App.debug("Routed to root");
        App.mapView.renderAll();
        App.selectData();
    },

    video: function(videoId){
        new App.FullVideoView({ 
            'videoId': videoId
        });
    },

    exploreCountryWithVideo: function(country1Alpha3, videoId, recentDays){
        this.exploreCountry(country1Alpha3, recentDays);
        new App.FullVideoView({ 
            country1: App.allCountries.findByAlpha3(country1Alpha3),
            'videoId': videoId
        });
    },

    exploreRelatedWithVideo: function(country1Alpha3, country2Alpha3, videoId, recentDays){
        this.exploreRelated(country1Alpha3,country2Alpha3,recentDays);
        new App.FullVideoView({ 
            country1: App.allCountries.findByAlpha3(country1Alpha3),
            country2: App.allCountries.findByAlpha3(country2Alpha3),
            'videoId': videoId
        });
    },

    exploreCountry: function(country1Alpha3, recentDays) {
        App.debug("Routed to "+country1Alpha3);
        var country1 = App.allCountries.findByAlpha3(country1Alpha3);
        if(country1){
            App.mapView.renderSelected(country1, null, recentDays);
        } else {
            //TODO
        }
        App.controlView.update();
    },

    exploreRelated: function(country1Alpha3, country2Alpha3, recentDays) {
        App.debug("Routed to "+country1Alpha3+"/"+country2Alpha3);
        var country1 = App.allCountries.findByAlpha3(country1Alpha3);
        var country2 = App.allCountries.findByAlpha3(country2Alpha3);
        if(country1 && country2){
            App.mapView.renderSelected(country1, country2, recentDays);
        } else {
            //TODO
        }
        App.controlView.update();
    }

});