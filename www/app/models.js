
var Country = Backbone.Model.extend({
    initialize: function(arguments){
        this.set({'id':ISO3166.getIdFromAlpha3(arguments['code'])});
    },
    getTopFriendCountries: function(count){
        var sortedFriends = this.get('friends').sort(function(a,b){return b.weight-a.weight});
        var topFriends = sortedFriends.slice(0,count);
        for(i=0;i<topFriends.length;i++){
            topFriends[i].id = ISO3166.getIdFromAlpha3(topFriends[i].code);
        }
        return topFriends;
    }
});

var Countries = Backbone.Collection.extend({
    model: Country,    
    fetchFromUrl: function(url){
        this.fetch();
    },
    initialize: function(){
    }
});
