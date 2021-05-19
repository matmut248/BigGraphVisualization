import graph_tool.all as gt
import numpy as np
import timeit
from collections import OrderedDict

class BCTree:

    def __init__(self, g, adj_matrix):

        self.bctree = gt.Graph()                                #grafo del bctree
        self.bctree.set_directed(False)
        self.gNode2bcNode = {}                                  #corrispondenza nodi di g con nodi del bctree
        self.node2isBcomp = self.bctree.new_vp("int")           #componenti B
        self.node2isCcomp = self.bctree.new_vp("int")           #componenti C
        self.num_Bcomp = 0                                      # numero delle comp B
        self.num_Ccomp = 0                                      # numero delle comp C

        self.init_bctree(g, adj_matrix)

        #self.draw_bctree()

    def init_bctree(self, g, adj_matrix):

        g.set_directed(False)
        bcomp, cv, _ = gt.label_biconnected_components(g)  # componenti biconnesse
        g_cv = gt.GraphView(g, cv)                      # sottografo con solo i vertici di taglio
        bcomp2bc_nodes = {}                             # mappatura tra componenti biconnesse di g e nodi del bctree
        for n_bcomp in bcomp.a:                         #inizializzo bcomp2bc_nodes
            bcomp2bc_nodes[n_bcomp] = None

        for temp in g_cv.vertices():                    #temp è un cv del grafo iniziale
            v = self.bctree.add_vertex()                #v è un cv del bctree
            self.gNode2bcNode[temp] = v                 #temp corrisponde a v
            self.node2isCcomp[v] = 1
            self.num_Ccomp += 1
            adjs = adj_matrix[int(temp)].indices        #adiacenze del vertice di taglio v
            for adj in adjs:
                try:
                    w = g.vertex(adj)                   # w è adiacente a temp nel grafo originale
                    e = g.edge(temp,w)
                except ValueError:
                    continue
                if bcomp2bc_nodes[bcomp[e]] is None:            #se non ho già visitato la bcomp
                    new_bcomp_node = self.bctree.add_vertex()   #new_bcomp_node è una componente B del bctree
                    self.node2isBcomp[new_bcomp_node] = 1
                    self.num_Bcomp += 1
                    bcomp2bc_nodes[bcomp[e]] = new_bcomp_node   # new_bcomp_node corrisponde a bcomp[e]
                else:
                    new_bcomp_node = self.bctree.vertex(bcomp2bc_nodes[bcomp[e]])   #prendo il nodo corrispondente a bcomp[e]
                if self.bctree.edge(v, new_bcomp_node) is None:
                    self.bctree.add_edge(v,new_bcomp_node)      #aggiungo l'arco tra v e new_bcomp_node se manca
                if cv[w] == 0:
                    self.gNode2bcNode[w] = new_bcomp_node       # w corrisponde a new_bcomp_node se non è un cv

        for e in g.edges():
            if bcomp2bc_nodes[bcomp[e]] is None:
                new_bcomp_node = self.bctree.add_vertex()  # new_bcomp_node è una componente B del bctree
                s = e.source()
                t = e.target()
                self.gNode2bcNode[s] = new_bcomp_node
                self.gNode2bcNode[t] = new_bcomp_node
                self.node2isBcomp[new_bcomp_node] = 1
                self.num_Bcomp += 1
