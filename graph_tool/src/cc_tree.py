import graph_tool.all as gt
import big_graph_analisys as bga
import numpy as np
import matplotlib.cm as cm
import timeit
import random
import cairo

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
#
# differenzia gli archi tra livelli e tra lo stesso livello
class CCTree:

    maxDepth = 0
    num_nodes_in_layer = [0,0]
    initial_g = gt.Graph()                                  #il grafo iniziale
    initial_g.set_directed(False)
    cct_graph = gt.Graph()                                  #il core-cutvertex tree
    cct_graph.set_directed(False)

    cctNode2depth = cct_graph.new_vp("int")                 #profondità del nodo, corrisponde al livello di k

    #cctNode2typeOfNode è una mappa binaria che ci dice se un nodo del cctree è una componente B (0) o un cv (1)
    cctNode2typeOfNode = cct_graph.new_vp("int")

    cctNode2parent = cct_graph.new_vp("int")                    # puntatore al padre del livello precedente
    cctNode2children = cct_graph.new_vp("vector<int>")          # puntatore ai figli del livello successivo      ????

    # cctEdge2sameDepth è una mappa binaria che ci dice se un arco del cctree collega due nodi
    # dello stesso livello (=1) o di livelli di coreness diversi (=0)
    cctEdge2sameDepth = cct_graph.new_ep("int")

    # gNode2maxDepth è un puntatore all'ultimo nodo, cioè a quello con profondità massima, del cctree in cui è presente il nodo di g
    gNode2cctMaxDepthNode = initial_g.new_vp("int")
    gEdge2cctMaxDepthNode = initial_g.new_ep("int")             # la stessa cosa per gli archi



    def __init__(self, g):
        self.initial_g = g.copy()
        self.adj_matrix_g = gt.adjacency(self.initial_g)
        kval = gt.kcore_decomposition(g)
        k = 1
        while True:
            kg = bga.k_core(g, kval, k)
            if kg.num_vertices() == 0:
                self.maxDepth = k-1
                break
            start = timeit.default_timer()
            self.init_cctree(kg, k)
            self.num_nodes_in_layer.append(0)
            time = timeit.default_timer() - start
            print("livello "+str(k)+" del cctree pronto in " + str(time))
            k += 1


    def init_cctree(self, g, k):

        g.set_directed(False)
        bcomp, cv, _ = gt.label_biconnected_components(g)   # componenti biconnesse
        g_cv = gt.GraphView(g, cv)                          # sottografo con solo i vertici di taglio

        bcomp2bc_nodes = {}                                 # mappatura tra componenti biconnesse di g e nodi del bctree
        for n_bcomp in bcomp.a:                             #inizializzo bcomp2bc_nodes
            bcomp2bc_nodes[n_bcomp] = None

        for temp in g_cv.vertices():                        #temp è un cv del grafo iniziale

            v = self.cct_graph.add_vertex()                 #v è un cv del cctree
            self.cctNode2depth[v] = k
            self.num_nodes_in_layer[k] += 1
            self.cctNode2typeOfNode[v] = 1                  #v è un cut-vertex
            if k != 1:                                           #provo a prendere il parent (potrebbe non esistere)
                parent = self.gNode2cctMaxDepthNode[temp]
                if self.cct_graph.edge(parent,v) is None:
                    temp_edge = self.cct_graph.add_edge(parent,v)
                    self.cctEdge2sameDepth[temp_edge] = 0
                    self.cctNode2parent[v] = parent

            self.gNode2cctMaxDepthNode[temp] = v          #temp corrisponde a v

            adjs = self.adj_matrix_g[int(temp)].indices        #adiacenze del vertice di taglio v
            #print("cv = "+str(temp)+"  adjs: "+str(adjs))
            for adj in adjs:
                try:
                    w = g.vertex(adj)                   # w è adiacente a temp nel grafo originale
                    e = g.edge(temp,w)
                except ValueError:
                    continue

                if bcomp2bc_nodes[bcomp[e]] is None:            #se non ho già visitato la bcomp
                    new_bcomp_node = self.cct_graph.add_vertex()   #new_bcomp_node è una componente B del bctree
                    self.cctNode2depth[new_bcomp_node] = k
                    self.num_nodes_in_layer[k] += 1
                    bcomp2bc_nodes[bcomp[e]] = new_bcomp_node   # new_bcomp_node corrisponde a bcomp[e]
                    self.cctNode2typeOfNode[new_bcomp_node] = 0

                    if k != 1:
                        parent = self.gEdge2cctMaxDepthNode[e]
                        if self.cct_graph.edge(parent, new_bcomp_node) is None:
                            temp_edge = self.cct_graph.add_edge(parent, new_bcomp_node)
                            self.cctEdge2sameDepth[temp_edge] = 0
                            self.cctNode2parent[new_bcomp_node] = parent

                    self.gEdge2cctMaxDepthNode[e] = new_bcomp_node

                else:
                    new_bcomp_node = self.cct_graph.vertex(bcomp2bc_nodes[bcomp[e]])   #prendo il nodo corrispondente a bcomp[e]

                if self.cct_graph.edge(v, new_bcomp_node) is None:
                    new_e = self.cct_graph.add_edge(v,new_bcomp_node)      #aggiungo l'arco tra v e new_bcomp_node se manca
                    self.cctEdge2sameDepth[new_e] = 1

                if cv[w] == 0:
                    self.gNode2cctMaxDepthNode[w] = new_bcomp_node


        for e in g.edges():

            if bcomp2bc_nodes[bcomp[e]] is None:
                new_bcomp_node = self.cct_graph.add_vertex()
                self.num_nodes_in_layer[k] += 1
                if k != 1:
                    parent = self.gEdge2cctMaxDepthNode[e]
                    if self.cct_graph.edge(parent,new_bcomp_node) is None:
                        temp_edge = self.cct_graph.add_edge(parent, new_bcomp_node)
                        self.cctEdge2sameDepth[temp_edge] = 0
                        self.cctNode2parent[new_bcomp_node] = parent

                self.cctNode2depth[new_bcomp_node] = k
                self.gEdge2cctMaxDepthNode[e] = new_bcomp_node
                self.gNode2cctMaxDepthNode[e.source()] = new_bcomp_node
                self.gNode2cctMaxDepthNode[e.target()] = new_bcomp_node
                bcomp2bc_nodes[bcomp[e]] = new_bcomp_node
            else:
                temp = self.cct_graph.vertex(bcomp2bc_nodes[bcomp[e]])
                self.cctNode2depth[temp] = k
                self.gEdge2cctMaxDepthNode[e] = temp
                if cv[e.source()] == 0:
                    self.gNode2cctMaxDepthNode[e.source()] = temp
                if cv[e.target()] == 0:
                    self.gNode2cctMaxDepthNode[e.target()] = temp

    def size(self):
        size = self.cct_graph.new_vp("int")
        for v in self.cct_graph.vertices():
            if self.cctNode2typeOfNode[v] == 0:
                size[v] = 35
            else:
                size[v] = 25
        return size


    def color(self):
        cmap = cm.get_cmap("Wistia")
        color = self.cct_graph.new_vp("vector<float>")
        for v in self.cct_graph.vertices():
            if self.cctNode2typeOfNode[v] == 1:
                color[v] = [0,0,1,1]
            else:
                k = self.cctNode2depth[v]
                color[v] = list(cmap(k/self.maxDepth))
        return color

    def vertices_pos(self):
        pos = self.cct_graph.new_vp("vector<float>")
        distance_bw_layers = 30.0
        i = 0
        for v in self.cct_graph.vertices():
            # 600/self.num_nodes_in_layer[self.cctNode2depth[v]] è lo step
            # self.cctNode2depth[v]
            # uniform(-1,1)
            pos[v].append((1200/self.num_nodes_in_layer[self.cctNode2depth[v]]) * i)
            if self.cctNode2typeOfNode[v] == 0:
                pos[v].append(800/self.maxDepth * self.cctNode2depth[v] + (random.randint(25,30) * random.randint(-1,1)))
            else:
                pos[v].append(800/self.maxDepth * self.cctNode2depth[v])
            i += 1
            if self.cctNode2depth[v] != self.cctNode2depth[int(v)+1]:
                i = 0
        return pos

    def edge_style(self):
        style = self.cct_graph.new_ep("vector<float>")
        for e in self.cct_graph.edges():
            if self.cctEdge2sameDepth[e] == 0:
                style[e] = [10,10,0.2]
            else:
                style[e] = [1,0]
        return style

    def draw_cctree(self):
        #gt.graph_draw(self.initial_g, vertex_text=self.initial_g.vertex_index)
        gt.graph_draw(self.cct_graph, pos = self.vertices_pos(), vertex_text=self.cct_graph.vertex_index, vertex_fill_color=self.color(), vertex_size=self.size(),
                      vertex_font_size=10, vertex_font_weight=cairo.FONT_WEIGHT_BOLD,edge_dash_style=self.edge_style(), output_size=(1200,800),
                      output="graph_tool/image/cctree_image",fmt="pdf")
        #gt.draw_hierarchy(gt.NestedBlockState(self.cct_graph), layout = self.cctNode2depth, vertex_text=self.cct_graph.vertex_index, vertex_shape=self.shape(), vertex_fill_color=self.color())
        #gt.graphviz_draw(self.cct_graph, pos = self.vertices_pos(), vcmap=self.color(), layout="twopi")



