MapView = Backbone.View.extend({

    initialize: function(){
        console.log("Initialized MapView");
    },

    render: function(){
        console.log("rendering MapView");
        var template = _.template($('#yt-map-template').html(), {});
        this.$el.html( template );
        
        var width = 960, height = 500;
        var projection = d3.geo.mercator()
            .scale(160)
            .translate([460, 300])
            .precision(.1);
        var path = d3.geo.path()
            .projection(projection);
        var svg = d3.select(this.el).append("svg")
            .attr("width", width)
            .attr("height", height);
        d3.json("data/world-110m.json", function(error, world) {
            var countries = topojson.feature(world, world.objects.countries).features;

            var country = svg.selectAll(".yt-country").data(countries);

            country.enter().insert("path", ".yt-graticule")
                .attr("class", "yt-country")
                .attr("id", function(d,i) {return "yt-country"+d.id})
                .attr("d", path);
            country.on("click",handleClick);
        });
        d3.select(self.frameElement).style("height", height + "px");
    },

    highlightCountry: function(countryId){
        $('.yt-country').attr("class","yt-country");

        var model = window.allCountries.get(countryId);
        if(model==null){
            console.log("No info about "+countryId);
            return;
        }
        var friends = model.getTopFriendCountries(10);

        // TODO: what's the d3 way to do this?
        $('.yt-country').attr("class","yt-country yt-unrelated");
        $('#yt-country'+countryId).attr("class","yt-country yt-selected");
        $.each(friends, function(index,object){
            $('#yt-country'+object['id']).attr("class","yt-country yt-related");
        })
    }

});

// TODO: is there any way to do this IN the view?
function handleClick(e){
    mapView.highlightCountry(e.id);
}