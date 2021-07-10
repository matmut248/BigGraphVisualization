import graph_tool.all as gt
import big_graph_analisys as bga
import numpy as np
import matplotlib.cm as cm
import matplotlib.pyplot as plt
import timeit
import random
import cairo
import json
from memory_profiler import profile

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
    num_nodes_in_layer = [0, 0]
    num_compB = [0, 0]                                          #numero di componenti B per ogni livello di coreness
    num_compC = [0, 0]                                          #numero di componenti C per ogni livello di coreness

    #una comp C è nuova se il parent è una comp B
    num_new_compC = [0, 0]                                      #numero di componenti C nuove rispetto al livello precedente di coreness
    #una componente B è triviale se contiene solo un arco
    num_comp_trivial = [0, 0]                                   #numero di componenti triviali
    num_comp_conn = [0, 0]                                 #numero di componenti connesse

    initial_g = gt.Graph()                                  #il grafo iniziale
    #initial_g.set_directed(False)
    cct_graph = gt.Graph()                                  #il core-cutvertex tree
    cct_graph.set_directed(False)

    cctNode2depth = cct_graph.new_vp("int")                 #profondità del nodo, corrisponde al livello di k

    #cctNode2typeOfNode è una mappa binaria che ci dice se un nodo del cctree è una componente B (0) o un cv (1)
    cctNode2typeOfNode = cct_graph.new_vp("int")

    cctNode2parent = cct_graph.new_vp("int")                    # puntatore al padre del livello precedente
    cctNode2children = cct_graph.new_vp("vector<int>")          # puntatore ai figli del livello successivo      ????

    cctNode2internalSize = cct_graph.new_vp("int")      #indica a quanti archi di G corrisponde un nodo di cct
    cctNode2width = cct_graph.new_vp("vector<int>")             #indica la width necessaria per visualizzare il nodo

    # cctEdge2sameDepth è una mappa binaria che ci dice se un arco del cctree collega due nodi
    # dello stesso livello (=1) o di livelli di coreness diversi (=0)
    cctEdge2sameDepth = cct_graph.new_ep("int")



    # gNode2maxDepth è un puntatore all'ultimo nodo, cioè a quello con profondità massima, del cctree in cui è presente il nodo di g
    gNode2cctMaxDepthNode = initial_g.new_vp("int")
    gEdge2cctMaxDepthNode = initial_g.new_ep("int")             # la stessa cosa per gli archi

    #gEdgeVisited = initial_g.new_ep("int")                      # archi visitati durante la prima parte dell'algoritmo


    def __init__(self, g):
        gt.remove_self_loops(g)
        gt.remove_parallel_edges(g)
        self.initial_g = g.copy()
        self.adj_matrix_g = gt.adjacency(self.initial_g)
        kval = gt.kcore_decomposition(g)
        self.maxDepth = max(kval.a)
        k = 1
        while True:
            kg = bga.k_core(g, kval, k)
            if kg.num_vertices() == 0:
                break
            #start = timeit.default_timer()
            self.init_cctree(kg, k)
            self.num_nodes_in_layer.append(0)
            self.num_compB.append(0)
            self.num_compC.append(0)
            self.num_new_compC.append(0)
            self.num_comp_trivial.append(0)
            self.num_comp_conn.append(0)
            #time = timeit.default_timer() - start
            #print("livello "+str(k)+" del cctree pronto in " + str(time))
            k += 1
        print("calcolo width")
        start = timeit.default_timer()
        self.viusalization_width()
        time = timeit.default_timer() - start
        print("fine calcolo width in " +str(time))

        self.cct_graph.vp["cctNode2depth"] = self.cctNode2depth
        self.cct_graph.vp["cctNode2typeOfNode"] = self.cctNode2typeOfNode
        self.cct_graph.vp["cctNode2parent"] = self.cctNode2parent
        self.cct_graph.ep["cctEdge2sameDepth"] = self.cctEdge2sameDepth
        self.cct_graph.vp["cctNode2internalSize"] = self.cctNode2internalSize
        max_d = self.cct_graph.new_gp("int",val=self.maxDepth)
        nodes_in_layer = self.cct_graph.new_gp("vector<int>", val=self.num_nodes_in_layer)
        numCV = self.cct_graph.new_gp("vector<int>", val=self.num_compC)
        numB = self.cct_graph.new_gp("vector<int>", val=self.num_compB)
        self.cct_graph.gp["maxDepth"] = max_d
        self.cct_graph.gp["nodesInLayer"] = nodes_in_layer
        self.cct_graph.gp["numCV"] = numCV
        self.cct_graph.gp["numCompB"] = numB

    def init_cctree(self, g, k):
        start = timeit.default_timer()
        g.set_directed(False)
        gt.remove_parallel_edges(g)
        bcomp, cv, _ = gt.label_biconnected_components(g)   # componenti biconnesse
        _, hist = gt.label_components(g)
        self.num_comp_conn[k] = len(hist)
        g_cv = gt.GraphView(g, cv)                          # sottografo con solo i vertici di taglio

        bcomp2bc_nodes = {}                                 # mappatura tra componenti biconnesse di g e nodi del bctree
        for n_bcomp in bcomp.a:                             #inizializzo bcomp2bc_nodes
            bcomp2bc_nodes[n_bcomp] = None

        for temp in                        #temp è un cv del grafo iniziale

            v = self.cct_graph.add_vertex()                 #v è un cv del cctree
            self.cctNode2children[v] = []
            self.cctNode2width[v] = [0,0]
            self.cctNode2depth[v] = k
            self.num_nodes_in_layer[k] += 1
            self.num_compC[k] += 1
            self.cctNode2typeOfNode[v] = 1                  #v è un cut-vertex
            if k != 1:                                           #provo a prendere il parent (potrebbe non esistere)
                parent = self.gNode2cctMaxDepthNode[temp]
                if self.cct_graph.edge(parent,v) is None:
                    temp_edge = self.cct_graph.add_edge(parent,v)
                    self.cctEdge2sameDepth[temp_edge] = 0
                    self.cctNode2parent[v] = parent
                    self.cctNode2children[parent].append(v)
                if self.cctNode2typeOfNode[parent] == 0:
                    self.num_new_compC[k] += 1

            self.gNode2cctMaxDepthNode[temp] = v          #temp corrisponde a v

            adjs = g.get_all_edges(temp)        #adiacenze del vertice di taglio v
            #print("cv = "+str(temp)+"  adjs: "+str(adjs))
            for adj in adjs:
                w = g.vertex(adj[1])
                e = g.edge(temp, w)
                if bcomp2bc_nodes[bcomp[e]] is None:            #se non ho già visitato la bcomp
                    new_bcomp_node = self.cct_graph.add_vertex()   #new_bcomp_node è una componente B del bctree
                    self.cctNode2children[new_bcomp_node] = []
                    self.cctNode2width[new_bcomp_node] = [0, 0]
                    self.cctNode2depth[new_bcomp_node] = k
                    self.num_nodes_in_layer[k] += 1
                    self.num_compB[k] += 1
                    bcomp2bc_nodes[bcomp[e]] = new_bcomp_node   # new_bcomp_node corrisponde a bcomp[e]
                    self.cctNode2typeOfNode[new_bcomp_node] = 0
                    #self.gEdgeVisited[e] = 1

                    if k != 1:
                        parent = self.gEdge2cctMaxDepthNode[e]
                        if self.cct_graph.edge(parent, new_bcomp_node) is None:
                            temp_edge = self.cct_graph.add_edge(parent, new_bcomp_node)
                            self.cctEdge2sameDepth[temp_edge] = 0
                            self.cctNode2parent[new_bcomp_node] = parent
                            self.cctNode2children[parent].append(new_bcomp_node)

                    self.gEdge2cctMaxDepthNode[e] = new_bcomp_node

                    if cv[w] == 1:
                        self.num_comp_trivial[k] += 1

                else:
                    new_bcomp_node = self.cct_graph.vertex(bcomp2bc_nodes[bcomp[e]])   #prendo il nodo corrispondente a bcomp[e]

                if self.cct_graph.edge(v, new_bcomp_node) is None:
                    new_e = self.cct_graph.add_edge(v,new_bcomp_node)      #aggiungo l'arco tra v e new_bcomp_node se manca
                    self.cctEdge2sameDepth[new_e] = 1

                if cv[w] == 0:
                    self.gNode2cctMaxDepthNode[w] = new_bcomp_node
        time = timeit.default_timer() - start
        print("prima parte pronto in " + str(time))
        start = timeit.default_timer()

        #g_filt = gt.GraphView(g,efilt= lambda edge: self.gEdgeVisited[edge] == 0)

        for e in g.edges():

            if bcomp2bc_nodes[bcomp[e]] is None:
                new_bcomp_node = self.cct_graph.add_vertex()
                self.cctNode2children[new_bcomp_node] = []
                self.cctNode2width[new_bcomp_node] = [0, 0]
                self.num_nodes_in_layer[k] += 1
                self.num_compB[k] += 1
                if k != 1:
                    parent = self.gEdge2cctMaxDepthNode[e]
                    if self.cct_graph.edge(parent,new_bcomp_node) is None:
                        temp_edge = self.cct_graph.add_edge(parent, new_bcomp_node)
                        self.cctEdge2sameDepth[temp_edge] = 0
                        self.cctNode2parent[new_bcomp_node] = parent
                        self.cctNode2children[parent].append(new_bcomp_node)

                self.cctNode2depth[new_bcomp_node] = k
                self.gEdge2cctMaxDepthNode[e] = new_bcomp_node
                self.gNode2cctMaxDepthNode[e.source()] = new_bcomp_node
                self.gNode2cctMaxDepthNode[e.target()] = new_bcomp_node
                self.cctNode2internalSize[new_bcomp_node] += 1
                bcomp2bc_nodes[bcomp[e]] = new_bcomp_node

            else:
                temp = self.cct_graph.vertex(bcomp2bc_nodes[bcomp[e]])
                self.cctNode2depth[temp] = k
                self.cctNode2internalSize[temp] += 1
                self.gEdge2cctMaxDepthNode[e] = temp
                if cv[e.source()] == 0:
                    self.gNode2cctMaxDepthNode[e.source()] = temp
                if cv[e.target()] == 0:
                    self.gNode2cctMaxDepthNode[e.target()] = temp
        time = timeit.default_timer() - start
        print("seconda parte pronto in " + str(time))

    def viusalization_width(self):
        for v in self.cct_graph.vertices():
            if not self.cctNode2children[v]:        # v è una foglia
                curr_node = v
                while self.cctNode2depth[curr_node] != 1:
                    parent = self.cctNode2parent[curr_node]
                    if self.cctNode2typeOfNode[v] == 1:
                        self.cctNode2width[parent][0] += 1
                    else:
                        self.cctNode2width[parent][1] += 1
                    curr_node = parent
        self.cct_graph.vp["cctNode2width"] = self.cctNode2width

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
        i = 0
        for v in self.cct_graph.vertices():
            # 600/self.num_nodes_in_layer[self.cctNode2depth[v]] è lo step
            # self.cctNode2depth[v]
            # uniform(-1,1)
            pos[v].append((1200/self.num_nodes_in_layer[self.cctNode2depth[v]]) * i)
            #if self.cctNode2typeOfNode[v] == 0:
            pos[v].append(800/self.maxDepth * self.cctNode2depth[v] + (random.randint(25,30) * random.randint(-1,1)))
            #else:
                #pos[v].append(800/self.maxDepth * self.cctNode2depth[v])
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
        gt.graph_draw(self.initial_g, vertex_text=self.initial_g.vertex_index)
        gt.graph_draw(self.cct_graph, pos=self.vertices_pos(), vertex_text=self.cct_graph.vertex_index, vertex_fill_color=self.color(), vertex_size=self.size(),
                      vertex_font_size=10, vertex_font_weight=cairo.FONT_WEIGHT_BOLD,edge_dash_style=self.edge_style(), output_size=(1200,800),
                      #output="graph_tool/image/cctree_final",fmt="pdf"
                      )
        #gt.draw_hierarchy(gt.NestedBlockState(self.cct_graph), layout = self.cctNode2depth, vertex_text=self.cct_graph.vertex_index, vertex_shape=self.shape(), vertex_fill_color=self.color())
        #gt.graphviz_draw(self.cct_graph, pos = self.vertices_pos(), vcmap=self.color(), layout="twopi")

    def find_vertex_in_cctree(self,v,k=None):
        try:
            self.initial_g.vertex(v)
        except ValueError:
            raise

        if k is not None:
            if k > self.maxDepth:
                raise ValueError("il cctree non raggiunge il livello di profondità k = "+str(k))
            cctree_vertex = self.gNode2cctMaxDepthNode[v]
            if self.cctNode2depth[cctree_vertex] < k:
                raise ValueError("il nodo "+str(v)+" non raggiunge il livello di profondità k = " + str(k)+" nel cctree")
            while self.cctNode2depth[cctree_vertex] > k:
                cctree_vertex = self.cctNode2parent[cctree_vertex]
            return cctree_vertex

        else:
            cctree_path = []
            cctree_vertex = self.gNode2cctMaxDepthNode[v]
            while self.cctNode2depth[cctree_vertex] > 1:
                cctree_path.append(cctree_vertex)
                cctree_vertex = self.cctNode2parent[cctree_vertex]
            cctree_path.append(cctree_vertex)
            return cctree_path[::-1]

    def find_edge_in_cctree(self, s, t, k=None):
        try:
            e = self.initial_g.edge(s,t)
        except ValueError:
            raise

        if k is not None:
            if k > self.maxDepth:
                raise ValueError("il cctree non raggiunge il livello di profondità k = "+str(k))
            cctree_vertex = self.gEdge2cctMaxDepthNode[e]
            if self.cctNode2depth[cctree_vertex] < k:
                raise ValueError("l'arco "+str(e)+" non raggiunge il livello di profondità k = " + str(k)+" nel cctree")
            while self.cctNode2depth[cctree_vertex] > k:
                cctree_vertex = self.cctNode2parent[cctree_vertex]
            return cctree_vertex

        else:
            cctree_path = []
            cctree_vertex = self.gEdge2cctMaxDepthNode[e]

            while self.cctNode2depth[cctree_vertex] > 1:
                cctree_path.append(cctree_vertex)
                cctree_vertex = self.cctNode2parent[cctree_vertex]
            cctree_path.append(cctree_vertex)
            return cctree_path[::-1]

    def statistic(self):

        with open("../report/cctree_" + self.initial_g.gp["name"] + "_statistic.txt", "a+") as file:
            file.write("\n====================== ANALISI DEL GRAFO " + str(self.initial_g.gp["name"]) + " ======================\n\n")

            file.write("numero di archi: "+str(self.initial_g.num_edges())+"\tnumero di vertici: "+str(self.initial_g.num_vertices())+"\n")

            # tasso di decrescita
            growth_rate_compB = (pow(self.num_compB[self.maxDepth] / self.num_compB[1], (1 / self.maxDepth)) - 1) * 100

            first_index_not_zero = min(np.nonzero(self.num_compC)[0])
            last_index_not_zero = max(np.nonzero(self.num_compC)[0])
            delta = last_index_not_zero - first_index_not_zero
            growth_rate_compC = (pow(self.num_compC[last_index_not_zero] / self.num_compC[first_index_not_zero],
                                     (1 / (delta + 1))) - 1) * 100

            file.write("\t- Tasso di decrescita del numero di componenti biconnesse: " + str(
                round(growth_rate_compB, 3)) + "%\n")
            file.write(
                "\t- Tasso di decrescita del numero di vertici di taglio: " + str(round(growth_rate_compC, 3)) + "%\n")

            # variazione delle componenti biconnesse e dei vertici di taglio
            temp = "\n| LIV. CORENESS |\t\t\t"+"|# COMPONENTI CONNESSE|\t\t\t"+"|# BLOCCHI|\t\t\t"+"|# CUT-VERTEX|\t\t\t" + "|# NUOVI CV|\t\t\t"+"|# BLOCCHI 1 EDGE|\n\n"
            file.write(temp)
            for k in range(1,self.maxDepth+1):
                temp = "\t\t"+str(k)+"\t\t\t\t\t\t\t"+str(self.num_comp_conn[k])+"\t\t\t\t\t\t\t"+str(self.num_compB[k])+"\t\t\t\t\t\t"+str(self.num_compC[k])+\
                       "\t\t\t\t\t\t"+str(self.num_new_compC[k])+"\t\t\t\t\t\t"+str(self.num_comp_trivial[k])+"\n"
                file.write(temp)

    def plot_distibution_compB(self):
        x1 = np.arange(1, self.maxDepth + 1)
        y1 = self.num_compB[1:-1]
        y2 = self.num_compC[1:-1]
        plt.title("CCTree Component Distribution")
        plt.xlabel("Coreness")
        plt.ylabel("# Comp B/C")
        plt.plot(x1, y1, color="red", label="B component")
        plt.plot(x1, y2, color="blue", label="C component")
        plt.legend()
        plt.show()

    def to_xml(self):
        print(self.cct_graph.list_properties())
        self.cct_graph.save("js/data/webGoogle_new.xml",fmt="xml")


