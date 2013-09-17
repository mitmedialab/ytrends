import sys, os, logging, ConfigParser, operator
from flask import Flask, render_template, json, jsonify
import sqlalchemy, sqlalchemy.orm

parentdir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0,os.path.join(parentdir,'analysis') )
import ytrends.stats

# constants
CONFIG_FILENAME = 'app.config'

# setup logging
logging.basicConfig(filename='server.log',level=logging.DEBUG)
log = logging.getLogger('server')
log.info("---------------------------------------------------------------------------")

# read in app config
config = ConfigParser.ConfigParser()
config.read(CONFIG_FILENAME)

# init the connection to the database
stats = ytrends.stats.Stats("sqlite:///"+config.get('db','path'), False)
log.info("Connected to db at "+config.get('db','path'))

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("base.html")

@app.route("/video/<video_id>/popularity.json")
def video_popularity(video_id):
    popularity = stats.get_video_popularity(video_id)
    max_country = sorted(popularity, key=popularity.get, reverse=True)[0]
    max_days = max(popularity.values())
    log.info(popularity)
    data = []
    for country_code,day_count in popularity.iteritems():
        if(country_code=='--'):
            country_code='usa'
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