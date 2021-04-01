#include <ogdf/fileformats/GraphIO.h>
#include <ogdf/decomposition/BCTree.h>
#include "../include/graphAnalisys.h"

using namespace ogdf;
using namespace std;

int main(string path)
{
    Graph G;
    if (!GraphIO::read(G,path)) {
        std::cerr << "impossibile aprire il file" << std::endl;
        return 1;
    }

    vector<node> lista;
    for (node n : G.nodes)
    {
        lista.push_back(n);
    }

    Graph g2core = G;
    
    connectivityAnalisys(G);


    /*  costruisco il sottografo indotto dalla 
        componente biconnessa più grande    */
    vector<node> nodes = biconnectedCompMax(G);
    for(node n : lista)
    {
        if(find( begin(nodes), end(nodes), n) == end(nodes))
        {
            g2core.delNode(n);
        }
    }

    Graph g3core = g2core;
    g3core = kcore(g3core,3);

    connectivityAnalisys(g3core);

    return 1;
}