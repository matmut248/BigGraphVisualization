import graph_tool.all as gt
import sys
import big_graph_analisys as bga
import bc_tree as bc

def procedure(g):
    with open("../report/" + g.gp["name"] + "-report.txt", "a+") as file:
        kval = gt.kcore_decomposition(g)
        adj_matrix = gt.adjacency(g)
        k = 1
        while g.num_vertices() > 0:
            # per ogni lv di coreness
            g.set_vertex_filter(None)
            k_core_filtering(g, kval, k)
            file.write("\n====================== ANALISI DEL " + str(k) +" CORE ======================\n\n")
            file.write("il grafo ha " + str(g.num_vertices()) + " nodi e " + str(g.num_edges()) + " archi\n")
            comp, hist = gt.label_components(g)
            bcomp, cv, num = gt.label_biconnected_components(g)
            tot_cv = len(list(filter(lambda x: (x == 1), cv)))
            file.write("numero di componenti connesse: " + str(len(hist)) + "\n")
            file.write("numero di componenti biconnesse: " + str(len(num)) + "\n")
            file.write("numero di vertici di taglio: " + str(tot_cv) + "\n")
            if tot_cv == 0:
                return
            # per ogni componente connessa
            for i in range(len(hist)):
                curr_comp = g.new_vp("bool")
                num_cv = 0
                for v in g.vertices():
                    if comp[v] == i:
                        curr_comp[v] = True
                        if cv[v] == 1:
                            num_cv += 1
                #sono di interesse solo componenti con numero di cv > dello 0,1% dei cv totali
                if num_cv > (tot_cv/1000):
                    file.write("\n\t------ analisi della componente connessa #" + str(i) + " ------\n")
                    sub_g = gt.GraphView(g, curr_comp)
                    file.write("\tnumero di nodi: " + str(sub_g.num_vertices()) + "\n")
                    file.write("\tnumero di archi: " + str(sub_g.num_edges()) + "\n")
                    file.write("\tnumero di vertici di taglio: " + str(num_cv) + "\n")
                    # calcolo bctree
                    bct = bc.BCTree(sub_g, adj_matrix)
                    file.write("\tnumero nodi del BC-Tree: " + str(bct.bctree.num_vertices()) + "\n")
                    file.write("\tnumero blocchi (NODI B) del BC-Tree: " + str(bct.num_Bcomp) + "\n")
                    file.write("\tnumero vertici di taglio (NODI C) del BC-Tree: " + str(bct.num_Ccomp) + "\n")

            k += 1



def k_core_filtering(g, kval, k):
    vpCore = g.new_vp("bool")
    for v in g.vertices():
        if (kval[v] >= k):
            vpCore[v] = True
    g.set_vertex_filter(vpCore)

g = gt.load_graph("../gml/amazon.gml")



gp_name = g.new_gp("string")
g.gp["name"] = gp_name
g.gp["name"] = "amazon"
bga.preprocessing(g)
procedure(g)