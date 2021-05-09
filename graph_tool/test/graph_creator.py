import graph_tool.all as gt


def connected_simple_graph():
    G = gt.Graph()
    G.set_directed(False)
    G.add_vertex(4)
    G.add_edge_list([(0, 1), (0, 2), (0, 3)])
    return G


def not_connected_graph():
    G = gt.Graph()
    G.set_directed(False)
    G.add_vertex(4)
    G.add_edge_list([(0, 1), (2, 3)])
    return G