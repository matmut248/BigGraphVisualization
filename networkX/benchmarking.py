import time
import timeit
import networkx as nx
import sys
import connectivity as conn


def bench():
    start = timeit.default_timer()
    G = nx.read_gml("gml/youtube.gml", label="id")
    G = nx.to_undirected(G)
    time = timeit.default_timer() - start
    print("read_gml() --> " + str(time))


    start = timeit.default_timer()
    cv = list(nx.articulation_points(G))
    time = timeit.default_timer() - start
    print("articulation_points() --> " + str(time))

    g = nx.Graph(G)
    g.remove_edges_from(nx.selfloop_edges(g))
    start = timeit.default_timer()
    kG = nx.k_core(g,2)
    time = timeit.default_timer() - start
    print("k_core() --> " + str(time))


    cvK = list(nx.articulation_points(kG))
   
    
    start = timeit.default_timer()
    conn.cv_ratio(cv, cvK)
    time = timeit.default_timer() - start
    print("cv_ratio --> " + str(time))

bench()