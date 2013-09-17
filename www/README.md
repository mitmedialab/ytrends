What we Watch Server
====================

Small server to showcase data we gathered from YouTube Trends.

Installation
------------

Make sure you havy Python 2.7 (and the pip package manager).

You also need to install the flask and libraries:

```
pip install flask
```

Use
---

Run this command and then visit `localhost:5000` with a web browser

```
python server.py
```

Deploying
---------

First, prep your Ubuntu machine:
```
sudo aptitude install python
sudo aptitude install libapache2-mod-wsgi
sudo easy_install pip
sudo pip install flask
```

Now follow the instructions for Configuring Apache:
  http://flask.pocoo.org/docs/deploying/mod_wsgi/
