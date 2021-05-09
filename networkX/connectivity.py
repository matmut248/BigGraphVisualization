import networkx as nx 
import sys



# in questo caso non viene preso il sottografo costituito dalla componente connessa più grande,
# quindi vengono considerati tutti i vertici di taglio (anche di componenti connesse diverse)
def connectivity_analisys(G):
    conn = nx.is_connected(G)
    print("il grafo G è connesso: " + str(conn))
    print("il grafo ha " + str(nx.number_of_nodes(G)) + " nodi e "+ str(nx.number_of_edges(G)) + " archi")
    if(conn==False):
        print("numero di componenti connesse " + str(nx.number_connected_components(G)))
        #G = G.subgraph(max(nx.connected_components(G), key=len)).copy()
        #print("prendo la componente connessa più grande (" + str(nx.number_of_nodes(G)) + " nodi e "+ str(nx.number_of_edges(G)) + " archi)")

def cv_ratio_old(cvG, cvKG):
    i = 0
    n = len(cvG)
    if(n == 0):
        return
    for cv in cvG:
        for cvk in cvKG:
            if (cv == cvk):
                i = i + 1
    ratio = i/n * 100
    print("sono rimasti " + str(i) + " vertici di taglio rispetto al grafo iniziale => " + str(ratio) + "%")

def cv_ratio(cvG, cvKG):
    i = len(set(cvG).intersection(cvKG))
    n = len(cvG)
    ratio = i/n * 100
    print("sono rimasti " + str(i) + " vertici di taglio rispetto al grafo iniziale => " + str(ratio) + "%")
