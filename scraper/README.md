YouTube Trends Scraper
======================

A simple ruby library to scrape all the YouTube Trends data in to a MySQL database.

Installation
------------

First install the dependencies
```
bundle install
```

Next setup the database by editing the `db/config.yml` and then creating the tables:
```
rake db:migrate
```

Scraping
--------

To load the latest rankings from youtube, do this
```
ruby -Ilib scrape-rankings.rb
```
We run this every night (via a cron job on our server).

Testing
-------

To run the simple test case, do this
```
rake test
```

Locations
---------

The initial list of locations was seeded by running JQuery-fying the 
[YouTube Trends webpage](http://www.youtube.com/trendsdashboard) and then running this code
in the JS console:
```
$('select[data-hash=loc0] option').map(function() { return $(this).val()+"|"+$(this).text();}).get();
```
Then we cleaned it up via a few regular expressions in a text editor.
