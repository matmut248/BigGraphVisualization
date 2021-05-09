#include <ogdf/energybased/FMMMLayout.h>
#include <ogdf/fileformats/GraphIO.h>
#include <ogdf/decomposition/BCTree.h>
#include <iostream>
#include "../include/graphAnalisys.h"
 
using namespace ogdf;

/**
 * Visualize a graph read from GML file, using The fast multipole multilevel layout algorithm.
 * @param readPath GML input file path.
 * @param writePathGML GML output file path.
 * @param writePathSVG SVG output file path.
 */
int fmmmLayout(std::string readPath, std::string writePathGML, std::string writePathSVG)
{
     Graph G;
     if (!GraphIO::read(G, readPath)) {
        std::cerr << "Could not load file" << std::endl;
        return 1;
    }
    fmmmLayout(G, writePathGML, writePathSVG);

    return 0;
}

/**
 * Visualize a graph G using The fast multipole multilevel layout algorithm.
 * @param G input graph.
 * @param writePathGML GML output file path.
 * @param writePathSVG SVG output file path.
 */
int fmmmLayout(Graph G, std::string writePathGML, std::string writePathSVG)
{
    GraphAttributes GA(G,
        GraphAttributes::nodeGraphics |
        GraphAttributes::edgeGraphics |
        GraphAttributes::nodeLabel |
        GraphAttributes::nodeLabelPosition|
        GraphAttributes::edgeStyle |
        GraphAttributes::nodeStyle |
        GraphAttributes::nodeTemplate);

    BCTree * BC = new BCTree(G);

    GA.directed() = false;
 
    for (node v : G.nodes){
        GA.label(v) = to_string(v->index());
        GA.xLabel(v) = GA.point(v).m_x - 10.0;
        GA.width(v) = GA.height(v) = 10.0;
        GA.shape(v) = Shape::Ellipse;
        if(BC->typeOfGNode(v) == BCTree::GNodeType::CutVertex){     //se v è un cut-vertex
            GA.fillColor(v) = Color(0,255,0,255);
        }
    }
    for (edge e : G.edges){
        GA.strokeColor(e) = Color(255,0,0,255);
        GA.strokeWidth(e) = 0.4;
    }
 
    FMMMLayout fmmm;
 
    fmmm.useHighLevelOptions(true);
    fmmm.unitEdgeLength(15.0);
    fmmm.newInitialPlacement(true);
    fmmm.qualityVersusSpeed(FMMMOptions::QualityVsSpeed::GorgeousAndEfficient);
    
    fmmm.call(GA);
    GA.scale(2.0,2.0,false);

    GraphIO::write(GA, writePathGML, GraphIO::writeGML);
    GraphIO::write(GA, writePathSVG, GraphIO::drawSVG);
 
    return 0;
}

