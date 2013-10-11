App.MapView = Backbone.View.extend({

    // see http://www.colourlovers.com/palette/125988/Artificial_Growth
    selectedColor: 'rgb(170,217,241)',
    connectionColor: 'rgb(170,217,241)',

    el: $("#yt-map-container"),
    template: _.template($('#yt-map-template').html()),

    events: {
        "click    svg": 'handleMapBackgroundClick'
    },
    
    initialize: function(){
        App.debug("Initialized MapView");
        _.bindAll(this, 
            'handleMapBackgroundClick',
            'handleInvalidCountryClick',
            'handleValidCountryClick'
        );
        this.render();
    },

    render: function(){
        App.debug("Rendering MapView:started");
        this.$el.html( this.template );
        this.initMap();
        this.renderBackground(App.globals.worldMap);
        this.renderAll();
        App.debug("  Rendering MapView:done")
    },
    
    initMap: function () {
        App.debug("  init map")
        var mapWidth = parseInt(d3.select(this.el).style('width'));
        var mapHeight = mapWidth / 2.19; // 520 @ 1140
        var mapScale = mapWidth / 5.18; // 220 @ 1140
        var mapOffset = [mapWidth/1.96, mapHeight / 1.73]; // 580, 300 @ 1140
        this.projection = d3.geo.kavrayskiy7()
            .scale(mapScale)
            .translate([mapOffset[0], mapOffset[1]])
            .precision(.1);
        this.path = d3.geo.path()
            .projection(this.projection);
        this.svg = d3.select(this.el).append("svg")
            .attr("width", mapWidth)
            .attr("height", mapHeight);
        this.svg.append('g').attr('id', 'yt-background');
        this.svg.append('g').attr('id', 'yt-data');
        this.svg.append('g').attr('id', 'yt-connections');
        /*var that = this;
        this.svg.append('rect')
            .attr('x', 0).attr('y', this.height-50).attr('width', '50').attr('height', '50')
            .attr('fill', App.glocal.colors.enabledColor)
            .on('click', function () {
                that.showConnections = !that.showConnections;
                if (that.showConnections) {
                    that.renderConnections();
                } else {
                    d3.selectAll('.connection').transition()
                        .attr('stroke-opacity', '0')
                        .each('end', function () { this.remove(); })
                }
            });*/
        
        this.maxWeight = d3.max(App.allCountries.models, function (d) { return d3.max(d.attributes.friends, function (d) { return d.weight; }); });
        App.debug('  init: global max weight: ' + this.maxWeight);
        this.color = d3.scale.linear()
            .range([App.globals.colors.minColor, App.globals.colors.maxColor])
            .domain([0, this.maxWeight]);
        this.opacity = d3.scale.pow().exponent(2)
            .range([0, 1])
            .domain([0, this.maxWeight]);
        //this.renderConnections();
    },
    
    handleMapBackgroundClick: function(evt){
        App.debug("Clicked background")
        state = App.getState();
        state.countries = [];
        App.countryRouter.navigate(App.getRoute(state));
        this.renderAll();
    },

    handleInvalidCountryClick: function(country){
        App.debug('Clicked ' + country.id + ' (no data)');
        var countryName = ISO3166.getNameFromId(country.id);
        // support for firefox
        var x = d3.event.offsetX;
        if (x == undefined) {
            x = d3.event.clientX - $('#yt-map-container').offset().left;
        }
        var y = d3.event.offsetY;
        if (y == undefined) {
            y = d3.event.clientY - $('#yt-map-container').offset().top;
        }
        // show an alert 
        new App.AlertView({ 
            msg: "Sorry, we don't know what people in "+countryName+" watched",
            position: [x, y]
        });
        d3.event.stopPropagation();
    },
    
    handleValidCountryClick: function(country) {
        App.debug('Clicked ' + country.id);
        country = App.allCountries.get(country.id);
        if (d3.event) d3.event.stopPropagation();
        var countryElem = $('#yt-country'+country.id);

        if (!this.firstCountry) {
            App.debug("  first country click");
            var state = App.getState();
            state.countries = [country.get('code')];
            App.countryRouter.navigate(App.getRoute(state));
            this.renderSelected(country);
        } else if (this.firstCountry.id !== country.id) {
            App.debug("  second country click");
            var state = App.getState();
            state.countries = [
                this.firstCountry.get('code')
                , country.get('code')
            ];
            App.countryRouter.navigate(App.getRoute(state));
            this.renderSelected(this.firstCountry, country);
        } else {
            var state = App.getState();
            state.countries = [];
            App.countryRouter.navigate(App.getRoute(state));
            this.renderAll();
        }
    },
    
    _showCountryName: function(countryId){
        var label = this.svg.select('#yt-country-name' + countryId)
                        .attr("opacity",0)
                        .attr('visibility','visible');
        var t0 = label.transition().attr('opacity', 1);
        var t1 = t0.transition().attr('opacity', 0).delay(1000);
        var t2 = t1.transition().attr('visibility','hiddnen')
    },

    renderBackground: function (world) {
        var that = this;
        var countries = topojson.feature(world, world.objects.countries).features;
        var country = this.svg.select('#yt-background').selectAll(".yt-country").data(countries);
        country.enter().append("path")
            .attr("class", 'yt-country')
            .attr("data-id",function(d){ return d.id })
            .on("click", function (d) { return that.handleInvalidCountryClick(d); })
            .attr("d", this.path);
    },
    
    renderAll: function () {
        App.debug("  render All");
        var that = this;
        // Render countries
        var g = this.svg.select('#yt-data')
            .selectAll('.yt-country')
            .data(App.allCountries.models, function (d) { return d.id; });
        g.enter()
            .append("path")
            .attr("class", "yt-country")
            .attr("fill", App.globals.colors.disabledColor)
            .attr("id", function(d,i) {return "yt-country"+d.id})
            .attr("data-id", function(d,i) {return d.id})
            .attr("d", function (d) { return that.path(App.globals.countryIdToPath[d.id]); })
            .on("click", function (d) { return that.handleValidCountryClick(d); });
        g.attr("stroke-width", "1")
            .attr("stroke", "rgb(255,255,255)")
        g.transition()
            .attr("fill", App.globals.colors.enabledColor)
            .attr("stroke", "rgb(255,255,255)")
            .style("opacity", "1");
        // Render country names
        var t = this.svg.select('#yt-data')
            .selectAll('text')
            .data(App.allCountries.models, function (d) {return d.id;} );
        t.enter()
            .append("text")
            .attr("class", "yt-country-name")
            .attr("visibility","hidden")
            .attr("text-anchor", "middle")
            .attr("id", function(d,i){ return 'yt-country-name'+d.id})
            .attr("x",function(d){return that.projection(d.get('centroid'))[0];})
            .attr("y",function(d){return that.projection(d.get('centroid'))[1];})
            .text( function(d) {return d.get('name')})
            .attr("font-family","sans-serif")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("fill","rgb(92,72,58)");
        // Render sub-views
        if (this.connectionInfo) {
            this.connectionInfo.hide();
            delete this.connectionInfo;
        }
        App.InfoBoxView.Welcome();
        // Update views state
        delete this.firstCountry;
        delete this.secondCountry;
    },
    
    // Render selected countries
    // country - model of first country
    // secondCountry - model of second country or undefined for none
    // recentDays - Data set to use, uses current if undefined
    renderSelected: function (country, secondCountry, recentDays) {
        App.debug("Rendering selected countries");
        var that = this;
        if (!country) {
            App.debug("renderSelected() called with null first country");
            return;
        }
        // Change datasets if necessary
        // This would be better in a Controller class
        if (typeof(recentDays) !== "undefined") {
            if (recentDays != this.recentDays) {
                if (recentDays == 30) {
                    App.allCountries = App.allCountries30;
                } else if (recentDays == 7) {
                    App.allCountries = App.allCountries7;
                } else {
                    App.allCountries = App.allCountries0;
                }
                this.recentDays = recentDays;
            }
        }
        // Ensure we have data from the current dataset
        country = App.allCountries.get(country.id);
        if (secondCountry) {
            secondCountry = App.allCountries.get(secondCountry.id);
        }
        
        // Style countries based on relation to first country
        var friends = country.getTopFriendCountries();
        // Normalize the color scale
        if (App.globals.normalizeToGlobal) {
            var countryMax = d3.max(friends, function (d) { return d.weight; });
            App.debug('Normalizing to range (0, ' + this.maxWeight + ')');
            this.color.domain([0, this.maxWeight]);
        } else {
            var countryMax = d3.max(friends, function (d) { return d.weight; });
            App.debug('Normalizing to range (0, ' + countryMax + ')');
            this.color.domain([0, countryMax]);
        }
        // Create array of the current country and its friends
        var countryData = friends;
        countryData.push(country);
        var countries = this.svg.select('#yt-data').selectAll('.yt-country')
            .data(countryData, function (d) { return d.id; });
        countries.enter()
            .append("path")
            .attr("class", "yt-country")
            .attr("id", function(d,i) {return "yt-country"+d.id})
            .attr("data-id", function(d,i) {return d.id})
            .attr("d", function (d) { return that.path(App.globals.countryIdToPath[d.id]); })
            .attr("stroke", "#fff")
            .attr("fill", App.globals.colors.disabledColor);
        countries.exit()
            .remove();
        transition = countries.transition()
        transition
            .attr("fill", function (d) {
                return d.id == country.id ? that.selectedColor : that.color(d.weight);
            });

        if (secondCountry) {
            // Style borders to indicated second country
            transition
                .attr('stroke', function (d) {
                    return d.id == secondCountry.id ? that.selectedColor : '#fff'
                })
                .attr('stroke-width', function (d) {
                    return d.id == secondCountry.id ? '2' : '1'
                });
            // Raise z-index by moving to end, allows whole border to be seen
            var node = $('#yt-country' + secondCountry.id);
            node.remove();
            $('#yt-data').append(node);
        } else {
            // Reset border styles
            transition.attr('stroke', '#fff').attr('stroke-width', '1');
        }
        
        // Render sub-views
        if (country) {
            this.countryInfo = new App.InfoBoxView({ country: country});
        }
        if (secondCountry) {
            var videos = country.getIdfVideosInCommonWith(secondCountry.id);
            this.connectionInfo = new App.ConnectionInfoView({ 
                country1: country,
                country2: secondCountry,
                percent: country.getPercentInCommonWith(country.id),
                videoIds: videos
            });
        }
        // Update state
        this.firstCountry = country;
        this.secondCountry = secondCountry;
    },

    renderConnections: function (country) {
        var view = this;
        // Create data set of country pairs
        var data = [];
        if (typeof(country) == 'undefined') {
            $.each(App.allCountries.models, function (i, a) {
                $.each(a.getTopFriendCountries(), function (i, b) {
                    if (a.id < b.id) {
                        data.push({
                            'id': a.id + ':' + b.id,
                            'from': a.get('centroid'),
                            'to': Centroid.fromAlpha3( ISO3166.getAlpha3FromId(b.id) ),
                            'weight': b.weight
                        })
                    }
                });
            });
        }
        // Render connections
        var g = this.svg.select('#yt-connections');
        group = g.selectAll('.connection').data(data, function (d) { return d.id; });
        group.enter().append('path')
            .attr('class', 'connection')
            .attr('d', function (d) { return view.path({"type":"LineString", "coordinates":[d.from, d.to]}); })
            .attr('stroke', this.connectionColor)
            .attr('stroke-width', '2')
            .attr('stroke-opacity', '0')
            .attr('fill', 'none');
        group.exit().remove();
        group.transition()
            .attr('stroke-opacity', function (d) { return view.opacity(d.weight); } )
    }
});

