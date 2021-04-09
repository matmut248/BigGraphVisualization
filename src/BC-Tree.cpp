#include <ogdf/energybased/FMMMLayout.h>
#include <ogdf/fileformats/GraphIO.h>
#include <ogdf/decomposition/BCTree.h>
#include <ogdf/decomposition/DynamicBCTree.h>
#include <iostream>
#include "../include/graphAnalisys.h"
 
using namespace ogdf;
using namespace std;

/**
 * visualizza il BC-Tree di un grafo utilizzando l'algoritmo fmmm.
 * @param readPath file gml che contiene il grafo in input.
 * @param writePathGML path del file gml dove salvare il grafo del bctree.
 * @param writePathSVG path del file svg dove salvare il grafo del bctree.
 */
int bctreeVisualization(std::string readPath, std::string writePathGML, std::string writePathSVG)
{
    //caricamento del grafo G
    Graph G;
    if (!GraphIO::read(G, readPath)) {
        std::cerr << "Could not load file" << std::endl;
        return 1;
    }

    //inizializzazione del BC-Tree BC e del grafo associato BCG
    BCTree * BC = new BCTree(G);
    Graph BCG = BC->bcTree();

    //GA serve per modificare gli attributi stilistici di BCG
    GraphAttributes GA(BCG,
        GraphAttributes::nodeGraphics |
        GraphAttributes::edgeGraphics |
        GraphAttributes::nodeLabel |
        GraphAttributes::edgeStyle |
        GraphAttributes::nodeStyle |
        GraphAttributes::nodeLabelPosition|
        GraphAttributes::nodeTemplate);
    
    GA.directed() = false;
 
    for (node v : BCG.nodes){

        GA.label((v)) = to_string(v->index());        //ogni nodo ha un'etichetta uguale al suo id
        GA.xLabel(v) = GA.point(v).m_x - 10.0;
        
        if(BC->typeOfBNode(v) == BCTree::BNodeType::CComp){     //se v è un cut-vertex
            GA.width(v) = GA.height(v) = 6.0;
            GA.fillColor(v) = Color(0,255,0,255);
            GA.shape(v) = Shape::Ellipse;
        }
        else{                                                   //altrimenti
           GA.width(v) = GA.height(v) = 10.0;
           GA.shape(v) = Shape::Rect;
        }
    }
    for (edge e : BCG.edges){
        GA.strokeColor(e) = Color(255,0,0,255);
        GA.strokeWidth(e) = 0.4;
    }

    for (node v : G.nodes){
        GA.label(BC->bcproper(v)) = to_string(v->index());        //ogni nodo ha un'etichetta uguale al suo id
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

    //stampa il numero delle componenti biconnesse
    std::cout << std::endl;
    std::cout << "il BC-Tree contiene " << BC->numberOfBComps() << " blocchi";
    std::cout << " e " << BC->numberOfCComps() << " vertici di taglio" << std::endl;
    std::cout << std::endl;
 
    return 0;
}

/**
 * restituisce un vettore che contiene i vertici di taglio di G
 * @param G il grafo.
 */
vector<node> cutVertexAnalisys(Graph G)
{
    vector<node> cv;
    BCTree *BC = new BCTree(G);

    for (node n : G.nodes){
        if (BC->typeOfGNode(n) == BCTree::GNodeType::CutVertex)
            cv.push_back(n);
    }

    return cv;
}

/**
 * stampa la percentuale di vertici di taglio di G che sono rimasti 
 * nel k-core di G.
 * @param cvG il vettore dei vertici di taglio di G.
 * @param cvkG il vettore dei vertici di taglio del k-core di G.
 */
void cvRatio(vector<node> cvG, vector<node> cvkG)
{
    int counter = 0;
    for (node n : cvkG)
        if (find(cvG.begin(), cvG.end(), n) != cvG.end())
            counter++;

    double perc = (((double)counter/cvG.size())*100);
    cout << endl << "E' rimasto il " << perc << "% dei vertici di taglio del grafo iniziale ";
    cout << "(" << counter << "/" << cvG.size() << ")" << endl;

    return;
}