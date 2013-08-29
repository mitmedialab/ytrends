
var Country = Backbone.Model.extend({
    initialize: function(){
        console.log("created a country");
    },
    getFriends: function(){
    }
});

var Countries = Backbone.Collection.extend({
    model: Country
});
