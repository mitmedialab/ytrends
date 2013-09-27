from __future__ import division

import ConfigParser
import datetime
import math
import networkx as nx
from operator import itemgetter

import sqlalchemy

import ytrends.locations as locs
import ytrends.graph as graph
from ytrends.db import *
import ytrends.stats
import ytrends.weights

# Constants for networkx bipartite graphs
TOP = 0
BOTTOM = 1

# read in app config
CONFIG_FILENAME = 'app.config'
MAX_VIDEOS_TO_PROCESS = 100
config = ConfigParser.ConfigParser()
config.read(CONFIG_FILENAME)

# Get video stats
print("Fetching stats")
stats_url = "mysql+mysqldb://%s:%s@%s/%s?charset=utf8" % (
    config.get('db','user')
    , config.get('db','pass')
    , config.get('db','host')
    , config.get('db','name')
)
stats_engine = sqlalchemy.create_engine(stats_url, echo=True, pool_size=100, pool_recycle=3600)
stats = ytrends.stats.Stats(stats_engine)
weights = ytrends.weights.Weight(stats)
day_count_by_country = stats.get_day_count_by_country()
count_by_loc = stats.get_count_by_loc()
videos = set(video_id for by_vid in count_by_loc.values() for video_id in by_vid.keys())

# set up the weighted association graph with all the countries
print("Constructing country graph")
code_to_name = {}
C = nx.Graph()
for loc in locs.countries():
	name = loc.code
	if loc.code == '--':
		name = 'usa'
	code_to_name[name] = loc.name.rstrip()
	C.add_node(name, type='country', name=loc.name.rstrip())
for source in count_by_loc.keys():
	for target in count_by_loc.keys():
		if source >= target:
			continue
		weight, video_weights = weights.bhattacharyya(source, target)
		if weight > 0:
			C.add_edge(source, target, weight=weight, resistance=1/weight)
			
# Find shortest paths
def write_shortest_paths(path_code):
	path_code = 'are'
	endpoints = {}
	nodes = C.nodes()
	for source in nodes:
		for target in nodes:
			if target >= source or not C.get_edge_data(source, target):
				continue
			paths = nx.all_shortest_paths(C, source, target, weight='resistance')
			for path in paths:
				if len(path) > 2 and path_code in path[1:-1]:
					distances = [C.get_edge_data(p[0], p[1])['resistance'] for p in zip(path, path[1:])]
					length = sum(distances)
					direct = C.get_edge_data(source, target)['resistance']
					endpoints[source] = endpoints.get(source,0) + 1
					endpoints[target] = endpoints.get(target,0) + 1
	with open('output/%s.csv' % path_code, 'wb') as f:
		f.write("Endpoint, Paths using %s as bridge\n" % code_to_name[path_code])
		for k,v in endpoints.iteritems():
			f.write("%s, %d\n" % (code_to_name[k], v))

# Find video spreads
spread_ids = {
	'CevxZvSJLk8': 'Katy Perry - Roar (Official)'
	, 'ahy3uRzRG9w': 'Hangouts: Conversations that last, with the people you love'
	, 'ttdU19Kwce8': 'P-Square - Personally'
}
for video_id, title in spread_ids.iteritems():
	with open('output/%s-%s.csv' % (video_id, title), 'wb') as f:
		spread = stats.get_spread(video_id)
		# Calculate date range
		first_date = min([min(spread[loc].keys()) for loc in spread.keys()])
		last_date = max([max(spread[loc].keys()) for loc in spread.keys()])
		delta = last_date - first_date
		days = delta.days + 1
		print days
		dates = [first_date + datetime.timedelta(n) for n in range(days)]
		print dates
		# Write headers
		f.write('Country,')
		f.write("%s\n" % ','.join([date.strftime('%Y-%m-%d') for date in dates]))
		# Write data
		rows = {}
		sort_ranks = []
		for loc, rank_dict in spread.iteritems():
			# Build output string
			ranks = [str(rank_dict.get(date, '')) for date in dates]
			rows[loc] = '%s,%s\n' % (code_to_name[loc], ','.join(ranks))
			# Create feature for sorting
			trend_days = [min(1, rank_dict.get(date, 0)) for date in dates]
			first_index = trend_days.index(1)
			last_index = len(trend_days) - 1 - list(reversed(trend_days)).index(1)
			sort_ranks.append((loc, (first_index, last_index)))
		for loc, feature in sorted(sort_ranks, key=lambda x: x[1]):
			f.write(rows[loc])

# Find Centrality

print("Calculating shortest-path betweenness centrality for country graph")
results = nx.betweenness_centrality(C, weight="resistance")
nx.set_node_attributes(C, 'betweenness_centrality', results)

print("Calculating random-walk betweenness centrality for country graph")
results = nx.current_flow_betweenness_centrality(C, weight="weight")
nx.set_node_attributes(C, 'random_walk_betweenness_centrality', results)
#print("Calculating eigenvector centrality for country graph")
#results = nx.eigenvector_centrality(C, weight="weight")
#nx.set_node_attributes(C, 'eigenvector_centrality', results)
with open('output/countries.csv', 'wb') as f:
	f.write("Code, Name, Shortest Path Betweenness, Random Walk Betweenness\n")
	for node in sorted(C.nodes(data=True), key=lambda k: k[1]['betweenness_centrality'], reverse=True):
		f.write("%s, %s, %f, %f\n" % (node[0], node[1]['name'], node[1]['betweenness_centrality'], node[1]['random_walk_betweenness_centrality']))
		
# Create bipartite graph
print("Creating bipartite country-video graph")
G = graph.BiGraph()
for loc in locs.countries():
	name = loc.code
	if loc.code == '--':
		name = 'usa'
	G.add_node(name, type='country', bipartite=TOP, name=loc.name.rstrip())
for video_id in videos:
	G.add_node(video_id, type='video', bipartite=BOTTOM, name=loc.name)
for source in count_by_loc.keys():
	s = source
	if s == '--':
		s = 'usa'
	for video_id in count_by_loc[source].keys():
		G.add_edge(s, video_id, {'weight':count_by_loc[source][video_id]} ) # link the video to the country with a weight
print "Bipartite graph has "+str(G.number_of_nodes())+" nodes, "+str(G.number_of_edges())+" edges"
print "Bipartite graph has %d countries and %d videos." % (len(G.top_nodes()), len(G.bottom_nodes()))

#print("Calculating betweenness centrality")
#dc = nx.algorithms.bipartite.betweenness_centrality(G, G.top_nodes())
#nx.set_node_attributes(G,'bi_betweenness_cent', dc)

# an example projection
#vid_graph = G.left_projected_graph()
#loc_graph = G.right_projected_graph()

# Write all three graphs
print("Writing graphml")
nx.write_graphml(G, 'output/video_country_weighted.graphml')
nx.write_graphml(C, 'output/country_weighted.graphml')
#nx.write_graphml(vid_graph, 'output/videos.graphml')
#nx.write_graphml(loc_graph, 'output/countries.graphml')