App.ConnectionInfoView = Backbone.View.extend({
    el: $('#yt-connection-info'), 
    template: _.template($('#yt-connection-info-template').html()),
    events: {
        "click       .yt-close-btn":    "handleClose"
    },
    initialize: function(){
        this.render();
    },
    render: function(){
        App.debug("rendering ConnectionInfoView");
        var content = this.template({
            country1: this.options.country1.get("name"),
            country2: this.options.country2.get("name"),
            percent: Math.round(this.options.percent*100)
        });
        this.$el.html( content );
        // and add in the videos
        for(var i=0;i<this.options.videoIds.length;i++){
            $('.yt-video-item-list', this.$el).append( (new App.VideoItemView({
                videoId:this.options.videoIds[i],
                country1: this.options.country1,
                country2: this.options.country2
            })).el );
        }
        this.$el.show();
    },
    hide: function() {
        this.$el.hide();
    },
    handleClose: function(){
        this.hide();
        App.mapView.renderSelected(this.options.country1);
        var state = App.getState();
        state.countries = [this.options.country1.get('code')]
        App.countryRouter.navigate(App.getRoute(state));
    }
});

App.VideoItemView = Backbone.View.extend({
    tagName: "li",
    template: _.template($('#yt-video-item-template').html()),
    events: {
        "click img"   : "showVideo",
    },
    initialize: function(){
        this.render();
    },
    render: function(){
        App.debug("rendering VideoItemView");
        var content = this.template({
            videoId: this.options.videoId,
            dayPct: this.options.dayPct
        });
        this.$el.html( content );
    },
    showVideo: function(evt){
        var videoId = $(evt.target).attr('data-video-id');
        state = App.getState();
        state['videoId'] = this.options.videoId;
        App.countryRouter.navigate(App.getRoute(state));
        
        new App.FullVideoView({ 
            country1: this.options.country1,
            country2: this.options.country2,
            dayPct: this.options.dayPct,
            'videoId': this.options.videoId
        });
    }
});

