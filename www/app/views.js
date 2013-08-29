MapView = Backbone.View.extend({
    initialize: function(){
        console.log("Initialized MapView");
    },
    render: function(){
        console.log("rendering MapView");
        var template = _.template($('#yt-map-template').html(), {});
        this.$el.html( template );
        
        var width = 960, height = 580;
        var projection = d3.geo.kavrayskiy7()
            .scale(170)
            .translate([width / 2, height / 2])
            .precision(.1);
        var path = d3.geo.path()
            .projection(projection);
        var svg = d3.select(this.el).append("svg")
            .attr("width", width)
            .attr("height", height);
        d3.json("data/world-50m.json", function(error, world) {
            var countries = topojson.feature(world, world.objects.countries).features;

            svg.selectAll(".country")
                .data(countries)
            .enter().insert("path", ".graticule")
                .attr("class", "country")
                .attr("d", path)
                .style("fill", function(d, i) { return "#333333"; });

            svg.insert("path", ".graticule")
                .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
                .attr("class", "boundary")
                .attr("d", path);
        });
        d3.select(self.frameElement).style("height", height + "px");
    }
});