MapView = Backbone.View.extend({
    initialize: function(){
        console.log("Initialized MapView");
    },
    render: function(){
        console.log("rendering MapView");
        var template = _.template($('#yt-map-template').html(), {info:'blah blah'});
        this.$el.html( template );
        //d3.select(this.el);
    }
});