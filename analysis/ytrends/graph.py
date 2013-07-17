import networkx as nx
from networkx.algorithms import bipartite

class BiGraph(nx.Graph):
    def __init__(self):
        self.left_set = []
        self.right_set = []
        super(BiGraph, self).__init__(self)

    def to_unweighted(self):
        copy = self.copy()
        for u, v in copy.edges():
            try:
                del copy.edge[u][v]['weight']
            except KeyError:
                pass
        return copy
    
    def add_edge(self, u, v, attr_dict=None, **attr):
        if not u in self.left_set:
            self.left_set.append(u)
        if not v in self.right_set:
            self.right_set.append(v)
        super(BiGraph, self).add_edge(u, v, attr_dict, **attr)
        
    def degree_centrality(self):
        return bipartite.degree_centrality(self, self.left_set)

    def left_nodes(self, data=False):
        if data:
            return [(n, self.node[n]) for n in self.left_set]
        return self.left_set
    
    def right_nodes(self, data=False):
        if data:
            return [(n, self.node[n]) for n in self.right_set]
        return self.right_set
    
    def left_projected_graph(self):
        return bipartite.projected_graph(self, self.left_set)
    
    def right_projected_graph(self):
        return bipartite.projected_graph(self, self.right_set)
    
    def left_weighted_projected_graph(self):
        return bipartite.weighted_projected_graph(self, self.left_set)
    
    def right_weighted_projected_graph(self):
        return bipartite.weighted_projected_graph(self, self.right_set)
    