App.VideoAttentionView = Backbone.View.extend({
    tagName: 'div',
    className: 'yt-date-histogram',
    template: _.template($('#yt-video-attention-template').html()),
    initialize: function(){
        App.debug('Setting up histogram');
        this.render();
    },
    render: function(){
        var content = this.template();
        this.$el.html( content );
        // set up the data
        var data = [];
        for(index in this.options.data){
            data.push({'date':parseDate(this.options.data[index].date),
                       'count':this.options.data[index].count});
        }
        console.log(data);
        var margin = {top: 0, right: 20, bottom: 60, left: 20},
            width = 560 - margin.left - margin.right,
            height = 120 - margin.top - margin.bottom;
        var x = d3.time.scale()
            .range([0, width])
        var y = d3.scale.linear()
            .range([height, 0]);
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(d3.time.format("%m/%d"));
        var line = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.count); });
        var svg = d3.select(this.el).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        x.domain(d3.extent(data, function(d) { return d.date; }));
        y.domain(d3.extent(data, function(d) { return d.count; }));
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
        .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) { return "rotate(-65)" });
        svg.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", line);
    }
});

//http://stackoverflow.com/questions/2587345/javascript-date-parse
function parseDate(input) {
  var parts = input.split('-');
  return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
}

App.FullVideoView = Backbone.View.extend({
    tagName: 'div',
    className: 'modal',
    id: 'yt-video-modal',
    template: _.template($('#yt-full-video-template').html()),
    initialize: function(){
        App.debug('Fetching info...');
        _.bindAll(this,'onResultsReturned',
            'onClosing');
        $.getJSON('/video/'+this.options.videoId+'/popularity.json',this.onResultsReturned);
        $('#yt-progress-bar').show();
    },
    onResultsReturned: function(data){
        $('#yt-progress-bar').hide();
        this.options.popularity = data;
        this.render();
        this.$el.on('hidden.bs.modal', this.onClosing);
        this.$el.modal();
    },
    onClosing: function(){
        state = App.getState();
        delete state.videoId;
        App.countryRouter.navigate(App.getRoute(state));
    },
    render: function(){
        App.debug("rendering FullVideoView "+this.options.videoId);
        var t="", s="";
        if(this.options.country2!=null) {
            t = this.options.country1.get("name")+" and "+this.options.country2.get("name")+" both watched this";
            s = "";
        } else if(this.options.country1!=null){
            t = this.options.country1.get("name")+" watched this";
            if(this.options.dayPct>0){
                s = "This was on the top trending list in "+this.options.country1.get("name")+" for "+this.options.dayPct+"% of the days we've tracked.";
            }
        } else {
            t = "Who is Watching?"
        }
        var content = this.template({
            title: t,
            summary: s,
            mostPopularCountry: ISO3166.getNameFromAlpha3(this.options.popularity.mostPopularCountry.code),
            mostPopularDays: this.options.popularity.mostPopularCountry.days,
            videoId: this.options.videoId
        });
        this.$el.html( content );
        // render and add the attention-over-time plot
        var attentionView = new App.VideoAttentionView({data: this.options.popularity.attentionByDate});
        this.$('.yt-video-attention').html(attentionView.el);
        // render the map of global popularity
        this.projection = d3.geo.kavrayskiy7()
            .scale(125)
            .translate([270,170])
            .precision(.1);
        this.path = d3.geo.path()
            .projection(this.projection);
        this.svg = d3.select(this.el).select('.modal-body').append("svg")
            .attr("width", 560)
            .attr("height", 300);
        this.svg.append('g').attr('id', 'yt-background');
        this.svg.append('g').attr('id', 'yt-data');
        this.color = d3.scale.linear()
            .range([App.globals.colors.minColor, App.globals.colors.maxColor])
            .domain([0, 1]);
        this.opacity = d3.scale.pow().exponent(2)
            .range([0, 1])
            .domain([0, 1]);
        var that = this;
        var countries = topojson.feature(App.globals.worldMap, App.globals.worldMap.objects.countries).features;
        var country = this.svg.select('#yt-background').selectAll(".yt-country").data(countries);
        country.enter().append("path")
            .attr("class", 'yt-country')
            .attr("data-id",function(d){ return d.id })
            .attr("d", this.path);
        var colors = [];
        $.each(this.options.popularity.countryScores, function (i, d) {
            colors.push({id:ISO3166.getIdFromAlpha3(d.code), color:that.color(d.score)});
        });
        var countries = this.svg.select('#yt-data').selectAll('.yt-country')
            .data(colors, function (d) { return d.id; });
        countries.enter()
            .append("path")
            .attr("class", "yt-country")
            .attr("id", function(d,i) {return "yt-country"+d.id})
            .attr("data-id", function(d,i) {return d.id})
            .attr("d", function (d) { return that.path(App.globals.countryIdToPath[d.id]); })
            .attr("fill", "#eee")
        countries.exit()
            .remove();
        countries
            .transition()
            .attr("fill", function (d) { return d.color; });
        // make sure video stops playing when modal is closed
        this.$el.on('hide.bs.modal',function(){
            $('div.modal-body').html("");
        });
    }
});

