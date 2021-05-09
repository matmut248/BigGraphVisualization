import networkx as nx 
import sys
sys.path.insert(1, 'C:/Users/matti/Documents/Tesi magistrale/BigGraphVisualization/BigGraphVisualization')
#import k_core_analisys as kca
import connectivity as conn
import createG

range_coreness = range(2,6)			#livelli di coreness di interesse

#preprocessing
graph = nx.read_gml("gml/dblp.gml", label="id")
#graph = createG.newG()

print("ho letto il grafo")

if(nx.is_directed(graph)):
	graph = nx.to_undirected(graph)	

G = nx.Graph(graph)										#copia perchè è freeze

if(nx.number_of_selfloops(G) > 0):
	G.remove_edges_from(nx.selfloop_edges(G))


#analize connectivity
print("Analisi del grafo iniziale")
conn.connectivity_analisys(G)
cv = list(nx.articulation_points(G))
print("numero di vertici di taglio: " + str(len(cv)))

for i in range_coreness:
	print("\nAnalisi del " + str(i) + "-core")
	kG = nx.k_core(G,i)
	if(nx.number_of_nodes(kG) == 0):
		print("non ci sono più nodi")
		break
	else:
		conn.connectivity_analisys(kG)
		cvK = list(nx.articulation_points(kG))
		print("numero di vertici di taglio: " + str(len(cvK)))
		conn.cv_ratio(cv, cvK)

