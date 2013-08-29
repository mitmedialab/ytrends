var ISO3166 = {
	
	numericLookup: null,

	alphaLookup: null,

	loaded: false,

	fetch: function(url){
		$.getJSON(url, function(data) {
			ISO3166.numericLookup = {};
			ISO3166.alphaLookup = {};

			$.each(data, function(key, val) {
		    	ISO3166.numericLookup[val['country-code']] = val;
		    	ISO3166.alphaLookup[val['alpha-3']] = val;
			});
		});
	},

	getCodeForNumeric: function(countryNumber){
		return ISO3166.numericLookup[countryNumber];
	}

};