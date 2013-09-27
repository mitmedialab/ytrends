YouTube Trends Analysis
=======================

Basic analysis support for scraped YTrends data. This reads and writes to a MySQL database.

Installation
------------

On Mac OS X I had to do this to install mysql suport:
```
sudo ln -s /usr/local/mysql-5.5.17-osx10.6-x86_64/bin/mysql_config /usr/bin/
sudo ln -s /usr/bin/gcc-4.2 /usr/bin/gcc-4.0
pip install MySQL-python
```

First install the dependencies:
```
pip install SQLAlchemy, networkx, numpy, scipy, gensim, python-dateutil, gdata, MySQL-python
```

Now copy the `app.config.template` to `app.config` and add in `developer_key`
attribute with your Google YouTube API developer key.  Also add in the database 
connection info.

Running
-------

There are a few scripts here:

`createjson.py`

This is the main analysis script.  This calculate various centrality metrics and 
saves the info as json files can be used in the web-app.

`update-video-info.py`

This adds video metadata to the database.  Run this on a cron every minute to fill 
in the videos table of the database.

`analyze.py`
Creates graphml and csv files with analysis results.

`cluster.py`
Detects clusters.

`test.py`

This runs some simple unit tests.
