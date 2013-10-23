
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
        App.allCountries0 = new App.CountriesCollection();
        App.allCountries7 = new App.CountriesCollection();
        App.allCountries30 = new App.CountriesCollection();
        App.allCountries = App.allCountries0;
        // kick off all async loading
        var runApp = _.after(4,App.run);
        App.allCountries0.fetch({
            url: "static/data/weights-bhattacharyya.json",
            success: runApp
        });
        App.allCountries7.fetch({
            url: "static/data/weights-bhattacharyya-7.json",
            success: runApp
        });
        App.allCountries30.fetch({
            url: "static/data/weights-bhattacharyya-30.json",
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
        App.controlView = new App.ControlView();
        Backbone.history.start();
    },
    
    // Return the state of the app by parsing the url
    getState: function () {
        var route = Backbone.history.fragment;
        var next;
        var state = {countries:[]};
        parts = route.split('/').reverse();
        while (parts.length > 0) {
            next = parts.pop();
            if (next.length === 0) {
                continue;
            }
            if (next === 'all') {
                // Do nothing if we're on the homepage
            } else if (next === 'v') {
                // Check for video
                if (parts.length > 0) {
                    state['videoId'] = parts.pop();
                }
            } else if (next === 'r') {
                // Check for timespan
                if (parts.length > 0) {
                    state['recentDays'] = parts.pop();
                }
            } else {
                // Otherwise add countries
                state.countries.push(next);
            }
        }
        return state;
    },
    
    // Get route fragment from state object
    getRoute: function (state) {
        var parts = [];
        if (state.countries.length == 0) {
            parts.push('all');
        } else {
            $.each(state.countries, function (i, d) {
                parts.push(d);
            });
        }
        if (state.videoId) {
            parts.push('v/' + state.videoId);
        }
        if (state.recentDays) {
            parts.push('r/' + state.recentDays);
        }
        return parts.join('/');
    },
    
    // Select the appropriate data source
    selectData: function () {
        var recentDays = 0;
        var state = App.getState();
        if (state.recentDays) {
            recentDays = state.recentDays;
        }
        if (recentDays == 7) {
            App.allCountries = App.allCountries7;
        } else if (recentDays == 30) {
            App.allCountries = App.allCountries30;
        } else {
            App.allCountries = App.allCountries0;
        }
        App.controlView.update();
    }

};
