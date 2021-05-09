#include <ogdf/fileformats/GraphIO.h>
#include <ogdf/basic/simple_graph_alg.h>
#include <ogdf/decomposition/BCTree.h>
#include "../include/graphAnalisys.h"

using namespace ogdf;
using namespace std;

int main()
{
    //lettura grafo
    Graph G;
    if (!GraphIO::read(G,"gml/amazon.gml")) {
        std::cerr << "impossibile aprire il file" << std::endl;
        return 1;
    }
    vector<node> cvG;                       //vertici di taglio di G
    vector<node> cvkG;                      //vertici di taglio del k-core di G
    vector<int> labels = nodeLabelling(G);  //etichette coreness
    
    //analisi grafo iniziale
    G = connectivity(G);
    cvG = cutVertexAnalisys(G);

    //analisi 2-core
    Graph kG = G;
    Graph *p = &kG;
    
    kcore(p, labels, 2);
    cout << endl << "2-CORE" << endl;
    connectivity(kG);
    cvkG = cutVertexAnalisys(kG);
    cvRatio(cvG, cvkG);
    
    //analisi 3 core
    kcore(p, labels, 3);
    cout << endl << "3-CORE" << endl;
    kG = connectivity(kG);
    cvkG = cutVertexAnalisys(kG);
    cvRatio(cvG, cvkG);

    return 1;
}