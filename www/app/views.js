MapView = Backbone.View.extend({

    // Configuration
    width: 960,
    height: 500,
    // see http://www.colourlovers.com/palette/125988/Artificial_Growth
    disabledColor: 'rgb(240, 240, 240)',
    enabledColor: 'rgb(243,195,99)',
    selectedColor: 'rgb(170,217,241)',
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
        this.projection = d3.geo.mercator()
            .scale(160)
            .translate([460, 300])
            .precision(.1);
        this.path = d3.geo.path()
            .projection(this.projection);
        this.svg = d3.select(this.el).append("svg")
            .attr("width", this.width)
            .attr("height", this.height);
        this.svg.append('g').attr('id', 'yt-background');
        this.svg.append('g').attr('id', 'yt-data');
        this.color = d3.scale.linear()
            .range([this.minColor, this.maxColor])
            .domain([0, d3.max(window.allCountries.models, function (d) { return d3.max(d.attributes.friends, function (d) { return d.weight; }); }) ]);
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

        // click on first country, or unrelated one
        if(!this.selected) {
            console.log('Selecting');
            this.selected = country;
            this.renderRelated(country);
        //clicked on related country
        } else if(country.id !== this.selected.id) {
            console.log('Related');
            var videos = this.selected.getVideosInCommonWith(country.id);
            window.videoListView = new VideoListView({ el: $('#yt-video-list-container'), videoIds: videos});
        } else {
            console.log('Deselecting');
            this.selected = null;
            this.renderAll();
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
            .attr("fill", function (d) { console.log(d.color); return d.color; });
            
        // TODO: animate arcs kind of like http://bl.ocks.org/enoex/6201948
    }

});

VideoListView = Backbone.View.extend({
    initialize: function(){
        this.render();
    },
    render: function(){
        console.log("rendering VideoListView");
        var template = _.template($('#yt-video-list-template').html(), {videoCount: this.options.videoIds.length});
        this.$el.html( template );

        for(var i=0;i<this.options.videoIds.length;i++){
            $('.video-item-list', this.$el).append( (new VideoItemView({videoId:this.options.videoIds[i]})).el );
        }
    }
});

VideoItemView = Backbone.View.extend({
    initialize: function(){
        this.render();
    },
    render: function(){
        console.log("rendering VideoItemView");
        var template = _.template($('#yt-video-item-template').html(), {videoId: this.options.videoId});
        this.$el.html( template );
    }
});
