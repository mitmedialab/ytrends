YouTube Trends Analysis
=======================

Basic analysis support for scraped YTrends data.

Installation
------------

First install the dependencies:
```
pip install SQLAlchemy
pip install networkx
pip install python-dateutil
pip install gdata
```

Now copy the `app.config.template` to `app.config` and add in `developer_key`
attribute with your Google YouTube API developer key.

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
