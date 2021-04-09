#include <ogdf/fileformats/GraphIO.h>
#include <ogdf/basic/simple_graph_alg.h>
#include <ogdf/decomposition/BCTree.h>
#include <string>
#include <iterator>
#include <set>
#include <iostream>
#include "../include/graphAnalisys.h"

using namespace ogdf;
using namespace std;

/**
 * chiama connectivityAnalisys(G) e chooseComponentMax(G)
 */
Graph connectivity(Graph G)
{
    connectivityAnalisys(G);
    if(!isConnected(G))
    {
        G = chooseComponentMax(G);
        cout << "PRENDO LA COMPONENTE CONNESSA PIU' GRANDE (" << G.numberOfNodes() << " nodi)" << endl;
    }

    return G;
}

/**
 * analizza la connettività di un grafo e stampa i risultati.
 * @param G il grafo.
 */
int connectivityAnalisys(Graph G)
{
    NodeArray<int> component = NodeArray<int>(G);
    EdgeArray<int> bicomponent = EdgeArray<int>(G);
    List<node> isolated; 
    set<node> bicomp_nodes;  

    //NODI E ARCHI
    cout << "Il grafo ha " << G.numberOfNodes() << " nodi" << endl;
    cout << "Il grafo ha " << G.numberOfEdges() << " archi" << endl;

    // COMPONENTI CONNESSE
    cout << " ---- COMPONENTI CONNESSE ----" << endl;
    bool isconn = isConnected(G);
    if (isconn == 0)
        cout <<  "il grafo non è connesso" << endl;
    else
        cout <<  "il grafo è connesso" << endl;

    int num = connectedComponents(G, component, &isolated);
    cout << "in totale sono " << num << " componenti connesse" << endl;
    
    num = connectedCompMax(G).size();
    cout << "la componente connessa piu' grande contiene " << num << " nodi" <<endl;

    // COMPONENTI BICONNESSE
    cout << " ---- COMPONENTI BICONNESSE ----" << endl;
    bool isbiconn = isBiconnected(G);
    if (isbiconn == 0)
        cout <<  "il grafo non è biconnesso" << endl;
    else
        cout <<  "il grafo è biconnesso" << endl;

    num = biconnectedComponents(G, bicomponent);
    cout << "in totale sono " << num << " componenti biconnesse" << endl;

    //num = biconnectedCompMax(G).size();
    //cout << "la componente biconnessa piu' grande contiene " << num << " nodi" <<endl;
    
    return 0;
}

/**
 * calcola la componente connessa più grande.
 * @param G il grafo.
 * @return i nodi di G che appartengono alla componente connessa più grande.
 */
vector<node> connectedCompMax(Graph G)
{
    NodeArray<int> component = NodeArray<int>(G);
    set<node> comp_nodes_curr;
    set<node> comp_nodes_max;
    vector<node> nodes;

    int num = connectedComponents(G, component);
    
    for (int i=0; i<num; i++)
    {
        for(node n : G.nodes)
            if(component[n]==i)
                comp_nodes_curr.insert(n);

        if(comp_nodes_curr.size() > comp_nodes_max.size())
            comp_nodes_max = comp_nodes_curr;

        comp_nodes_curr.clear();
    }

    for (node n : comp_nodes_max)
        nodes.push_back(n);

    return nodes;
}

/**
 * calcola la componente biconnessa più grande.
 * @param G il grafo.
 * @return i nodi di G che appartengono alla componente biconnessa più grande.
 */
vector<node> biconnectedCompMax(Graph G)
{
    
    EdgeArray<int> component = EdgeArray<int>(G);
    //bicomp_nodes[i] rappresenta l'i-esima componente connessa
    //bicomp_nodes[i] è un set per evitare la ripetizione dei nodi
    set<node> bicomp_nodes_curr;
    set<node> bicomp_nodes_max;
    vector<node> nodes;

    int binum = biconnectedComponents(G, component);

    for (int i=0; i<binum; i++)
    {
        for(edge e : G.edges)
        {
            if(component[e]==i)
            {
                bicomp_nodes_curr.insert(e->source());
                bicomp_nodes_curr.insert(e->target());
            }
        }
        if(bicomp_nodes_curr.size() > bicomp_nodes_max.size())
            bicomp_nodes_max = bicomp_nodes_curr;
        bicomp_nodes_curr.clear();
    }
    for (node n : bicomp_nodes_max)
    nodes.push_back(n);
        

    return nodes;
}

/**
 * calcola il sottografo costituito dalla componente connessa più grande.
 * @param G il grafo.
 * @return il sottografo costituito dalla componente connessa più grande di G.
 */
Graph chooseComponentMax(Graph G)
{
    NodeArray<int> component = NodeArray<int>(G);
    set<node> comp_nodes_curr;
    set<node> comp_nodes_max;
    vector<node> listAllNodes;
    int indexCOmpMax = -1;

    int num = connectedComponents(G, component);
    
    for (int i=0; i<num; i++)
    {
        for(node n : G.nodes)
            if(component[n]==i)
                comp_nodes_curr.insert(n);

        if(comp_nodes_curr.size() > comp_nodes_max.size()){
            comp_nodes_max = comp_nodes_curr;
            indexCOmpMax = i;
        }
        comp_nodes_curr.clear();
    }

    for (node n : G.nodes)
        listAllNodes.push_back(n);

    for (node n : listAllNodes)
        if(component[n] != indexCOmpMax)
            G.delNode(n);

    return G;
}