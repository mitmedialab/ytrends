
var Country = Backbone.Model.extend({
    initialize: function(args){
        this.set({'id':ISO3166.getIdFromAlpha3(args['code'])});
    },
    getTopFriendCountries: function(count){
        // TODO: cache this
        var sortedFriends = this.get('friends').sort(function(a,b){return b.weight-a.weight});
        var topFriends = sortedFriends.slice(0,count);
        for(i=0;i<topFriends.length;i++){
            topFriends[i].id = ISO3166.getIdFromAlpha3(topFriends[i].code);
        }
        return topFriends;
    },
    getVideosInCommonWith: function(countryId){
        var friendCountryAlpha3 = ISO3166.getAlpha3FromId(countryId);
        var friends = this.get('friends');
        for(i=0;i<friends.length;i++){
            if(friends[i].code==friendCountryAlpha3){
                return friends[i].videos;
            }
        }
        return [];  // nothing in common
    }
});

var Countries = Backbone.Collection.extend({
    model: Country,    
    initialize: function(){
    }
});
