from operator import itemgetter
import sqlalchemy
import networkx as nx
import ytrends.locations as locs
from ytrends.db import *

# init the connection to the database
engine = sqlalchemy.create_engine("sqlite:///db/development.sqlite3", echo=True)
Session = sqlalchemy.orm.sessionmaker(bind=engine)
session = Session()

# set up the graph with all the countries
G = nx.Graph()
for loc in locs.countries():
	G.add_node(loc.code, type='country', name=loc.name)

# pull the data we want 
ranks = session.query(Rank.video_id, Rank.loc, sqlalchemy.sql.func.count('*').label('entries')).\
	filter(sqlalchemy.not_(Rank.loc.like('%all_%'))).\
    filter_by(source='view').\
    group_by(Rank.video_id, Rank.loc)

# load up the graph
for rank in ranks:
	G.add_node(rank[0], type='video') # make sure the video_id is in the graph
	G.add_edge(rank[0], rank[1], {'entries':rank[2]} ) # link the video to the country with a weight

print "Graph has "+str(G.number_of_nodes())+" nodes, "+str(G.number_of_edges())+" edges"

# an example computation
dc = nx.degree_centrality(G)
nx.set_node_attributes(G,'degree_cent', dc)
degcent_sorted = sorted(dc.items(), key=itemgetter(1),reverse=True)
for key,value in degcent_sorted[0:10]:
	print "Highest Degree Centrality:", locs.get(key), value

