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
        bct = bc.BCTree(self.g1, adj_matrix)
        self.assertEqual(bct.num_Ccomp, 1)

    #@unittest.skip("")
    def test_num_nodes(self):
        adj_matrix = gt.adjacency(self.g1)
        bct = bc.BCTree(self.g1, adj_matrix)
        self.assertEqual(bct.bctree.num_vertices(), 4)

    #@unittest.skip("")
    def test_num_edge(self):
        adj_matrix = gt.adjacency(self.g1)
        bct = bc.BCTree(self.g1, adj_matrix)
        self.assertEqual(bct.bctree.num_edges(), 3)

    #@unittest.skip("")
    def test_init_bctree(self):
        adj_matrix = gt.adjacency(self.g1)
        bct = bc.BCTree(self.g1, adj_matrix)
        self.assertEqual(bct.bctree.num_edges(), 3)
        self.assertEqual(bct.bctree.num_vertices(), 4)
        self.assertEqual(bct.num_Bcomp, 3)
        self.assertEqual(bct.num_Ccomp, 1)

    #@unittest.skip("")
    def test_bcomp_bctree(self):
        adj_matrix = gt.adjacency(self.g2)
        bct = bc.BCTree(self.g2, adj_matrix)
        self.assertEqual(bct.bctree.num_edges(), 3)
        self.assertEqual(bct.bctree.num_vertices(), 4)

    #@unittest.skip("")
    def test_bcomp_bctree_2(self):
        adj_matrix = gt.adjacency(self.g3)
        bct = bc.BCTree(self.g3, adj_matrix)
        self.assertEqual(bct.bctree.num_edges(), 5)
        self.assertEqual(bct.bctree.num_vertices(), 6)

    #@unittest.skip("")
    def test_gnode2bcnode(self):
        g = gc.graph_for_bc_testing_3()
        adj_matrix = gt.adjacency(g)
        bct = bc.BCTree(g, adj_matrix)
        self.assertEquals(bct.node2isCcomp[bct.gNode2bcNode[0]], 0)
        self.assertEquals(bct.node2isCcomp[bct.gNode2bcNode[1]], 1)
        self.assertEquals(bct.node2isCcomp[bct.gNode2bcNode[2]], 1)
        self.assertEquals(bct.node2isCcomp[bct.gNode2bcNode[3]], 1)
        self.assertEquals(bct.node2isCcomp[bct.gNode2bcNode[4]], 0)
        self.assertEquals(bct.node2isBcomp[bct.gNode2bcNode[0]], 1)
        self.assertEquals(bct.node2isBcomp[bct.gNode2bcNode[1]], 0)
        self.assertEquals(bct.node2isBcomp[bct.gNode2bcNode[2]], 0)
        self.assertEquals(bct.node2isBcomp[bct.gNode2bcNode[3]], 0)
        self.assertEquals(bct.node2isBcomp[bct.gNode2bcNode[4]], 1)


class CVmapTest(unittest.TestCase):

    #@unittest.skip("")
    def test_cv_map_2core(self):
        # G è un grafo con 6 cv (da o a 5), ma solo 2 e 3 lo sono anche se k = 2
        # con k = 3 non ho più nodi
        G = gt.Graph()
        G.set_directed(False)
        G.add_vertex(10)
        G.add_edge_list([(0, 1), (0, 2), (1, 2), (0, 6), (1, 9), (2, 3), (3, 4), (4, 5), (5, 3), (4, 7), (5, 8)])
        cv_map, _ = bga.map_iterative(G)
        self.assertListEqual(list(cv_map[0]),[0,1])
        self.assertListEqual(list(cv_map[1]),[0,1])
        self.assertListEqual(list(cv_map[2]),[0,2])
        self.assertListEqual(list(cv_map[3]),[0,2])
        self.assertListEqual(list(cv_map[4]),[0,1])
        self.assertListEqual(list(cv_map[5]),[0,1])

    def test_cv_map_3core(self):
        # G è un grafo con 2 cv (0 e 4), fino a k=3
        G = gt.Graph()
        G.set_directed(False)
        G.add_vertex(8)
        G.add_edge_list([(0, 1), (0, 2), (0, 3), (1, 2), (3, 2), (1, 3), (4, 5),(4, 6),(4, 7),(5, 6),(6,7),(7,5),(0, 4),])
        cv_map, _ = bga.map_iterative(G)
        self.assertListEqual(list(cv_map[0]),[0,3])
        self.assertListEqual(list(cv_map[1]),[])
        self.assertListEqual(list(cv_map[2]),[])
        self.assertListEqual(list(cv_map[3]),[])
        self.assertListEqual(list(cv_map[4]),[0,3])
        self.assertListEqual(list(cv_map[5]),[])
        self.assertListEqual(list(cv_map[5]),[])

    def test_core2comp_map_connected(self):
        g = gc.connected_simple_graph()
        _, core2comp_map = bga.map_iterative(g)
        for v in g.iter_vertices():
            self.assertEqual(core2comp_map[v],[0,0])

    def test_core2comp_map_notConnected(self):
        g = gc.not_connected_graph()
        _, core2comp_map = bga.map_iterative(g)
        self.assertEqual(core2comp_map[0],[0,0])
        self.assertEqual(core2comp_map[1],[0,0])
        self.assertEqual(core2comp_map[2],[1,1])
        self.assertEqual(core2comp_map[3],[1,1])


if __name__ == '__main__':
    unittest.main()
