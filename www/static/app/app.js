
// namespaced wrapper around all our application's code
window.App = {

    globals: {
        lastAlertTimeout: null,
        normalizeToGlobal: true,
        writeLog: true,
        worldMap: null
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
        d3.json('static/data/world-50m.json', function(data){
            App.debug("  got map data")
            App.globals.worldMap = data;
            runApp();
        });
    },

    // actually start the app (once async loading is done)
    run:function(){
        App.debug("  actually starting app!")
        $('#yt-progress-bar').hide();
        App.countryRouter = new App.CountryRouter();
        App.mapView = new App.MapView();
        App.countryRouter.listenTo(App.mapView,"render.done",function(){
            Backbone.history.start();
        });
        App.InfoBoxView.Welcome();
    }

};