def run():
    G = gt.Graph()
    G.set_directed(False)
    # G.add_edge_list([(0, 1), (0, 2), (0, 3), (0, 4), (3, 4), (4,5), (0,6),(3,6),(4,6)])
    G.add_edge_list(
        [(0, 1), (0, 2), (1, 2), (0, 4), (4, 5), (4, 6), (4, 7), (5, 6), (5, 7), (6, 7), (6, 8), (8, 9), (8, 14),
         (9, 10),
         (9, 11), (9, 12), (10, 11), (10, 12), (11, 12), (12, 13), (14, 15), (14, 16), (14, 17), (15, 16),
         (15, 17), (16, 17), (17, 3),
         (18, 19), (18, 20), (19, 20),
         (21, 22), (21, 23), (22, 23), (24, 25), (25, 26), (24, 26), (27, 21), (27, 25), (28, 22), (28, 26), (21, 29),
         (22, 29), (23, 29), (24, 30), (25, 30), (26, 30), (41, 21), (41, 22), (41, 25), (41, 26),
         (31, 32), (31, 33), (32, 33), (34, 35), (35, 36), (34, 36), (37, 31), (37, 35), (38, 32), (38, 36),
         (31, 39), (32, 39), (33, 39), (34, 40), (35, 40), (36, 40)
         ])
    G.clear()
    G = gt.load_graph("../gml/webGoogle.gml")
    gp_name = G.new_gp("string")
    G.gp["name"] = gp_name
    G.gp["name"] = "webGoogle_new"
    print("letto")
    gt.remove_self_loops(G)
    gt.remove_parallel_edges(G)
    start = timeit.default_timer()
    cc = CCTree(G)
    gt.remove_parallel_edges(cc.cct_graph)

    time = timeit.default_timer() - start
    #cc.statistic()
    #cc.plot_distibution_compB()
    print("cctree pronto in " + str(time))
    #cc.draw_cctree()
    #cc.to_xml()


    #print("nodo 102488 corrispondente al nodo di g: " + str(cc.) + " -> " + str(cc.cctNode2width[v]))
    #return cc

#run()