#include <ogdf/fileformats/GraphIO.h>
#include <ogdf/basic/simple_graph_alg.h>
#include "../include/graphAnalisys.h"


using namespace std;
using namespace ogdf;


/**
 * Etichetta i nodi del grafo con la loro coreness
 * @param G Grafo.
 * @return un vettore che associa al nodo la sua coreness
 **/
vector<int> nodeLabelling(Graph G)
{
    int numberOfNodes = G.numberOfNodes();
    vector<int> degree(numberOfNodes);
    vector<node> vert(numberOfNodes);                              //vetices ordered by degree
    vector<int> pos(numberOfNodes);                                //position of vertices in vert
    int md = 0;                                     //maximum degree


    //initialize degree
    for (node n : G.nodes)
    {
        degree.at(n->index()) = n->adjEntries.size();
        if( degree.at(n->index()) > md)
            md = degree.at(n->index());
    }
    

    //initialize bin
    vector<int> bin(md);                                //bin consists of vertices with the same degree
    for (int d = 0 ; d <= md ; d++)
        bin[d] = 0;

    for (node n : G.nodes)
        bin[degree[n->index()]] ++;

    //determine starting positions of bins in array vert and save it in array bin
    int start = 0;
    for (int d = 0 ; d <=md ; d++)
    {
        int num = bin[d];
        bin[d] = start;
        start += num;
    }

    //put vertices in array vert in according to bin position
    //and save position in array pos
    for (node n : G.nodes)
    {
        pos[n->index()] = bin[degree[n->index()]];
        vert[pos[n->index()]] = n;
        bin[degree[n->index()]] ++;
    }
        
    //recover starting positions of the bins
    for (int d = md ; d>=0 ; d--)
        bin[d] = bin[d-1];
    bin[0] = 0;


    //main loop - 
    for (int i = 0 ; i < numberOfNodes ; i++)
    {
        node n = vert[i];
        for (adjEntry a : n->adjEntries)
        {   
            node u = a->twinNode();
            if (degree[u->index()] > degree[n->index()])
            {
                int du = degree[u->index()];
                int pu = pos[u->index()];
                int pw = bin[du];
                node w = vert[pw];
                if (u->index() != w->index())
                {
                    pos[u->index()] = pw;
                    pos[w->index()] = pu;
                    vert[pu] = w;
                    vert[pw] = u;
                }
                bin[du] ++;
                degree[u->index()] --;
            }
        }
    }
    return degree;
}

/**
 * Core Decomposition of Networks - Vladimir Batagelj
 * @param G Grafo.
 * @param labels vettore che associa un nodo alla sua coreness.
 * @param k il livello di coreness desiderato.
 **/
void kcore(Graph *G, vector<int> labels, int k)
{
    vector<node> nodes;
    for (node n : G->nodes){
        nodes.push_back(n);
    }

    for (node n : nodes){
        if(labels.at(n->index()) < k)
            G->delNode(n);
    }
}