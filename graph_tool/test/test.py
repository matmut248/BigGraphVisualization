import unittest
import graph_tool.all as gt
import graph_creator as gc
import sys
import os
sys.path.append(os.path.join(os.path.dirname(sys.path[0]), 'src'))
import big_graph_analisys as bga
import cc_tree as cct

@unittest.skip("")
class ConnectivityTest(unittest.TestCase):
    def test_num_edge(self):
        g = gc.connected_simple_graph()
        self.assertEqual(g.num_edges(), 3)

    def test_num_nodes(self):
        g = gc.connected_simple_graph()
        self.assertEqual(g.num_vertices(), 4)

    def test_is_conn(self):
        g1 = gc.connected_simple_graph()
        g2 = gc.not_connected_graph()
        _, hist1 = gt.label_components(g1)
        _, hist2 = gt.label_components(g2)
        self.assertEqual(len(hist1), 1)
        self.assertEqual(len(hist2), 2)

@unittest.skip("")
class CCTreeTest(unittest.TestCase):

    g = gt.load_graph("../gml/stanford.gml")
    #g = gt.random_graph(3000000, lambda: randint(3,20), directed=False)
    #print(g.num_edges())
    #g.set_directed(False)
    gt.remove_self_loops(g)
    gt.remove_parallel_edges(g)


    # un vertice di taglio appartiene almeno a due componenti biconnesse
    #@unittest.skip("")
    def test_cv_num_edges(self):
        bcomp, cv, _ = gt.label_biconnected_components(self.g)  # componenti biconnesse
        for v in self.g.vertices():
            if cv[v] == 1:
                edges = self.g.get_all_edges(v)
                myset = set()
                for temp in edges:
                    e = self.g.edge(temp[0], temp[1])
                    myset.add(bcomp[e])
                self.assertGreaterEqual(len(myset), 2, msg="il nodo errato è " + str(v))
        print("finito")

    # un vertice normale appartiene ad una sola componente biconnessa
    #@unittest.skip("")
    def test_no_cv_lost(self):
        bcomp, cv, _ = gt.label_biconnected_components(self.g)  # componenti biconnesse
        for v in self.g.vertices():
            if cv[v] == 0:
                edges = self.g.get_all_edges(v)
                myset = set()
                if len(edges) > 0:
                    for temp in edges:
                        e = self.g.edge(temp[0], temp[1])
                        myset.add(bcomp[e])
                    self.assertEqual(len(myset), 1, msg="il nodo errato è " + str(v) + " con numero di bcomp = " + str(len(myset)))
        print("finito")

    # gli archi dei nuovi vertici di taglio devono essere connessi a blocchi che condividono lo stesso padre nel cctree
    # quindi a livello visivo saranno inclusi nel blocco al livello n-1
    # @unittest.skip("")
    def test_cctree_same_parent(self):
        cc = cct.CCTree(self.g)
        parents = []
        for v in cc.cct_graph.vertices():
            if cc.cctNode2typeOfNode[v] == 1 and cc.cctNode2depth[v] > 1 and cc.cctNode2typeOfNode[cc.cctNode2parent[v]] == 0:
                edges = cc.cct_graph.get_all_edges(v)
                for e in edges:
                    if e[1] != cc.cctNode2parent[v] and v != cc.cctNode2parent[e[1]]:
                        parents.append(cc.cctNode2parent[e[1]])
                self.assertEqual(parents.count(parents[0]), len(parents), msg=str(parents)+str(v))
                parents.clear()
        print("finito")

    #i vertici di taglio possono avere solo archi (del grafo originale) che appartengono a blocchi a loro connessi
    @unittest.skip("")
    def test_todo(self):
        pass


if __name__ == '__main__':
    unittest.main()
