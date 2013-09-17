App.MapView = Backbone.View.extend({

    // see http://www.colourlovers.com/palette/125988/Artificial_Growth
    disabledColor: 'rgb(240, 240, 240)',
    enabledColor: 'rgb(243,195,99)',
    selectedColor: 'rgb(170,217,241)',
    connectionColor: 'rgb(170,217,241)',
    minColor: 'rgb(241,233,187)',
    maxColor: 'rgb(207,97,35)',

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
            'handleValidCountryClick',
            '_finishRender',
            'unhighlightCountry'
        );
        this.render();
    },

    render: function(){
        App.debug("Rendering MapView:started");
        this.$el.html( this.template );
        // Load and render geography
        d3.json("data/world-110m.json", this._finishRender);
    },
    
    _finishRender:function(error, world){
        this.initD3();
        this.createCountryLookup(world);
        this.renderBackground(world);
        this.renderAll();
        App.debug("  Rendering MapView:done")
        this.trigger("render.done");
    },

    initD3: function () {
        App.debug("  init D3")
        var mapWidth = parseInt(d3.select(this.el).style('width'));
        var mapHeight = mapWidth / 2.19 // 520 @ 1140
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
            .attr('fill', this.enabledColor)
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
            .range([this.minColor, this.maxColor])
            .domain([0, this.maxWeight]);
        this.opacity = d3.scale.pow().exponent(2)
            .range([0, 1])
            .domain([0, this.maxWeight]);
        //this.renderConnections();
    },
    
    createCountryLookup: function (world) {
        var that = this;
        this.countryLookup = {};
        var countries = topojson.feature(world, world.objects.countries).features;
        $.each(countries, function (i, d) {
            that.countryLookup[d.id] = d;
        });
    },

    handleMapBackgroundClick: function(evt){
        App.debug("Clicked background")
        this.resetSelection();
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

    handleValidCountryClick: function(country){
        App.debug('Clicked ' + country.id);
        if(!('cid' in country)){    // gotta turn this into a country model object, since rederRelated uses the video info
            country = App.allCountries.get(country.id);
        }
        if (d3.event) d3.event.stopPropagation();
        var countryElem = $('#yt-country'+country.id);

        // click on first country
        if(!this.selected) {
            App.debug("  first country click");
            App.countryRouter.navigate(country.get('code'));
            this.selected = country;
            // show info about country
            new App.InfoBoxView({ country: this.selected});
            // update map with related
            //this._showCountryName(country.id);
            this.renderRelated(country);        
        //clicked on related country
        } else if(country.id !== this.selected.id) {
            App.debug("  second country click");
            App.countryRouter.navigate(this.selected.get('code')+"/"+country.get("code"));
            this.updateRelated(country);
            //this._showCountryName(country.id);
            //var videos = this.selected.getVideosInCommonWith(country.id);
            var videos = this.selected.getIdfVideosInCommonWith(country.id);
            new App.ConnectionInfoView({ 
                country1: this.selected,
                country2: App.allCountries.get(country.id),
                percent: this.selected.getPercentInCommonWith(country.id),
                videoIds: videos
            });
        } else {
            App.debug("  other click");
            this.resetSelection();
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

    resetSelection: function(){
        App.debug("  reset selection");
        this.selected = null;
        this.renderAll();
        this.svg.selectAll('.yt-country-name').transition().attr('opacity', '0').each("end", function(){$(this).attr('visibility','hidden')});
        $('#yt-connection-info').hide();
        App.InfoBoxView.Welcome();
        App.countryRouter.navigate("");
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
            .attr("fill", this.disabledColor)
            .attr("stroke", "rgb(255,255,255)")
            .attr("id", function(d,i) {return "yt-country"+d.id})
            .attr("data-id", function(d,i) {return d.id})
            .attr("d", function (d) { return that.path(that.countryLookup[d.id]); })
            .on("click", function (d) { return that.handleValidCountryClick(d); })
        g.transition()
            .attr("fill", this.enabledColor)
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
    },

    renderRelated: function (country) {
        var that = this;
        // handle the case where we have data for the country
        var countryElem = $('#yt-country'+country.id);
        if(country==null){
            App.debug("No info about "+country.id);
            return;
        }
        $('.yt-country').attr("class","yt-country");
        var friends = country.getTopFriendCountries();
        // Create color array to use as d3 data
        // This lets us add the selected country as a special case
        if (App.globals.normalizeToGlobal) {
            var countryMax = d3.max(friends, function (d) { return d.weight; });
            App.debug('Normalizing to range (0, ' + this.maxWeight + ')');
            this.color.domain([0, this.maxWeight]);
        } else {
            var countryMax = d3.max(friends, function (d) { return d.weight; });
            App.debug('Normalizing to range (0, ' + countryMax + ')');
            this.color.domain([0, countryMax]);
        }
        colors = [{id:country.id, color:this.selectedColor}];
        $.each(friends, function (i, d) {
            colors.push({id:d.id, color:that.color(d.weight)});
        });
        var countries = this.svg.select('#yt-data').selectAll('.yt-country')
            .data(colors, function (d) { return d.id; });
        countries.enter()
            .append("path")
            .attr("class", "yt-country")
            .attr("id", function(d,i) {return "yt-country"+d.id})
            .attr("data-id", function(d,i) {return d.id})
            .attr("d", function (d) { return that.path(that.countryLookup[d.id]); })
        countries.exit()
            .remove();
        countries
            .transition()
            .attr("fill", function (d) { return d.color; });
            
        // TODO: animate arcs kind of like http://bl.ocks.org/enoex/6201948
    },

    updateRelated: function (country) {
        this.svg.select('#yt-data').selectAll('.yt-country')
            .transition()
            .attr('stroke', '#fff')
            .attr('stroke-width', '1');
        this.svg.select('#yt-country' + country.id)
            .transition()
            .attr('stroke', this.selectedColor)
            .attr('stroke-width', '2');
    },
    
    unhighlightCountry: function(country){
        this.svg.select('#yt-country' + country.id)
            .transition()
            .attr('stroke', '#fff')
            .attr('stroke-width', '1');
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
        "click       .close-btn":    "handleClose"
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
    handleClose: function(){
        App.mapView.unhighlightCountry(this.options.country2);
        this.$el.hide();
        App.countryRouter.navigate(this.options.country1.get('code'));
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
        new App.FullVideoView({ 
            country1: this.options.country1,
            country2: this.options.country2,
            dayPct: this.options.dayPct,
            videoId: $(evt.target).attr('data-video-id')});
    }
});

App.FullVideoView = Backbone.View.extend({
    el: $('#yt-video-modal'),
    template: _.template($('#yt-full-video-template').html()),
    initialize: function(){
        this.render();
        this.$el.modal();
    },
    render: function(){
        App.debug("rendering FullVideoView "+this.options.videoId);
        var t="", s="";
        if(this.options.country2!=null) {
            t = this.options.country1.get("name")+" and "+this.options.country2.get("name")+" both watched this";
            s = "";
        } else {
            t = this.options.country1.get("name")+" watched this";
            s = "This was on the top watched list in "+this.options.country1.get("name")+" for "+this.options.dayPct+"% of the days we've tracked.";
        }
        var content = this.template({
            title: t,
            summary: s,
            videoId: this.options.videoId
        });
        this.$el.html( content );
        this.$el.on('hide.bs.modal',function(){  // make sure video stops playing when modal is closed
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
        "click      .close-btn":    "handleClose"
    },
    initialize: function(){
        this.render();
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
                relatedCountryListHtml+= "<li>"+info.name+" <!--<small class='light'>"+Math.round(100*info.percent)+"%</small>--></li>";
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
            $('#country-video-list-nav a').click(function (e) {
                e.preventDefault();
                $(this).tab('show');
            });
            $('.close-btn', this.$el).show();
        } else {
            $('.close-btn', this.$el).hide();
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
        content: '<p>Click on a country to see which other countries watched similar videos.  The darker the country, the more they have in common.  Click a second country to see what videos are popular in both places.</p><p>Created by the <a href="http://civic.mit.edu/">MIT Center for Civic Media</a>, based on data available on the public <a href="http://www.youtube.com/trendsdashboard">YouTube Trends website</a>.</p><p><small>Curious? Email whatwewatch&#64;media.mit.edu</small></p>'
    });
};
