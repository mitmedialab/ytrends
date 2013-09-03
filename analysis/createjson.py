from operator import itemgetter
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

# Query ranks for all videos
ranks = session.query(Rank.video_id, Rank.loc, sqlalchemy.sql.func.count('*').label('entries')).\
    filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
    filter_by(source='view').\
    group_by(Rank.video_id, Rank.loc)

count_by_loc = {}
for rank in ranks:
    videos = count_by_loc.get(rank[1], {})
    videos[rank[0]] = rank[2]
    count_by_loc[rank[1]] = videos

# Create result dict (for speed)
results = {}
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
        # Get distance
        videos = set(count_by_loc[source].keys()).\
            intersection(set(count_by_loc[target].keys()))
        weights = [(v, min(count_by_loc[source][v], count_by_loc[target][v])) for v in videos]
        source_res = results.get(s, {})
        weight = sum([w[1] for w in weights])
        if weight > 0:
            source_res[t] = {
                'w': weight,
                'v': [w[0] for w in sorted(weights, key=lambda x: x[1], reverse=True)][0:10]
            }
            results[s] = source_res

# Convert to backbone-friendly list
result_list = []
for src, src_data in results.iteritems():
    result = {
        'code': src,
        'friends': []
    }
    for tgt, tgt_data in src_data.iteritems():
        friend = {
            'code': tgt,
            'weight': tgt_data['w'],
            'videos': tgt_data['v']
        }
        result['friends'].append(friend)
    result_list.append(result)

with open('output/weights-mincut.json', 'wb') as f:
    f.write(json.dumps(result_list))
