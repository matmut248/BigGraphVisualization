import networkx as nx

#edge1 ha 5 cv e ne rimane solo uno nel 2-core
edges1 = [(0,1),(0,2),(0,3),(0,4),(0,5),(0,6),
            (1,2),(1,6),(1,10),(2,6),(2,7),
            (3,4),(3,5),(3,8),(4,5),(4,9),]
#edge2 ha due componenti connesse nel 3-core
edges2 = [(1,2),(1,3),(1,4),(2,3),(2,4),(3,4),
            (5,6),(5,7),(5,8),(6,7),(6,8),(7,8),
            (0,1),(0,5)]
#edge3 e edge4 hanno due componenti connesse
edges3 = [(0,1),(0,2),(1,2),(3,4),(3,5),(4,5)]
edges4 = [(0,1),(2,3)]
#edge5 non ha vertici di taglio
edges5 = [(0,1),(0,2),(1,2)]


def newG():
    G = nx.Graph(edges1)
    return G
