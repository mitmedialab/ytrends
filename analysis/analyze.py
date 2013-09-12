from operator import itemgetter
import sqlalchemy
import networkx as nx

import ytrends.locations as locs
import ytrends.graph as graph
from ytrends.db import *
import ytrends.stats as stats
import ytrends.weights as weights

# Constants for networkx bipartite graphs
TOP = 0
BOTTOM = 1

# Get video stats
print("Fetching stats")
day_count_by_country = stats.get_day_count_by_country()
count_by_loc = stats.get_count_by_loc()
videos = set(video_id for by_vid in count_by_loc.values() for video_id in by_vid.keys())

# set up the weighted association graph with all the countries
print("Constructing country graph")
C = nx.Graph()
for loc in locs.countries():
	name = loc.code
	if loc.code == '--':
		name = 'usa'
	C.add_node(name, type='country', name=loc.name.rstrip())
for source in count_by_loc.keys():
	s = source
	if s == '--':
		s = 'usa'
	for target in count_by_loc.keys():
		t = target
		if t == '--':
			t = 'usa'
		if source > target:
			continue
		weight, video_weights = weights.bhattacharyya(count_by_loc[source], count_by_loc[target], day_count_by_country[source], day_count_by_country[target])
		if weight > 0:
			C.add_edge(s, t, weight=1.0/weight)
		
# Find Centrality		
print("Calculating betweenness centrality for country graph")
results = nx.betweenness_centrality(C, weight="weight")
nx.set_node_attributes(C, 'betweenness_centrality', results)
#print("Calculating eigenvector centrality for country graph")
#results = nx.eigenvector_centrality(C, weight="weight")
#nx.set_node_attributes(C, 'eigenvector_centrality', results)
with open('output/countries.csv', 'wb') as f:
	f.write("Code, Name, Betweenness Centrality\n")
	for node in sorted(C.nodes(data=True), key=lambda k: k[1]['betweenness_centrality'], reverse=True):
		f.write("%s, %s, %f\n" % (node[0], node[1]['name'], node[1]['betweenness_centrality']))
		
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
