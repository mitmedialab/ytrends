
// namespaced wrapper around all our application's code
window.App = {

    globals: {
        lastAlertTimeout: null,
        normalizeToGlobal: true,
        writeLog: false,
        worldMap: null,
        countryIdToPath: {},
        colors: {
            minColor: 'rgb(241,233,187)',
            maxColor: 'rgb(207,97,35)',
            disabledColor: 'rgb(240, 240, 240)',
            enabledColor: 'rgb(243,195,99)'
        }
    },

    // wrapper so we can turn off logging in one place
    debug: function(str){
        if(App.globals.writeLog){
            console.log(str);
        }
    },

    // load the map and data, start the app
    initialize: function(){
        App.debug("Initializing App")
        ISO3166.initialize();
        App.allCountries = new App.CountriesCollection();
        // kick off all async loading
        var runApp = _.after(2,App.run);
        App.allCountries.fetch({
            //url: "data/weights-count.json",
            //url: "data/weights-jaccard.json",
            url: "static/data/weights-bhattacharyya.json",
            success: runApp
        });
        d3.json('static/data/world-110m.json', function(data){
            App.debug("  got map data")
            App.globals.worldMap = data;
            App.globals.countryIdToPath = {};
            var countries = topojson.feature(App.globals.worldMap, App.globals.worldMap.objects.countries).features;
            $.each(countries, function (i, d) {
                App.globals.countryIdToPath[d.id] = d;
            });
            runApp();
        });
    },

    // actually start the app (once async loading is done)
    run:function(){
        App.debug("  actually starting app!")
        $('#yt-progress-bar').hide();
        App.countryRouter = new App.CountryRouter();
        App.mapView = new App.MapView();
        App.InfoBoxView.Welcome();
        Backbone.history.start();
    }

};
