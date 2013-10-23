
App.Country = Backbone.Model.extend({
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
    },
    getIdfVideosInCommonWith: function(countryId){
        var friendCountryAlpha3 = ISO3166.getAlpha3FromId(countryId);
        var friends = this.get('friends');
        for(i=0;i<friends.length;i++){
            if(friends[i].code==friendCountryAlpha3){
                return friends[i].unique;
            }
        }
        return [];  // nothing in common
    }
});

App.Video = Backbone.Model.extend({
    initialize: function (args) {
    },
    mostPopular: function () {
        var counts = {};
        var countries = _.pluck(this.get('attention'), 'countries');
        _.each(countries, function (day) {
            _.each(day, function (country) {
                counts[country.loc] = counts[country.loc] ? counts[country.loc] + 1 : 1;
            });
        });
        popular = _.sortBy(_.pairs(counts), function (pair) { return pair[1]; }).pop();
        return {
            'code': popular[0]
            , 'days': popular[1]
        };
    },
    countryScores: function () {
        var counts = {};
        var countries = _.pluck(this.get('attention'), 'countries');
        _.each(countries, function (day) {
            _.each(day, function (country) {
                counts[country.loc] = counts[country.loc] ? counts[country.loc] + 1 : 1;
            });
        });
        popular = _.sortBy(_.pairs(counts), function (pair) { return pair[1]; });
        popular = popular.reverse();
        max = popular[0][1];
        scores = _.map(popular, function (pair) { return {'code':pair[0], 'score':(pair[1]/max)}; });
        return scores;
    }
});

App.RecentVideoCollection = Backbone.Collection.extend({
    model: App.Video,
    initialize: function (args) {
        this.recentDays = args.recentDays
    },
    recentDays: 0,
    url: function () {
        return '/data/recent/' + this.recentDays + '/video';
    }
});

App.CountriesCollection = Backbone.Collection.extend({
    model: App.Country,    
    initialize: function(){
    },
    findByAlpha3: function(alpha3){
        var id = ISO3166.getIdFromAlpha3(alpha3);
        return this.get(id);
    }
});
