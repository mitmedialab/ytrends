
// namespaced wrapper around all our application's code
window.App = {

    globals: {
        lastAlertTimeout: null,
        normalizeToGlobal: true,
        writeLog: false
    },

    // wrapper so we can turn off logging in one place
    debug: function(str){
        if(App.globals.writeLog){
            console.log(str);
        }
    },

    // load the map and data, start the app
    initialize: function(){
        ISO3166.initialize();
        App.allCountries = new App.CountriesCollection();
        App.allCountries.fetch({

            //url: "data/weights-count.json",
            //url: "data/weights-jaccard.json",
            url: "data/weights-bhattacharyya.json",

            success: function (collection, response, options) {
                App.countryRouter = new App.CountryRouter();
                App.mapView = new App.MapView();
                App.countryRouter.listenTo(App.mapView,"render.done",function(){
                    Backbone.history.start();
                });
                $('#yt-progress-bar').hide();
            }

        });
    }

};
