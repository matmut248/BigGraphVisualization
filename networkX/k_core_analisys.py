import networkx as nx 
import sys

def k_core_iterative(G):
    i=1
    while nx.number_of_nodes(nx.k_core(G, i)) > 0 and i<=5:
        print("ANALISI DEL " + str(i) + "-CORE DI G:")
        k_core_analisys(nx.k_core(G, i))
        i = i+1

def k_core_analisys(G):
    #COMPONENTI CONNESSE
    conn = nx.is_connected(G)
    print("il grafo G è connesso: " + str(conn))
    if(conn==False):
        print("numero di componenti connesse " + str(nx.number_connected_components(G)))

    #VERTICI DI TAGLIO
    cv = list(nx.articulation_points(G))
    print("numero di vertici di taglio: " + str(len(cv)))

    return cv