App.AlertView = Backbone.View.extend({
    el: $('#yt-alert'),
    template: _.template($('#yt-alert-template').html()),
    initialize: function(){
        this.render();
    },
    render: function(){
        App.debug("rendering AlertView ");
        if(App.globals.lastAlertTimeout!=null) {
            clearTimeout(App.globals.lastAlertTimeout);
        }
        var content = this.template({
            msg: this.options.msg
        });
        this.$el.html( content )
            .offset({ 
                top: this.options.position[1] - this.$el.height()/2, 
                left: this.options.position[0] - this.$el.width()/2
                })
            .css('opacity',1)
            .show();
        var that = this;
        App.globals.lastAlertTimeout = window.setTimeout(function() {
            that.$el.fadeTo(200, 0);
        }, 1000);
    }
});

App.InfoBoxView = Backbone.View.extend({
    el: $("#yt-info-box"), 
    template: _.template($('#yt-info-box-template').html()),
    events: {
        "click   .yt-close-btn":              "handleClose",
        "click   .yt-related-country":        "handleRelatedCountry",
        "click   #country-video-list-nav a":  "handleTabs"
    },
    initialize: function(){
        this.render();
    },
    handleTabs: function(evt){
        $(evt.target).tab('show');
        evt.preventDefault();
    },
    handleRelatedCountry: function(evt){
        var countryId = $(evt.target).attr('data-country-id');
        App.mapView.handleValidCountryClick( App.allCountries.get(countryId) );
        evt.preventDefault();
    },
    render: function(){
        App.debug("rendering InfoBoxView");
        var t = "", c = "";
        if('country' in this.options){
            t = this.options.country.get("name");
            c = _.template($('#yt-country-details-template').html(),{countryName: this.options.country.get("name")});
        } else {
            t = this.options.title;
            c = this.options.content;
        }
        var content = this.template({
            title: t, content: c
        });
        this.$el.html( content );
        if('country' in this.options){
            // add in related countries
            var relatedCountryListHtml = "";
            _.each(this.options.country.getTopFriendCountries(5), function(info){
                relatedCountryListHtml+= '<li><a href="#" class="yt-related-country" data-country-id="'+info.id+'">'+info.name+'</a></li>';
            });
            $('#yt-related-list',this.$el).html(relatedCountryListHtml);
            // Add in popular videos
            var videos = this.options.country.get('videos');
            for(var i=0;i<Math.min(videos.length,10);i++){
                $('#yt-country-top ul.yt-video-item-list', this.$el).append( (new App.VideoItemView({
                    videoId: videos[i][0],
                    dayPct: Math.round(100*videos[i][1]/this.options.country.get('days')),
                    country1: this.options.country
                })).el );
            }
            // Add in popular videos weighted by idf
            var videos = this.options.country.get('unique');
            for(var i=0;i<Math.min(videos.length,10);i++){
                $('#yt-country-unique ul.yt-video-item-list', this.$el).append( (new App.VideoItemView({
                    videoId: videos[i][0],
                    dayPct: Math.round(100*videos[i][1]/this.options.country.get('days')),
                    country1: this.options.country
                })).el );
            }
            $('.yt-close-btn', this.$el).show();
        } else {
            $('.yt-close-btn', this.$el).hide();
        }
        this.$el.fadeIn();  // do a fade here so it matches the countries fade in
    },
    handleClose: function(){
        App.mapView.handleMapBackgroundClick();
    }
});
App.InfoBoxView.Welcome = function(){
    new App.InfoBoxView({ 
        title: "Explore the Map",
        content: '<p>Click on a country to see which other countries watched similar videos.  The darker the country, the more they have in common.  Click a second country to see what videos are popular in both places.</p><p>Read about <a href="http://www.ethanzuckerman.com/blog/2013/09/23/what-we-watch-a-new-tool-for-watching-how-popular-videos-spread-online/">our first insights</a> to learn more. Created by the <a href="http://civic.mit.edu/">MIT Center for Civic Media</a>, based on data available on the public <a href="http://www.youtube.com/trendsdashboard">YouTube Trends website</a>.</p><p><small>Curious? Email whatwewatch&#64;media.mit.edu</small></p>'
    });
};

