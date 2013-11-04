from __future__ import division

import ConfigParser
import logging
import math
import time
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
data = []
for n in range(1,8):
	num_topics = 25
	alpha = 32.0 / num_topics
	eta = 2.0**n / num_topics
	passes = 100
	p = 0
	for training, test in stats.get_cv_country_corpus(10):
		corpus, dictionary, doc_map = training
		tfidf = gensim.models.TfidfModel(corpus)
		corpus_tfidf = tfidf[corpus]
		lda = gensim.models.LdaModel(corpus_tfidf, id2word=dictionary, num_topics=num_topics, passes=passes, alpha=alpha, eta=eta)
		datum = {
			'topics': num_topics
			, 'alpha': alpha
			, 'eta': eta
			, 'passes': passes
			, 'perplexity': lda.bound(test[0])
		}
		data.append(datum)

print data

with open('output/validation-%d.csv' % (time.time()), 'wb') as f:
	f.write("Topics, Alpha, Eta, Perplexity\n")
	for row in sorted(data, key=lambda x: x['perplexity']):
		f.write("%s,%s,%s,%s\n" % (row['topics'], row['alpha'], row['eta'], row['perplexity']))
