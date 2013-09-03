MapView = Backbone.View.extend({

    // Configuration
    width: 1170,
    height: 565,
    // see http://www.colourlovers.com/palette/125988/Artificial_Growth
    disabledColor: 'rgb(240, 240, 240)',
    enabledColor: 'rgb(243,195,99)',
    selectedColor: 'rgb(170,217,241)',
    connectionColor: 'rgb(170,217,241)',
    minColor: 'rgb(241,233,187)',
    maxColor: 'rgb(207,97,35)',
    
    initialize: function(){
        console.log("Initialized MapView");
        this.render();
    },

    render: function(){
        var that = this;
        console.log("rendering MapView");
        var template = _.template($('#yt-map-template').html(), {});
        this.$el.html( template );
        // Load and render geography
        d3.json("data/world-110m.json", function(error, world) {
            that.initD3()
            that.createCountryLookup(world);
            that.renderBackground(world);
            that.renderAll();
        });
        d3.select(self.frameElement).style("height", this.height + "px");
    },
    
    initD3: function () {
        var that = this;
        this.projection = d3.geo.mercator()
            .scale(181)
            .translate([570, 350])
            .precision(.1);
        this.path = d3.geo.path()
            .projection(this.projection);
        this.svg = d3.select(this.el).append("svg")
            .attr("width", this.width)
            .attr("height", this.height);
        this.svg.append('g').attr('id', 'yt-background');
        this.svg.append('g').attr('id', 'yt-data');
        this.svg.append('g').attr('id', 'yt-connections');
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
            });
        
        var maxWeight = d3.max(window.allCountries.models, function (d) { return d3.max(d.attributes.friends, function (d) { return d.weight; }); });
        console.log('Global max weight: ' + maxWeight);
        this.color = d3.scale.linear()
            .range([this.minColor, this.maxColor])
            .domain([0, maxWeight]);
        this.opacity = d3.scale.linear()
            .range([0, .5])
            .domain([0, maxWeight]);
    },
    
    createCountryLookup: function (world) {
        var that = this;
        this.countryLookup = {};
        var countries = topojson.feature(world, world.objects.countries).features;
        $.each(countries, function (i, d) {
            that.countryLookup[d.id] = d;
        });
    },
    
    handleCountryClick: function(country){
        var countryElem = $('#yt-country'+country.id);
        console.log('Clicked ' + country.id);

        // click on first country
        if(!this.selected) {
            this.selected = country;
            this.renderRelated(country);
        //clicked on related country
        } else if(country.id !== this.selected.id) {
            this.updateRelated(country);
            var videos = this.selected.getVideosInCommonWith(country.id);
            window.videoListView = new VideoListView({ el: $('#yt-video-list-container'), 
                country1: ISO3166.getNameFromId(this.selected.id),
                country2: ISO3166.getNameFromId(country.id),
                videoIds: videos
            });
        } else {
            this.selected = null;
            this.renderAll();
            $('#yt-video-list-container').html('');
        }

    },
    
    renderBackground: function (world) {
        var countries = topojson.feature(world, world.objects.countries).features;
        var country = this.svg.select('#yt-background').selectAll(".yt-country").data(countries);
        country.enter().append("path")
            .attr("class", 'yt-country')
            .attr("d", this.path);
    },
    
    renderAll: function () {
        var that = this;
        // Render countries
        var g = this.svg.select('#yt-data')
            .selectAll('.yt-country')
            .data(window.allCountries.models, function (d) { return d.id; });
        g.enter()
            .append("path")
            .attr("class", "yt-country")
            .attr("fill", this.disabledColor)
            .attr("stroke", "rgb(255,255,255)")
            .attr("id", function(d,i) {return "yt-country"+d.id})
            .attr("data-id", function(d,i) {return d.id})
            .attr("d", function (d) { return that.path(that.countryLookup[d.id]); })
            .on("click", function (d) { return that.handleCountryClick(d); })
        g.transition()
            .attr("fill", this.enabledColor)
            .attr("stroke", "rgb(255,255,255)")
            .style("opacity", "1");
    },

    renderRelated: function (country) {
        var that = this;
        // handle the case where we have data for the country
        var countryElem = $('#yt-country'+country.id);
        if(country==null){
            console.log("No info about "+country.id);
            return;
        }
        $('.yt-country').attr("class","yt-country");
        var friends = country.getTopFriendCountries();
        // Create color array to use as d3 data
        // This lets us add the selected country as a special case
        var countryMax = d3.max(friends, function (d) { return d.weight; });
        console.log('Normalizing to range (0, ' + countryMax + ')');
        this.color.domain([0, countryMax]);
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
    
    renderConnections: function (country) {
        var view = this;
        // Create data set of country pairs
        var data = [];
        if (typeof(country) == 'undefined') {
            $.each(window.allCountries.models, function (i, a) {
                $.each(a.getTopFriendCountries(), function (i, b) {
                    if (a.id < b.id)
                    data.push({
                        'id': a.id + ':' + b.id,
                        'from': view.projection(Centroid.getCentroidFromAlpha3(ISO3166.getAlpha3FromId(a.id))),
                        'to': view.projection(Centroid.getCentroidFromAlpha3(ISO3166.getAlpha3FromId(b.id))),
                        'weight': b.weight
                    })
                });
            });
        }
        // Render connections
        var g = this.svg.select('#yt-connections');
        group = g.selectAll('.connection').data(data, function (d) { return d.id; });
        group.enter().append('line')
            .attr('class', 'connection')
            .attr('x1', function (d) { return d.from[0]; })
            .attr('x2', function (d) { return d.to[0]; })
            .attr('y1', function (d) { return d.from[1]; })
            .attr('y2', function (d) { return d.to[1]; })
            .attr('stroke', this.connectionColor)
            .attr('stroke-width', '2')
            .attr('stroke-opacity', '0');
        group.exit().remove();
        group.transition()
            .attr('stroke-opacity', function (d) { return view.opacity(d.weight); } )
    }
    
});

VideoListView = Backbone.View.extend({
    initialize: function(){
        this.render();
    },
    render: function(){
        console.log("rendering VideoListView");
        var template = _.template($('#yt-video-list-template').html(), {
            country1: this.options.country1,
            country2: this.options.country2
        });
        this.$el.html( template );

        for(var i=0;i<this.options.videoIds.length;i++){
            $('.yt-video-item-list', this.$el).append( (new VideoItemView({
                videoId:this.options.videoIds[i],
                country1: this.options.country1,
                country2: this.options.country2
            })).el );
        }
    }
});

VideoItemView = Backbone.View.extend({
    events: {
        "click img"   : "showVideo",
    },
    initialize: function(){
        this.render();
    },
    render: function(){
        console.log("rendering VideoItemView");
        var template = _.template($('#yt-video-item-template').html(), {videoId: this.options.videoId});
        this.$el.html( template );
    },
    showVideo: function(evt){
        console.log(evt.target);
        new FullVideoView({el: $('#yt-video-modal'), 
            country1: this.options.country1,
            country2: this.options.country2,
            videoId: $(evt.target).attr('data-video-id')});
    }
});

FullVideoView = Backbone.View.extend({
    initialize: function(){
        this.render();
        this.$el.modal();
    },
    render: function(){
        console.log("rendering FullVideoView "+this.options.videoId);
        var template = _.template($('#yt-full-video-template').html(), {
            videoId: this.options.videoId,
            country1: this.options.country1,
            country2: this.options.country2
        });
        this.$el.html( template );
    }
});
