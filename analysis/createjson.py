from __future__ import division

import math
from operator import itemgetter
import sys
import json
import networkx as nx

import ytrends.locations as locs
import ytrends.graph as graph
import ytrends.stats
import ytrends.weights

VIDEO_COUNT = 10       # will output this many of the top N videos for everything

# Get video stats
stats = ytrends.stats.Stats()
day_count_by_country = stats.get_day_count_by_country()
count_by_loc = stats.get_count_by_loc()
viewable = stats.get_viewable()

# Calculate inverse document frequency for videos
videos = stats.get_videos()
locs = stats.get_locs()
idf = stats.get_idf()

# Create result dict (for speed)
weights = ytrends.weights.Weight(stats)
jaccard = weights.get_weights(weights.jaccard)
bhattacharyya = weights.get_weights(weights.bhattacharyya)
count = weights.get_weights(weights.count)

def write_results (results, name):
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
        
write_results(count, 'count')
write_results(jaccard, 'jaccard')
write_results(bhattacharyya, 'bhattacharyya')
