import graph_tool.all as gt
import timeit

core_range = range(2, 6)


def __init__():
    print("\n######### LETTURA DEL GRAFO #########")
    G = gt.load_graph("../gml/youtube.gml")

    # creo una vpmap che mantiene gli id dei vertici e degli archi
    # per accedere all'id di v : G.vp["vertex id"][v]
    make_properties(G)

    print("\n######### PREPROCESSAMENTO #########")
    preprocessing(G)

    print("\n######### ANALISI DEL GRAFO INIZIALE #########")
    connectivity_analisys(G)

    kval = gt.kcore_decomposition(G)

    k_core_iter(G, kval)


def make_properties(G):
    vprop_id = G.new_vp("int")
    for v in G.vertices():
        vprop_id[v] = int(v)
    # eprop_id = G.new_ep("int")
    # for e in G.edges():
    #    eprop_id[e] = int(e)

    G.vp["vertex id"] = vprop_id
    # G.ep["edge id"] = eprop_id


def cv_ratio(G, kG):
    tot = 0.0  # il numero totale di cv nel grafo iniziale
    counter = 0.0  # il numero totale di cv nel k-core

    _, cvG, _ = gt.label_biconnected_components(G)
    _, cvKG, _ = gt.label_biconnected_components(kG)

    for v in G.vertices():
        if (cvG[v] == 1):
            tot += 1
    for v in kG.vertices():
        if (cvG[v] == 1 and cvKG[v] == 1):
            counter += 1
    ratio = counter / tot * 100
    print("Sono rimasti " + str(int(counter)) + "/" + str(
        int(tot)) + " vertici di taglio rispetto al grafo iniziale (" + str(ratio) + "%)")


# analisi iterativa dei k-core al variare di k
def k_core_iter(G, kval):
    kG = gt.Graph(G)
    for i in core_range:
        print("\n######### ANALISI DEL " + str(i) + "-CORE #########")

        kG = k_core(kG, kval, i)
        if (len(list(kG.vertices())) == 0):
            print("Non ci sono più nodi")
            return

        connectivity_analisys(kG)
        cv_ratio(G, kG)


# sottografo rispetto al livello di coreness
# ottenuto filtrando il grafo con una vpm
def k_core(G, kval, k):
    vpCore = G.new_vp("bool")
    for v in G.vertices():
        if (kval[v] >= k):
            vpCore[v] = True
    kG = gt.GraphView(G, vpCore)
    return kG


def preprocessing(G):
    gt.remove_self_loops(G)
    G.set_directed(False)


def connectivity_analisys(G):
    print("il grafo ha " + str(G.num_vertices()) + " nodi e " + str(G.num_edges()) + " archi")

    # hist è l'istogramma: array dove l'indice i-esimo corrisponde al numero di nodi
    # contenuti nella componente i-esima
    comp, hist = gt.label_components(G)
    # print(hist)
    # print(comp.a)
    if (len(hist) == 1):
        print("il grafo G è connesso: TRUE")
    else:
        print("il grafo G è connesso: FALSE")
    print("numero di componenti connesse: " + str(len(hist)))

    bcomp, cv, num = gt.label_biconnected_components(G)
    print("numero di componenti biconnesse: " + str(len(num)))
    print("numero di vertici di taglio: " + str(len(list(filter(lambda x: (x == 1), cv)))))


start = timeit.default_timer()
__init__()
time = timeit.default_timer() - start
print("\nTEMPO TOTALE DI ESECUZIONE --> " + str(time))


def verifica_id_graphView():
    G = gt.Graph()
    G.add_vertex(6)
    vpCore = G.new_vp("bool")
    vpCore[1] = True
    vpCore[3] = True
    vpCore[5] = True

    G2 = gt.GraphView(G, vpCore)
    print("num vertici:     G = " + str(G.num_vertices()) + "  G2 = " + str(G2.num_vertices()))
    print("vertici di G:")
    for v in G.vertices():
        print(v)

    print("vertici di G2:")
    for v in G2.vertices():
        print(v)

# verifica_id_graphView()
