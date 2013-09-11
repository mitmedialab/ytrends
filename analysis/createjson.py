from __future__ import division

import math
from operator import itemgetter
import sys
import json
import sqlalchemy
import networkx as nx
import ytrends.locations as locs
import ytrends.graph as graph
from ytrends.db import *

# init the connection to the database
engine = sqlalchemy.create_engine("sqlite:///db/development.sqlite3", echo=True)
Session = sqlalchemy.orm.sessionmaker(bind=engine)
session = Session()

# Query ranks for all days per country
country_days = session.query(Rank.loc, sqlalchemy.sql.func.count(sqlalchemy.sql.func.distinct(Rank.date))).\
    filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
    filter_by(source='view').\
    group_by(Rank.loc)
day_count_by_country = {}
for country_day in country_days:
    s = country_day[0]
    day_count_by_country[s] = country_day[1]

# Query ranks for all videos
ranks = session.query(Rank.video_id, Rank.loc, sqlalchemy.sql.func.count('*').label('entries')).\
    filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
    filter_by(source='view').\
    group_by(Rank.video_id, Rank.loc)

# Create dict with counts (location -> video id -> count)
count_by_loc = {}
for rank in ranks:
    videos = count_by_loc.get(rank[1], {})
    videos[rank[0]] = rank[2]
    count_by_loc[rank[1]] = videos

# Calculate inverse document frequency for videos
videos = set(video_id for by_vid in count_by_loc.values() for video_id in by_vid.keys())
locs = set(count_by_loc.keys())
idf = dict((video_id, math.log(len(locs) / sum([1 for l in locs if count_by_loc[l].get(video_id, 0) > 0]))) for video_id in videos)

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
                'v': [w[0] for w in sorted(intersection_weights, key=lambda x: x[1], reverse=True)][0:10],
                'u': [w[0] for w in sorted(intersection_weights, key=lambda x: x[1]*idf[x[0]], reverse=True)][0:10]
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
                'v': [w[0] for w in sorted(intersection_weights, key=lambda x: x[1], reverse=True)][0:10],
                'u': [w[0] for w in sorted(intersection_weights, key=lambda x: x[1]*idf[x[0]], reverse=True)][0:10]
            }
            jaccard[s] = source_res
            
        # Calculate bhattacharyya coefficient
        normalization = 1 / 10 # 10 videos per day
        intersection_weights = [
            (v, math.sqrt(
                count_by_loc[source][v]/day_count_by_country[source]
                * count_by_loc[target][v]/day_count_by_country[target])
            ) for v in intersection
        ]
        weight = normalization * sum(w[1] for w in intersection_weights)
        source_res = bhattacharyya.get(s, {})
        if weight > 0:
            source_res[t] = {
                'p': float(len(intersection)) / float(len(count_by_loc[source])),
                'w': weight,
                'v': [w[0] for w in sorted(intersection_weights, key=lambda x: x[1], reverse=True)][0:10],
                'u': [w[0] for w in sorted(intersection_weights, key=lambda x: x[1]*idf[x[0]], reverse=True)][0:10]
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
            'videos': sorted(count_by_loc[s].iteritems(), key=lambda (k,v): (v,k), reverse=True)[0:20],
            'unique': sorted(count_by_loc[s].iteritems(), key=lambda (k,v): (v*idf[k],k), reverse=True)[0:20],
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
