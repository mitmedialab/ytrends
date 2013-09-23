import sys, os, logging, ConfigParser, operator
from flask import Flask, render_template, json, jsonify
import sqlalchemy, sqlalchemy.orm

parentdir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0,os.path.join(parentdir,'analysis') )
import ytrends.stats

# constants
CONFIG_FILENAME = 'app.config'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# setup logging
handler = logging.FileHandler('server.log')
logging.basicConfig(filename='server.log',level=logging.DEBUG)
log = logging.getLogger('server')
log.info("---------------------------------------------------------------------------")
sqla_log = logging.getLogger('sqlalchemy.engine.base.Engine')
sqla_log.addHandler(handler)
sqla_log.propagate = False


# read in app config
config = ConfigParser.ConfigParser()
config.read(os.path.join(BASE_DIR,CONFIG_FILENAME))

# init the connection to the database
stats_url = "mysql+mysqldb://"+config.get('db','user')+":"+config.get('db','pass')+\
    "@"+config.get('db','host')+"/"+config.get('db','name')+"?charset=utf8"

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("base.html")

@app.route("/video/<video_id>/popularity.json")
def video_popularity(video_id):
    stats = ytrends.stats.Stats(stats_url)
    log.info("Connected to db")
    popularity = stats.get_video_popularity(video_id)
    if '--' in popularity.keys():
        popularity['usa'] = popularity['--']
        del popularity['--']
    max_country = sorted(popularity, key=popularity.get, reverse=True)[0]
    max_days = max(popularity.values())
    log.info(popularity)
    data = []
    for country_code,day_count in popularity.iteritems():
        data.append( {'code': country_code, 'score': float(day_count)/float(max_days)} )
    return jsonify(
        videoId=video_id,
        mostPopular={'code':max_country, 'days':max_days},
        data=data
    )

if __name__ == "__main__":
    app.debug = True
    app.run()
    log.info("Started Server")