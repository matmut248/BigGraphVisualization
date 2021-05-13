import unittest
import graph_tool.all as gt
import graph_creator as gc
import sys
import os
sys.path.append(os.path.join(os.path.dirname(sys.path[0]), 'src'))
import big_graph_analisys as bga
import bc_tree as bc


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

class BCTreeTest(unittest.TestCase):

    g1 = gc.connected_simple_graph()
    g2 = gc.graph_for_bc_testing()
    g3 = gc.graph_for_bc_testing_2()

    _, cv, _ = gt.label_biconnected_components(g1)
    _, cv2, _ = gt.label_biconnected_components(g2)
    _, cv3, _ = gt.label_biconnected_components(g3)

    #@unittest.skip("")
    def test_num_cv(self):
        adj_matrix = gt.adjacency(self.g1)
        bct = bc.BCTree(self.g1, adj_matrix, self.cv)
        self.assertEqual(bct.get_num_cv(), 1)

    #@unittest.skip("")
    def test_num_nodes(self):
        adj_matrix = gt.adjacency(self.g1)
        bct = bc.BCTree(self.g1, adj_matrix, self.cv)
        self.assertEqual(bct.bctree.num_vertices(), 4)

    #@unittest.skip("")
    def test_num_edge(self):
        adj_matrix = gt.adjacency(self.g1)
        bct = bc.BCTree(self.g1, adj_matrix, self.cv)
        self.assertEqual(bct.bctree.num_edges(), 3)

    #@unittest.skip("")
    def test_init_bctree(self):
        adj_matrix = gt.adjacency(self.g1)
        bct = bc.BCTree(self.g1, adj_matrix, self.cv)
        i = 0
        j = 0
        b_comp = bct.get_Bcomp()
        c_comp = bct.get_Ccomp()
        for v in self.g1.vertices():
                i += b_comp[v]
                j += c_comp[v]
        self.assertEqual(bct.bctree.num_edges(), 3)
        self.assertEqual(bct.bctree.num_vertices(), 4)
        self.assertEqual(i, 3)
        self.assertEqual(j, 1)

    #@unittest.skip("")
    def test_bcomp_bctree(self):
        adj_matrix = gt.adjacency(self.g2)
        bct = bc.BCTree(self.g2, adj_matrix, self.cv2)
        self.assertEqual(bct.bctree.num_edges(), 3)
        self.assertEqual(bct.bctree.num_vertices(), 4)

    #@unittest.skip("")
    def test_bcomp_bctree_2(self):
        adj_matrix = gt.adjacency(self.g3)
        bct = bc.BCTree(self.g3, adj_matrix,self.cv3)
        self.assertEqual(bct.bctree.num_edges(), 5)
        self.assertEqual(bct.bctree.num_vertices(), 6)

    #@unittest.skip("")
    def test_bc_comp_bctree_(self):

        g4 = gc.graph_for_bc_testing_3()
        _, cv4, _ = gt.label_biconnected_components(g4)
        adj_matrix = gt.adjacency(g4)
        bct = bc.BCTree(g4, adj_matrix, cv4)
        self.assertListEqual(list(bct.bctree_Bcomp.a), [1,0,0,0,1,1,1])
        self.assertListEqual(list(bct.bctree_Ccomp.a), [0,1,1,1,0,0,0])

        self.assertEqual(bct.bctree.num_edges(), 6)
        self.assertEqual(bct.bctree.num_vertices(), 7)



if __name__ == '__main__':
    unittest.main()