App.ControlView = Backbone.View.extend({
    el: $('#yt-controls'),
    initialize: function () {
        this.render();
        _.bindAll(this, 'handlePeriodSelect')
        $('#yt-controls button:first').addClass('active');
    },
    events: {
        'click .btn': 'handlePeriodSelect'
    },
    render: function () {
        var template = _.template($('#yt-controls-template').html());
        this.$el.html( template );
    },
    update: function () {
        state = App.getState();
        var recentDays = 0;
        if (state.recentDays) {
            recentDays = state.recentDays;
        }
        $('button', this.$el).removeClass('active');
        $('button[value='+recentDays+']', this.$el).addClass('active');
    },
    handlePeriodSelect: function (ev) {
        App.debug('Selected period');
        // Deselect others
        $(ev.currentTarget).siblings().removeClass('active');
        if ($(ev.currentTarget).hasClass('active')) {
            // Prevent deselection if we click the same button twice
            $(ev.currentTarget).removeClass('active');
        }
        var recentDays = $(ev.currentTarget).val();
        App.debug("Selected time span: " + recentDays);
        // Set the data to the selected timespan
        // If the project gets bigger, this should throw an event and instead
        // let a controller handle it.
        state = App.getState();
        if (recentDays != state.recentDays) {
            state['recentDays'] = recentDays;
            App.countryRouter.navigate(App.getRoute(state));
            if (state.countries.length === 0) {
                if (recentDays == 7) {
                    App.allCountries = App.allCountries7;
                } else if (recentDays == 30) {
                    App.allCountries = App.allCountries30;
                } else {
                    App.allCountries = App.allCountries0;
                }
            } else if (state.countries.length === 1) {
                var firstCountry = App.allCountries.get(ISO3166.getIdFromAlpha3(state.countries[0]))
                App.mapView.renderSelected(firstCountry, null, recentDays);
            } else if (state.countries.length > 1) {
                var firstCountry = App.allCountries.get(ISO3166.getIdFromAlpha3(state.countries[0]))
                var secondCountry = App.allCountries.get(ISO3166.getIdFromAlpha3(state.countries[1]))
                App.mapView.renderSelected(firstCountry, secondCountry, recentDays);
            }
        }
    },
    renderRecent: function (recent) {
        $('button', this.$el).removeClass('active');
        $('button[value='+recent+']', this.$el).addClass('active');
    }
});
