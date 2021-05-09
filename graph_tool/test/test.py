import unittest
import graph_tool.all as gt
import graph_creator as gc
import sys
import os
sys.path.append(os.path.join(os.path.dirname(sys.path[0]), 'src'))
#import big_graph_analisys as bga


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


if __name__ == '__main__':
    unittest.main()
