YouTube Trends Analyzer
=======================

Playing with YouTube Trends Data

Setup
-----

First install the dependencies
```
bundle install
```

Next setup the database
```
rake db:migrate
```

Scraping
--------

To load the latest rankings from youtube, do this
```
ruby -Ilib scrape-rankings.rb
```

Reporting
---------

To generate a graphml report showing connections between the countries
```
ruby -Ilib generate-graphml.rb
```

Locations
---------

The initial list of locations was seeded by running the following JQuery statement 
from the browser console on the YouTube Trends webpage:
```
$('select[data-hash=loc0] option').map(function() { return $(this).val()+"|"+$(this).text();}).get();
```
and then cleaning it up via a few regular expressions in a text editor