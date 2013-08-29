
var Country = Backbone.Model.extend({
    defaults: {
        name: "Unknown",
        code: "??",
        friends: []
    },
    initialize: function(){
        console.log("created a country");
    },
    getFriends: function(){
    }
});

var Countries = Backbone.Collection.extend({
    model: Country
});
