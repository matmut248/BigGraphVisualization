#include <ogdf/basic/graph_generators.h>
#include <ogdf/fileformats/GraphIO.h>
#include "../include/graphAnalisys.h"
 
using namespace ogdf;

/**
 * crea un grafo randomico e lo scive in un file gml.
 * 
 * @param path GML file path.
 * @param nodes is the number of nodes of the generated graph.
 * @param edges is the number of edges of the generated graph.
 * @param connected is true if the generated graph is connected.
 */
int createRandomGraphGML(string path, int nodes, int edges, bool connected)
{
    Graph G;
    GraphAttributes GA(G, GraphAttributes::nodeLabel);

    if(connected)
        randomSimpleConnectedGraph(G, nodes, edges);
    else
        randomSimpleGraph(G, nodes, edges);
 
    for (node v : G.nodes){
         GA.label(v) = to_string(v->index());
    }
    GA.directed() = false;

    GraphIO::write(GA, path, GraphIO::writeGML);
 
    return 0;
}