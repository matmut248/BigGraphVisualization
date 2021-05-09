#include <ogdf/energybased/FMMMLayout.h>
#include <ogdf/energybased/DavidsonHarelLayout.h>
#include <ogdf/fileformats/GraphIO.h>
#include <iostream>
#include "../include/graphAnalisys.h"

 
using namespace ogdf;

int dhLayout(std::string readPath, std::string writePathGML, std::string writePathSVG)
{
    Graph G;
    if (!GraphIO::read(G, readPath)) {
        std::cerr << "Could not load output-graph.gml" << std::endl;
        return 1;
    }
    dhLayout(G, writePathGML, writePathSVG);

    return 0;
}
 
int dhLayout(Graph G, std::string writePathGML, std::string writePathSVG)
{
    GraphAttributes GA(G,
        GraphAttributes::nodeGraphics |
        GraphAttributes::edgeGraphics |
        GraphAttributes::nodeLabel |
        GraphAttributes::edgeStyle |
        GraphAttributes::nodeStyle |
        GraphAttributes::nodeTemplate);

    GA.directed() = false;
 
    for (node v : G.nodes){
        GA.width(v) = GA.height(v) = 3.0;
        GA.shape(v) = Shape::Ellipse;
    }
    for (edge e : G.edges){
        GA.strokeColor(e) = Color(255,0,0,255);
        GA.strokeWidth(e) = 0.4;
    }
 
    DavidsonHarelLayout dhl;

    dhl.setAttractionWeight(2.0);

    dhl.call(GA);

    GraphIO::write(GA, writePathGML, GraphIO::writeGML);
    GraphIO::write(GA, writePathSVG, GraphIO::drawSVG);
 
    return 0;
}