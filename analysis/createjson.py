from __future__ import division

import math
from operator import itemgetter
import sys
import json
import networkx as nx

import ytrends.locations as locs
import ytrends.graph as graph
import ytrends.stats
import ytrends.weights as weights

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
jaccard = {}
bhattacharyya = {}
count = {}
for source in count_by_loc.keys():
    s = source
    if source == '--':
        s = 'usa'
    for target in count_by_loc.keys():
        t = target
        if target == '--':
            t = 'usa'
        if source == target:
            continue
        # Caclulate percentage
        percentage = weights.percentage(count_by_loc[source], count_by_loc[target])
        # Calculate intersection and union
        intersection = set(count_by_loc[source].keys()).\
            intersection(set(count_by_loc[target].keys()))
        union = set(count_by_loc[source].keys()).\
            union(set(count_by_loc[target].keys()))
        
        # Calculate naive count of videos in common
        source_res = count.get(s, {})
        weight = len(intersection)
        intersection_weights = [(v, min(count_by_loc[source][v], count_by_loc[target][v])) for v in intersection]
        if weight > 0:
            source_res[t] = {
                'p': float(len(intersection)) / float(len(count_by_loc[source])),
                'w': weight,
                'v': [w[0] for w in sorted([w for w in intersection_weights if viewable.get(w[0], False)], key=lambda x: x[1], reverse=True)][0:VIDEO_COUNT],
                'u': [w[0] for w in sorted([w for w in intersection_weights if viewable.get(w[0], False)], key=lambda x: x[1]*idf[x[0]], reverse=True)][0:VIDEO_COUNT]
            }
            count[s] = source_res
        
        # Calculate jaccard coefficient |A intersect B| / |A union B|
        intersection_weights = [(v, min(count_by_loc[source][v], count_by_loc[target][v])) for v in intersection]
        union_weights = [(v, max(count_by_loc[source].get(v, 0), count_by_loc[target].get(v, 0))) for v in union]
        normalization = 1 / sum([w[1] for w in union_weights])
        weight = sum([w[1] for w in intersection_weights]) * normalization
        source_res = jaccard.get(s, {})
        if weight > 0:
            source_res[t] = {
                'p': float(len(intersection)) / float(len(count_by_loc[source])),
                'w': weight,
                'v': [w[0] for w in sorted([w for w in intersection_weights if viewable.get(w[0], False)], key=lambda x: x[1], reverse=True)][0:VIDEO_COUNT],
                'u': [w[0] for w in sorted([w for w in intersection_weights if viewable.get(w[0], False)], key=lambda x: x[1]*idf[x[0]], reverse=True)][0:VIDEO_COUNT]
            }
            jaccard[s] = source_res
            
        # Calculate bhattacharyya coefficient
        weight, video_weights = weights.bhattacharyya(count_by_loc[source], count_by_loc[target], day_count_by_country[source], day_count_by_country[target])
        if weight > 0:
            source_res = bhattacharyya.get(s, {})
            source_res[t] = {
                'p': percentage,
                'w': weight,
                'v': [w[0] for w in sorted([w for w in video_weights if viewable.get(w[0], False)], key=lambda x: x[1], reverse=True)][0:VIDEO_COUNT],
                'u': [w[0] for w in sorted([w for w in video_weights if viewable.get(w[0], False)], key=lambda x: x[1]*idf[x[0]], reverse=True)][0:VIDEO_COUNT]
            }
            bhattacharyya[s] = source_res

def write_results (results, name):
    # Convert to backbone-friendly list
    result_list = []
    for src, src_data in results.iteritems():
        s = src
        if s == 'usa':
            s = "--"
        result = {
            'days': day_count_by_country[s],
            'code': src,
            'videos': sorted([v for v in count_by_loc[s].iteritems() if viewable.get(v[0], False)], key=lambda (k,v): (v,k), reverse=True)[0:VIDEO_COUNT],
            'unique': sorted([v for v in count_by_loc[s].iteritems() if viewable.get(v[0], False)], key=lambda (k,v): (v*idf[k],k), reverse=True)[0:VIDEO_COUNT],
            'friends': []
        }
        for tgt, tgt_data in src_data.iteritems():
            friend = {
                'code': tgt,
                'percent': str(round( tgt_data['p'], 2)),
                'weight': tgt_data['w'],
                'videos': tgt_data['v'],
                'unique': tgt_data['u'],
            }
            result['friends'].append(friend)
        result_list.append(result)
    
    with open('output/weights-%s.json' % (name), 'wb') as f:
        f.write(json.dumps(result_list))
        
write_results(count, 'count')
write_results(jaccard, 'jaccard')
write_results(bhattacharyya, 'bhattacharyya')
