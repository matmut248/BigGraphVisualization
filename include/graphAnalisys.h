#include <ogdf/basic/graph_generators.h>
#include <ogdf/fileformats/GraphIO.h>
#include <string>
#include <vector>

using namespace ogdf;

//creazione grafi randomici
int createRandomGraphGML(std::string path, int nodes, int edges, bool connected);

//funzioni per la visualizzazione
int fmmmLayout(std::string readPath, std::string writePathGML, std::string writePathSVG);
int fmmmLayout(Graph G, std::string writePathGML, std::string writePathSVG);
int dhLayout(Graph G, std::string writePathGML, std::string writePathSVG);
int dhLayout(std::string readPath, std::string writePathGML, std::string writePathSVG);

//funzioni per l'analisi della connettività
Graph connectivity(Graph G);
Graph chooseComponentMax(Graph G);
int connectivityAnalisys(Graph G);
std::vector<node> connectedCompMax(Graph G);
std::vector<node> biconnectedCompMax(Graph G);

//funzioni sui BC-Tree
std::vector<node> cutVertexAnalisys(Graph G);
void cvRatio(std::vector<node> cvG, std::vector<node> cvkG);
int bctreeVisualization(std::string readPath, std::string writePathGML, std::string writePathSVG);

//funzioni per il calcolo della coreness
std::vector<int> nodeLabelling(Graph G);
void kcore(Graph * G, std::vector<int> labels, int k);