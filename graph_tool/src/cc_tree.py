import graph_tool.all as gt
import big_graph_analisys as bga
import numpy as np
import timeit

# il Core-CUtVertex Tree è una struttura ad albero che rappresenta l'evoluzione del block-cutvertex tree al variare
# del livello di coreness del grafo.
#
# -ogni livello di profondità k del CCTree è il BCTree del k-core di g.
# -i nodi del CCTree possono essere di tipo B o C come nel BCTree
# -ogni nodo al livello k è collegato con almeno un nodo al livello k+1, in particolare, se il nodo è di tipo B,
# può avere come figli N nodi di tipo B e al massimo N-1 nodi di tipo C, mentre se il nodo è di tipo C, può avere
# al massimo un figlio di tipo C.
# -in generale un arco padre-figlio nel CCTree rappresenta l'evoluzione di quella componente (padre) che si
# ottiene aumentando il livello di coreness di 1
#
# L'algoritmo per la costruzione del CCTree consiste nel creare iterativamente il BCTree del k-core di g
# e collegare i nodi secondo i rapporti padre figlio suddetti.
#
#   per ogni livello di coreness:
#       ciclo sui vertici di taglio:
#           aggiungo un nodo (di tipo C) al cctree che rappresenta il vertice di taglio
#           aggiungo l'arco con il parent (del livello precedente) se esiste
#           per ogni adiacenza:
#               aggiungo un nodo (di tipo B) al cctree che rappresenta la componente biconnessa adiacente
#               aggiungo l'arco con il vertice di taglio se ancora non è stato aggiunto
#               aggiungo l'arco con il parent (del livello precedente) se esiste
#       per ogni componente biconnessa non considerata (perchè non ha vertici di taglio adiacenti):
#           aggiungo un nodo (di tipo B) al cctree che rappresenta la componente biconnessa
class CCTree:

    initial_g = gt.Graph()                                  #il grafo iniziale
    cct_graph = gt.Graph()                                  #il core-cutvertex tree
    cct_graph.set_directed(False)
    cctNode2depth = cct_graph.new_vp("int")                 #profondità del nodo, corrisponde al livello di k
    #cctNode2typeOfNode è una mappa binaria che ci dice se un nodo del cctree è una componente B (0) o un cv (1)
    cctNode2typeOfNode = cct_graph.new_vp("int")
    #gNode2cctPath fornisce la lista dei nodi del cctree a cui appartiene un nodo di g.
    #   l'indice della lista corrisponde al livello di coreness (profondità dell'albero), mentre il
    #   valore corrisponde all'id del nodo del cctree
    gNode2cctPath = initial_g.new_vp("vector<int>")

    def __init__(self, g):
        self.initial_g = g.copy()
        self.adj_matrix_g = gt.adjacency(self.initial_g)
        kval = gt.kcore_decomposition(g)
        k = 1
        while True:
            kg = bga.k_core(g, kval, k)
            if kg.num_vertices() == 0:
                break
            start = timeit.default_timer()
            self.init_cctree(kg, k)
            time = timeit.default_timer() - start
            print("livello "+str(k)+" del cctree pronto in " + str(time))
            k += 1
            print(kg.num_vertices())


    def init_cctree(self, g, k):

        g.set_directed(False)
        bcomp, cv, _ = gt.label_biconnected_components(g)  # componenti biconnesse
        g_cv = gt.GraphView(g, cv)                      # sottografo con solo i vertici di taglio
        bcomp2bc_nodes = {}                             # mappatura tra componenti biconnesse di g e nodi del bctree
        for n_bcomp in bcomp.a:                         #inizializzo bcomp2bc_nodes
            bcomp2bc_nodes[n_bcomp] = None

        for temp in g_cv.vertices():                    #temp è un cv del grafo iniziale
            v = self.cct_graph.add_vertex()             #v è un cv del cctree
            self.cctNode2depth[v] = k
            if len(self.gNode2cctPath[temp]) != 0:      #sono al primo livello di profondità dell'albero
                parent = self.gNode2cctPath[temp][-1]   #il parent è l'ultimo che ho aggiunto nel path
                self.cct_graph.add_edge(parent,v)

            self.gNode2cctPath[temp].append(v)          #temp corrisponde a v
            self.cctNode2typeOfNode[v] = 1              #v è un cut-vertex
            adjs = self.adj_matrix_g[int(temp)].indices        #adiacenze del vertice di taglio v

            for adj in adjs:
                try:
                    w = g.vertex(adj)                   # w è adiacente a temp nel grafo originale
                    e = g.edge(temp,w)
                except ValueError:
                    continue
                if bcomp2bc_nodes[bcomp[e]] is None:            #se non ho già visitato la bcomp
                    new_bcomp_node = self.cct_graph.add_vertex()   #new_bcomp_node è una componente B del bctree
                    self.cctNode2depth[new_bcomp_node] = k
                    bcomp2bc_nodes[bcomp[e]] = new_bcomp_node   # new_bcomp_node corrisponde a bcomp[e]
                else:
                    new_bcomp_node = self.cct_graph.vertex(bcomp2bc_nodes[bcomp[e]])   #prendo il nodo corrispondente a bcomp[e]

                if self.cct_graph.edge(v, new_bcomp_node) is None:
                    self.cctNode2typeOfNode[new_bcomp_node] = 0     # new_bcomp_node è un blocco
                    self.cct_graph.add_edge(v,new_bcomp_node)      #aggiungo l'arco tra v e new_bcomp_node se manca

                if cv[w] == 0:
                    if len(self.gNode2cctPath[w]) != 0:  # sono al primo livello di profondità dell'albero
                        parent = self.gNode2cctPath[w][-1]  # il parent è l'ultimo che ho aggiunto nel path
                        if parent != new_bcomp_node:
                            self.cct_graph.add_edge(parent, new_bcomp_node)
                    self.gNode2cctPath[w].append(new_bcomp_node)       # w corrisponde a new_bcomp_node se non è un cv


        for e in g.edges():
            if bcomp2bc_nodes[bcomp[e]] is None:
                missing_bcomp_node = self.cct_graph.add_vertex()
                if len(self.gNode2cctPath[e.source()]) == 0:
                    continue
                if self.cctNode2typeOfNode[self.gNode2cctPath[e.source()][-1]] == 0:
                    parent = self.gNode2cctPath[e.source()][-1]
                    temp = e.source()
                else:
                    parent = self.gNode2cctPath[e.target()][-1]
                    temp = e.target()
                self.cct_graph.add_edge(parent, missing_bcomp_node)
                self.gNode2cctPath[temp].append(missing_bcomp_node)
                bcomp2bc_nodes[bcomp[e]] = missing_bcomp_node
                self.cctNode2depth[missing_bcomp_node] = k




    def shape(self):
        shape = self.cct_graph.new_vp("string")
        for v in self.cct_graph.vertices():
            if self.cctNode2typeOfNode[v] == 0:
                shape[v] = "square"
            else:
                shape[v] = "circle"
        return shape

    def color(self):
        color = self.cct_graph.new_vp("string")
        for v in self.cct_graph.vertices():
            if self.cctNode2depth[v] % 2 == 0:
                color[v] = "red"
            else:
                color[v] = "blue"
        return color

    def draw_cctree(self):
        gt.graph_draw(self.cct_graph, vertex_text=self.cct_graph.vertex_index, vertex_shape=self.shape(), vertex_fill_color=self.color())
        #gt.draw_hierarchy(gt.NestedBlockState(self.cct_graph), layout = self.cctNode2depth, vertex_text=self.cct_graph.vertex_index, vertex_shape=self.shape(), vertex_fill_color=self.color())
        #gt.graphviz_draw(self.cct_graph, layout="dot")

#g = gt.Graph()
#g.add_edge_list([(0, 1), (0, 2), (0, 3), (0, 4), (3, 4), (4,5),(0,6),(3,6),(4,6)])
G = gt.load_graph("../gml/amazon.gml")
print("letto")
G.set_directed(False)
start = timeit.default_timer()
cc = CCTree(G)
time = timeit.default_timer() - start
print("cctree pronto in " + str(time))
cc.draw_cctree()