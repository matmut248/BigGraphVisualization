import graph_tool.all as gt
import timeit

core_range = range(2, 6)


def __init__():
    print("\n######### LETTURA DEL GRAFO #########")
    G = gt.load_graph("../gml/webGoogle.gml")
    cv_map_iterative(G)
    # creo una vpmap che mantiene gli id dei vertici e degli archi
    # per accedere all'id di v : G.vp["vertex id"][v]
    make_properties(G)

    print("\n######### PREPROCESSAMENTO #########")
    preprocessing(G)

    print("\n######### ANALISI DEL GRAFO INIZIALE #########")
    connectivity_analisys(G)

    kval = gt.kcore_decomposition(G)

    k_core_iter(G, kval)

#g è il sottografo corrispondente al livello di coreness k
#cv è la mappa di vertici di taglio del grafo originale
def map_creator(g, k, cv, cv_map, comp, core2comp_map):
    for v in g.iter_vertices():
        if cv[v] == 1:
            if len(cv_map[v]) == 0 or len(cv_map[v]) == 1 :
                cv_map[v].append(k)
            else:
                max = cv_map[v][1]
                if k > max:
                    cv_map[v][1] = k
        core2comp_map[v].append(comp[v])
    return cv_map, core2comp_map

# map_iterative(g) crea due VertexPropertyMap:
# -cv_map indica se un nodo è un cv e in quali livelli di coreness. la chiave è il vertice v
#   e il valore è un array di interi di lunghezza = 2 che indica il range di k in cui v è un cv
#   ESEMPIO se cv_map[v] = [0,3] => v è un cut_vertex per livelli di coreness da 0 a 3
# -core2comp indica a quale componente connessa di quale livello di coreness appartiene un vertice qualsiasi.
#   la chiave è il vertice v e il valore è un array di interi dove l'iesimo elemento corrisponde al numero
#   della componente connessa nel core i
#   ESEMPIO se core2comp[v] = [0,0,2] => v appartiene alla componente connessa #0 quando k=0, alla #0 quando k=1
#           e alla componente #2 quando k=2
def map_iterative(g):
    kval = gt.kcore_decomposition(g)
    k = 0
    cv_map = g.new_vp("vector<int>")
    core2comp_map = g.new_vp("vector<int>")
    while g.num_vertices() > 0:
        g = k_core(g, kval, k)
        comp, _ = gt.label_components(g)
        _, cv, _ = gt.label_biconnected_components(g)
        cv_map, core2comp_map = map_creator(g, k, cv, cv_map, comp, core2comp_map)
        k += 1
    return cv_map, core2comp_map


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
        if kG.num_vertices() == 0:
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


#start = timeit.default_timer()
#__init__()
#time = timeit.default_timer() - start
#print("\nTEMPO TOTALE DI ESECUZIONE --> " + str(time))


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
