YouTube Trends Analysis
=======================

Basic analysis support for scraped YTrends data.

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
pip install SQLAlchemy, networkx, numpy, scipy, python-dateutil, gdata, MySQL-python
```

Now copy the `app.config.template` to `app.config` and add in `developer_key`
attribute with your Google YouTube API developer key.  Also add in the database 
connection info.

Running
-------

One script adds video metadata to the database.  Run this on a cron every 
minute to fill in the videos table:
```
python update-video-info.py
```

Another script generates some JSON with results, in the `output folder`:
```
python createjson.py
```
