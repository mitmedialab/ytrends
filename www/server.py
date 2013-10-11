import sys, os, logging, ConfigParser, operator
from flask import Flask, render_template, json, jsonify
import sqlalchemy, sqlalchemy.orm
from operator import itemgetter

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
def checkout_listener(dbapi_con, con_record, con_proxy):
    # For checking mysql connection freshness, see:
    # http://stackoverflow.com/questions/18054224/python-sqlalchemy-mysql-server-has-gone-away
    try:
        try:
            dbapi_con.ping(False)
        except TypeError:
            dbapi_con.ping()
    except dbapi_con.OperationalError as exc:
        if exc.args[0] in (2006, 2013, 2014, 2045, 2055):
            raise sqlalchemy.exc.DisconnectionError()
        else:
            raise
stats_url = "mysql+mysqldb://%s:%s@%s/%s?charset=utf8" % (
    config.get('db','user')
    , config.get('db','pass')
    , config.get('db','host')
    , config.get('db','name')
)
stats_engine = sqlalchemy.create_engine(stats_url, echo=True, pool_size=100, pool_recycle=3600)
sqlalchemy.event.listen(stats_engine, 'checkout', checkout_listener)
app = Flask(__name__)

@app.route("/")
def index():
    return render_template("base.html")

@app.route("/video/<video_id>/popularity.json")
def video_popularity(video_id):
    stats = ytrends.stats.Stats(stats_engine)
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
    attention_data = []
    for date, count in stats.get_video_attention_by_day(video_id).iteritems():
        attention_data.append( {'date': date, 'count': count})
    attention_data = sorted(attention_data, key=itemgetter('date')) 
    return jsonify(
        videoId=video_id,
        mostPopularCountry={'code':max_country, 'days':max_days},
        countryScores=data,
        attentionByDate=attention_data
    )

if __name__ == "__main__":
    app.debug = True
    app.run()
    log.info("Started Server")
