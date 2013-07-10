YouTube Trends Scraper
======================

A simple ruby library to scrape all the YouTube Trends data in to a SQLite database.

Installation
------------

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

Testing
-------

To run the simple test case, do this
```
rake test
```

Locations
---------

The initial list of locations was seeded by running the following JQuery statement 
from the browser console on the YouTube Trends webpage:
```
$('select[data-hash=loc0] option').map(function() { return $(this).val()+"|"+$(this).text();}).get();
```
and then cleaning it up via a few regular expressions in a text editor
