from operator import itemgetter
import sqlalchemy
import networkx as nx
import ytrends.locations as locs
import ytrends.graph as graph
from ytrends.db import *

# init the connection to the database
engine = sqlalchemy.create_engine("sqlite:///db/development.sqlite3", echo=True)
Session = sqlalchemy.orm.sessionmaker(bind=engine)
session = Session()

# pull the data we want 
ranks = session.query(Rank.video_id, Rank.loc, sqlalchemy.sql.func.count('*').label('entries')).\
	filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
    filter_by(source='view').\
    group_by(Rank.video_id, Rank.loc)

# set up the weighted association graph with all the countries
G = graph.BiGraph()
for loc in locs.countries():
	G.add_node(loc.code, type='country', name=loc.name)

# load up the graph
for rank in ranks:
	G.add_node(rank[0], type='video') # make sure the video_id is in the graph
	G.add_edge(rank[0], rank[1], {'weight':rank[2]} ) # link the video to the country with a weight

print "Graph has "+str(G.number_of_nodes())+" nodes, "+str(G.number_of_edges())+" edges"

# an example computation
dc = nx.degree_centrality(G)
nx.set_node_attributes(G,'degree_cent', dc)
vids_sorted = sorted(G.left_nodes(True), key=lambda k: k[1]['degree_cent'], reverse=True)
locs_sorted = sorted(G.right_nodes(True), key=lambda k: k[1]['degree_cent'], reverse=True)
for loc in locs_sorted[0:10]:
	print "Highest Degree Centrality: %s %f" % (locs.get(loc[0]), loc[1]['degree_cent'])
for vid in vids_sorted[0:10]:
	print "Highest Degree Centrality: %s %f" % (vid[0], vid[1]['degree_cent'])

# an example projection
vid_graph = G.left_projected_graph()
loc_graph = G.right_projected_graph()

# Write all three graphs
nx.write_graphml(G, 'output/video_country_weighted.graphml')
nx.write_graphml(vid_graph, 'output/videos.graphml')
nx.write_graphml(loc_graph, 'output/countries.graphml')
