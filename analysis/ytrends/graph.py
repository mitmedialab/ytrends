import networkx as nx
from networkx.algorithms import bipartite

class BiGraph(nx.Graph):
    def to_unweighted(self):
        copy = self.copy()
        for u, v in copy.edges():
            try:
                del copy.edge[u][v]['weight']
            except KeyError:
                pass
        return copy
    
    def top_nodes(self, data=False):
        return set(n for n,d in self.nodes(data=True) if d['bipartite']==0)
            
    
    def bottom_nodes(self, data=False):
        return set(n for n,d in self.nodes(data=True) if d['bipartite']==1)
