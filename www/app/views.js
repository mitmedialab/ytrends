MapView = Backbone.View.extend({

    initialize: function(){
        console.log("Initialized MapView");
        this.render();
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
                .attr("data-id", function(d,i) {return d.id})
                .attr("d", path);
            country.on("click",handleClick);
        });
        d3.select(self.frameElement).style("height", height + "px");
    },

    handleCountryClick: function(countryId){
        var countryElem = $('#yt-country'+countryId);

        // click on first country, or unrelated one
        if($('.yt-selected').length==0 || countryElem.attr("class").indexOf("yt-related")==-1) {
            // handle case where we don't know anything about this country
            var model = window.allCountries.get(countryId);
            if(model==null){
                console.log("No info about "+countryId);
                return;
            }
            // handle the case where we have data for the country
            $('.yt-country').attr("class","yt-country");
            var friends = model.getTopFriendCountries(10);
            // TODO: what's the d3 way to do this?
            $('.yt-country').attr("class","yt-country yt-unrelated");
            countryElem.attr("class","yt-country yt-selected");
            $.each(friends, function(index,object){
                $('#yt-country'+object['id']).attr("class","yt-country yt-related");
            })
            // TODO: animate arcs kind of like http://bl.ocks.org/enoex/6201948
        
        //clicked on related country
        } else if(countryElem.attr("class").indexOf("yt-related")!=-1) {
            var firstSelectedCountryId = $($('.yt-selected')[0]).attr("data-id");
            var firstCountryModel = allCountries.get(firstSelectedCountryId);
            var videos = firstCountryModel.getVideosInCommonWith(countryId);
            window.videoListView = new VideoListView({ el: $('#yt-video-list-container'), videoIds: videos});
        }

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
            this.$el.append( (new VideoItemView({videoId:this.options.videoIds[i]})).el );
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

// TODO: is there any way to do this IN the view?
function handleClick(e){
    mapView.handleCountryClick(e.id);
}