#include <ogdf/fileformats/GraphIO.h>
#include <ogdf/basic/simple_graph_alg.h>
#include <string>
#include "../include/graphAnalisys.h"
#include <iostream>
#include <vector>
#include<bits/stdc++.h>

using namespace std;

/**
 * k-core.cpp si occupa di calcolare la coreness di un grafo. 
 *  - Graph kcore(Graph G, int k) prende in input un grafo G e un interno k e ritorna il k core di G.
 *  - void kcore(Graph *G, int k) prende in input un puntatore al grafo G ed elimina tutti i nodi (e archi)
 *      che non appartengono al k-core
 *  - void DFSUtil(node n, vector<bool> &visited, vector<int> &vDegree, int k) si occupa della visita in profondità 
 *      sul grafo aggiornando i gradi dei nodi dopo ogni processamento.
 *  - void nodeLabelling(std::string path) si occupa di etichettare i nodi di un grafo in input con la
 *      loro coreness.
 **/

/**
 * aggiornamento del grado dei nodi
 * @param n nodo corrente.
 * @param visited vettore che tiene traccia dei nodi visitati.
 * @param vDegree vettore che tiene traccia del grado dei nodi.
 * @param k livello di coreness.
 */
void DFSUtil(node n, vector<bool> &visited, vector<int> &vDegree, int k)
{
    visited[n->index()] = true;                     // etichetta il nodo corrente n come visitato
    
    for(adjEntry a : n->adjEntries)                 // per ogni nodo adiacente a n
    {
        // se il grado di n < k questo non appartiene al k-core e aggiorno il grado del vicino
        if(vDegree[n->index()] < k){                 
            if(vDegree[a->twinNode()->index()]>0)
                vDegree[a->twinNode()->index()]--;
            //sto in una catena di nodi, devo risalire la catena e aggiornare i gradi di tutti i nodi
            if(vDegree[a->twinNode()->index()]==1 && visited[a->twinNode()->index()])                  
                DFSUtil(a->twinNode(), visited, vDegree, k);
        }
        // visito il vicino
        if(!visited[a->twinNode()->index()]){         
            DFSUtil(a->twinNode(), visited, vDegree, k);
        }
    }
}

/**
 * cancella dal grafo in input tutti i nodi che non fanno parte del k-core
 * @param G Grafo.
 * @param k livello di coreness.
 */
void kcore(Graph *G, int k)
{
    int nodes_length = G->numberOfNodes();
    vector<bool> visited(nodes_length, false);
    vector<int> vDegree(nodes_length);

    int mindeg = INT_MAX;
    node startvertex;

    // inizializzo il grado dei nodi e scelgo come vertice iniziale quello con grado minore
    for (node n : G->nodes)
    {
        vDegree[n->index()] = n->adjEntries.size();
        if (vDegree[n->index()] < mindeg)
        {
            mindeg = vDegree[n->index()];
            startvertex = n;
        }
    }
    
    DFSUtil(startvertex, visited, vDegree, k);
    
     // se il grafo non è connesso
    for (node n : G->nodes)
        if (visited[n->index()] == false)
            DFSUtil(n, visited, vDegree, k);

    
    // scorro una lista di tutti i nodi e se il grado del nodo n è < k
    // elimino sia n che tutti gli archi che incidono n
    if(G->numberOfNodes()>0){
        vector<node> lista;
        for (node n : G->nodes)
            lista.push_back(n);
        for (node n : lista)
            if(vDegree[n->index()] < k)
                G->delNode(n);
    }

}

/**
 * cancella dal grafo in input tutti i nodi che non fanno parte del k-core
 * @param G Grafo.
 * @param k livello di coreness.
 * @return grafo aggiornato
 */
Graph kcore(Graph G, int k)
{
    Graph * p = &G;
    kcore(p, k);
    return G;
}

/**
 * etichetta i nodi con la coreness
 * @param path percorso del file che contiene il grafo.
 */
void nodeLabelling(std::string path)
{
    Graph G;
    if (!GraphIO::read(G, path)) {
        std::cerr << "impossibile aprire il file" << std::endl;
        return;
    }
    Graph * p = &G;
    std::map<int,int> labels;   // chiave = nodo ; valore = k
    int k = 0;  

    // finchè G non è vuoto lancio la funzione kcore con k crescenti e aggiorno
    // ad ogni passo la mappa labels
    while (G.numberOfNodes()>0)
    {
        std::cout  <<endl;
        std::cout << "K: "<< k <<endl;
        kcore(p,k);
        for (node n : G.nodes)
        {
            labels[n->index()] = k;
        }
        k++;
    }
    // stampa dei risultati
    auto iter = labels.begin();
    while (iter != labels.end())    
    {
        std::cout << "CHIAVE: " << iter->first << "\tVALORE: " << iter->second << endl;
        iter++;
    }
}

