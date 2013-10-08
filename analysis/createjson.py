from __future__ import division

import ConfigParser
import json
import math
from operator import itemgetter
import sys

import networkx as nx
import sqlalchemy

import ytrends.locations as locs
import ytrends.graph as graph
import ytrends.stats
import ytrends.weights

VIDEO_COUNT = 10       # will output this many of the top N videos for everything

# read in app config
CONFIG_FILENAME = 'app.config'
MAX_VIDEOS_TO_PROCESS = 100
config = ConfigParser.ConfigParser()
config.read(CONFIG_FILENAME)

def write_results (stats, results, name):
    count_by_loc = stats.get_count_by_loc()
    idf = stats.get_idf()
    day_count_by_country = stats.get_day_count_by_country()
    viewable = stats.get_viewable()
    # Convert to backbone-friendly list
    result_list = []
    for src, src_data in results.iteritems():
        result = {
            'days': day_count_by_country[src],
            'code': src,
            'videos': sorted([v for v in count_by_loc[src].iteritems() if viewable.get(v[0], False)], key=lambda (k,v): (v,k), reverse=True)[0:VIDEO_COUNT],
            'unique': sorted([v for v in count_by_loc[src].iteritems() if viewable.get(v[0], False)], key=lambda (k,v): (v*idf[k],k), reverse=True)[0:VIDEO_COUNT],
            'friends': []
        }
        for tgt, tgt_data in src_data.iteritems():
            friend = {
                'code': tgt,
                'percent': str(round(weights.get_percentage(src, tgt), 2)),
                'weight': tgt_data[0],
                'videos': [w[0] for w in sorted([w for w in tgt_data[1] if viewable.get(w[0], False)], key=lambda x: x[1], reverse=True)][0:VIDEO_COUNT],
                'unique': [w[0] for w in sorted([w for w in tgt_data[1] if viewable.get(w[0], False)], key=lambda x: x[1]*idf[x[0]], reverse=True)][0:VIDEO_COUNT]
            }
            result['friends'].append(friend)
        result_list.append(result)
    
    with open('output/weights-%s.json' % (name), 'wb') as f:
        f.write(json.dumps(result_list))

# Create database engine
stats_url = "mysql+mysqldb://%s:%s@%s/%s?charset=utf8" % (
    config.get('db','user')
    , config.get('db','pass')
    , config.get('db','host')
    , config.get('db','name')
)
stats_engine = sqlalchemy.create_engine(stats_url, echo=True, pool_size=100, pool_recycle=3600)

periods = [0, 7, 30]
for period in periods:
    # Get video stats
    stats = ytrends.stats.Stats(stats_engine, period)
    
    # Create and write results
    weights = ytrends.weights.Weight(stats)
    bhattacharyya = weights.get_weights(weights.bhattacharyya)
    if period > 0:
        write_results(stats, bhattacharyya, 'bhattacharyya-%d' % (period))
    else:
        write_results(stats, bhattacharyya, 'bhattacharyya')
