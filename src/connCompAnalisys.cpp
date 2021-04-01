#include <ogdf/fileformats/GraphIO.h>
#include <ogdf/basic/simple_graph_alg.h>
#include <string>
#include <iterator>
#include <set>
#include <iostream>
#include "../include/graphAnalisys.h"

using namespace ogdf;
using namespace std;


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

    // COMPONENTI CONNESSE
    bool isconn = isConnected(G);
    if (isconn == 0)
        cout <<  "il grafo non è connesso" << endl;
    else
        cout <<  "il grafo è connesso" << endl;

    int num = connectedComponents(G, component, &isolated);
    cout << "in totale sono " << num << " componenti connesse" << endl;

    // stampa delle componenti connesse
    for (int i=0; i<num; i++)
    {
        cout << "componente " << i << ": { ";
        for(node n : G.nodes)
        {
            if(component[n]==i)
                cout << n << ", ";
        }
        cout << "}" << endl;
    }


    // COMPONENTI BICONNESSE
    bool isbiconn = isBiconnected(G);
    if (isbiconn == 0)
        cout <<  "il grafo non è biconnesso" << endl;
    else
        cout <<  "il grafo è biconnesso" << endl;

    int binum = biconnectedComponents(G, bicomponent);
    cout << "in totale sono " << binum << " componenti biconnesse" << endl;
    
    // stampa delle componenti biconnesse
    for (int i=0; i<binum; i++)
    {
        cout << "componente biconnessa " << i << ": { ";

        // salvo i nodi in un set per evitare ripetizioni
        for(edge e : G.edges)
        {
            if(bicomponent[e]==i)
            {
                bicomp_nodes.insert(e->source());
                bicomp_nodes.insert(e->target());
            }
        }
        for (node n : bicomp_nodes)
        {
            cout << n << ", ";
        }
        cout << "}" << endl;
        bicomp_nodes.clear();
    }
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