#def run():
G = gt.Graph()
G.set_directed(False)
#G.add_edge_list([(0, 1), (0, 2), (0, 3), (0, 4), (3, 4), (4,5), (0,6),(3,6),(4,6)])
G.add_edge_list([(0,1),(0,2),(1,2),(0,4),(4,5),(4,6),(4,7),(5,6),(5,7),(6,7),(6,8),(8,9),(8,14),(9,10),
                     (9,11),(9,12),(10,11),(10,12),(11,12),(12,13),(14,15),(14,16),(14,17),(15,16),
                     (15,17),(16,17),(17,3)])
G2 = gt.Graph()
G2.set_directed(False)
#G.add_edge_list([(0, 1), (0, 2), (0, 3), (0, 4), (3, 4), (4,5), (0,6),(3,6),(4,6)])
G2.add_edge_list([(0,1),(0,2),(0,3),(1,2),(1,3),(2,3),
                  (4,5),(4,6),(4,7),(5,6),(5,7),(6,7),
                  (0,8),(8,7),(1,9),(9,6)])
#G = gt.load_graph("../gml/amazon.gml")
print("letto")

start = timeit.default_timer()
cc = CCTree(G)
time = timeit.default_timer() - start
print("cctree pronto in " + str(time))
cc.draw_cctree()

