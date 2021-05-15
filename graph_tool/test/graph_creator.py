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

def graph_for_bc_testing():
    G = gt.Graph()
    G.set_directed(False)
    G.add_vertex(5)
    G.add_edge_list([(0, 1), (0, 2), (0, 3), (0, 4), (3, 4)])
    return G

def graph_for_bc_testing_2():
    G = gt.Graph()
    G.set_directed(False)
    G.add_vertex(6)
    G.add_edge_list([(0, 1), (0, 2), (0, 3), (0, 4), (3, 4), (4,5)])
    return G

def graph_for_bc_testing_3():
    G = gt.Graph()
    G.set_directed(False)
    G.add_vertex(5)
    G.add_edge_list([(0, 1), (1, 2), (2, 3), (3, 4)])
    return G