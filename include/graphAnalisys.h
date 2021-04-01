#include <ogdf/basic/graph_generators.h>
#include <ogdf/fileformats/GraphIO.h>
#include <string>
#include <vector>
#include <set>

using namespace ogdf;

int createRandomGraphGML(std::string path, int nodes, int edges, bool connected);

int connectivityAnalisys(Graph G);

std::vector<node> connectedCompMax(Graph G);

std::vector<node> biconnectedCompMax(Graph G);

int fmmmLayout(std::string readPath, std::string writePathGML, std::string writePathSVG);

int fmmmLayout(Graph G, std::string writePathGML, std::string writePathSVG);

int bctreeVisualization(std::string readPath, std::string writePathGML, std::string writePathSVG);

int dhLayout(Graph G, std::string writePathGML, std::string writePathSVG);

int dhLayout(std::string readPath, std::string writePathGML, std::string writePathSVG);

void DFSUtil(node n, std::vector<bool> &visited, std::vector<int> &vDegree, int k);

void kcore(Graph * G, int k);

Graph kcore(Graph G, int k);

void kcore_analisys(std::string path, int k);

void nodeLabelling(std::string path);

int procedure(std::string path);