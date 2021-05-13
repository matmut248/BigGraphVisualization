import graph_tool.all as gt
import numpy as np
import timeit

class BCTree:

    def __init__(self, g, adj_matrix, all_cv):

        self.num_cv = 0

        self.bctree = gt.Graph()                                #grafo del bctree
        self.bctree_Bcomp = self.bctree.new_vp("int")           #componenti B
        self.bctree_Ccomp = self.bctree.new_vp("int")           #componenti C
        self.num_Bcomp = 0                                      # numero delle comp B
        self.num_Ccomp = 0                                      # numero delle comp C

        # self.cut_vertices è una mappa bool che vale true se il vertice è un cv nella componente connessa corrente
        self.cut_vertices = self.init_cv(g, all_cv)

        self.init_bctree(g, adj_matrix)


    def init_bctree(self, g, adj_matrix):
        g_cv = gt.GraphView(g, self.cut_vertices)           # sottografo con solo i vertici di taglio
        g.set_directed(False)
        bcomp, _, _ = gt.label_biconnected_components(g)    #componenti biconnesse
        bcomp_visited = []                                  #componenti biconnesse visitate a partire da un cv

        for v in g_cv.vertices():
            self.num_Ccomp += 1
            #adj_on_matrix = adj_matrix[int(v)].indices      #tutte le adiacenze di v nel grafo originale
            #adjs = np.intersect1d(adj_on_matrix, g.get_vertices(), assume_unique = True)
            adjs = adj_matrix[int(v)].indices               #adiacenze del vertice di taglio v

            for adj in adjs:
                try:
                    w = g.vertex(adj)                       #prendo il vertice adiacente
                except ValueError:
                    break
                e = g.edge(v,w)                             #prendo l'arco
                if not(bcomp[e] in bcomp_visited):          #se non ho già visitato la componente biconnessa
                    self.bctree.add_edge(v,w)               #aggiungo l'arco al bctree
                    if not(self.cut_vertices[adj]):         #aggiorno componenti B e C
                        self.bctree_Bcomp[adj] = 1
                        self.num_Bcomp += 1
                    self.bctree_Ccomp[v] = 1
                    bcomp_visited.append(bcomp[e])          #etichetto come visitata la comp biconnessa
            bcomp_visited.clear()                           #svuoto le etichette prima di passare al prossimo cv

        #se trovo un arco tra due cv, aggiungo una comp biconnessa nel bctree tra i due:
        #per come è implementato l'algoritmo, se esiste un arco (s,t) dove sia s che t sono cv,
        #allora esiste sicuramente anche l'arco (t,s)
        for (s,t) in self.bctree.iter_edges():
            e = self.bctree.edge(s,t)
            rev_e = self.bctree.edge(t, s)
            if rev_e is not None:
                self.bctree.remove_edge(e)
                self.bctree.remove_edge(rev_e)
                temp = self.bctree.add_vertex()
                self.bctree.add_edge(s,temp)
                self.bctree.add_edge(temp,t)
                self.bctree_Bcomp[temp] = 1
                self.num_Bcomp += 1


    def init_cv(self, g, all_cv):

        vp_cv = g.new_vp("bool")
        for v in g.vertices():
            if all_cv[v] == 1:
                vp_cv[v] = True
                self.num_cv += 1
        return vp_cv


    def get_cv(self):
        return self.cut_vertices


    def get_num_cv(self):
        return self.num_cv


    def get_Bcomp(self):
        return self.bctree_Bcomp


    def get_Ccomp(self):
        return self.bctree_Ccomp