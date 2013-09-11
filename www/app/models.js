
var Country = Backbone.Model.extend({
    initialize: function(args){
        this.set({'id':ISO3166.getIdFromAlpha3(args['code'])});
        this.set({'alpha3':args['code']});
        this.set({'name':ISO3166.getNameFromId(this.get('id'))});
        this.set({'centroid':Centroid.fromAlpha3(args['code'])});
        this.sortedFriends = null;
    },
    getTopFriendCountries: function(count){
        if(this.sortedFriends==null){   // lazy cache of sorted friends (most to least)
            this.sortedFriends = this.get('friends').sort(function(a,b){return b.weight-a.weight});
        }
        var topFriends = this.sortedFriends.slice(0,count);
        for(i=0;i<topFriends.length;i++){
            topFriends[i].id = ISO3166.getIdFromAlpha3(topFriends[i].code);
            topFriends[i].name = ISO3166.getNameFromId(topFriends[i].id);
        }
        return topFriends;
    },
    getPercentInCommonWith: function(countryId){
        var friendCountryAlpha3 = ISO3166.getAlpha3FromId(countryId);
        var friends = this.get('friends');
        for(i=0;i<friends.length;i++){
            if(friends[i].code==friendCountryAlpha3){
                return friends[i].percent;
            }
        }
        return 0;  // nothing in common
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
