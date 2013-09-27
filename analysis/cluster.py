from __future__ import division
import ConfigParser
import logging
import math
from operator import itemgetter

import gensim
import sqlalchemy

import ytrends.clusterstats

# read in app config
CONFIG_FILENAME = 'app.config'
MAX_VIDEOS_TO_PROCESS = 100
config = ConfigParser.ConfigParser()
config.read(CONFIG_FILENAME)

# Enable logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

# Get video stats
print("Fetching stats")
stats_url = "mysql+mysqldb://%s:%s@%s/%s?charset=utf8" % (
    config.get('db','user')
    , config.get('db','pass')
    , config.get('db','host')
    , config.get('db','name')
)
stats_engine = sqlalchemy.create_engine(stats_url, echo=True, pool_size=100, pool_recycle=3600)
stats = ytrends.clusterstats.ClusterStats(stats_engine)
dictionary, corpus = stats.get_corpus()
tfidf = gensim.models.TfidfModel(corpus)
corpus_tfidf = tfidf[corpus]
lsi = gensim.models.LsiModel(corpus_tfidf, id2word=dictionary, num_topics=3)
#corpus_lsi = lsi[corpus_tfidf]
lsi.print_topics(3)