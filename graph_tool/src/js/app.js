
var nodes;                              // nodi del cctree
var nodes_depth;                        // profondità dei nodi del cctree
var nodes_parent;                       // parent dei nodi del cctree (se layer = 1, parent = -1)
var nodes_type;                         // tipo dei nodi del cctree (se cv = 1, se comp B = 0)
var nodes_internal_size;                // quantità di archi di g contenuti nel nodo del cctree
var edges_intra_layer;                  // archi del cctree tra nodi dello stesso livello di coreness
var edges_between_layer;                // archi del cctree tra nodi di diverso livello di coreness
var num_nodes;                          // numero di nodi del cctree
var num_edges;                          // numero di archi del cctree
var num_CV;                             // numero di cut-vertex del cctree
var num_comp_B;                         // numero di componenti biconnesse del cctree
var maxDepth;                           // profondità massima del cctree
var nodes_in_layer;                     // numero di nodi per ogni livello di profondità
var width = window.innerWidth;
var height = window.innerHeight;

let app = new PIXI.Application({
    width: window.innerWidth,         // default: 800
    height: window.innerHeight,        // default: 600
    antialias: true,    // default: false
    transparent: true, // default: false
    resolution: 1       // default: 1
  }
);
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
document.body.appendChild(app.view);
app.loader.load(setup);

function setup(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
    console.log(this.readyState +" "+ this.status)
        if (this.readyState == 4 && this.status == 200) {
            init_data(this);
            draw_graph();
        }
    };
    xhttp.open("GET", "data/graph.xml", true);
    xhttp.send();

}

function draw_graph(){
    var margin = 5;                                         //margine tra i nodi disegnati
    var cv_radius = 7;                                      // raggio dei cv
    var bcomp_height = 15;                                   // lunghezza delle componenti biconnesse
    var bcomp_width = 0;                                    // larghezza delle componenti biconnesse
    var vertical_layer_space = height / (maxDepth+1);       // segmentazione verticale del canvas
    var current_depth = 0;                                  // livello di coreness corrente
    var nodes_dimension = new Array();                      // posizione dei nodi del cctree nel canvas [x,y,width]
    var sum_internal_size_first_layer = new Array();        //somma degli archi di g per k = 1
    var last_node_added = [0,0]                             //x e width dell'ultimo nodo aaggiunto

    /* funzione che mappa value, appartenente all'intervallo [x1,y1], sull'intervallo [x2,y2]*/
    const map_on_range = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;
    // inizializzo sum internal size
    temp = this.nodes_internal_size.slice( 0, (num_comp_B[1] + num_CV[1]) )
    sum_internal_size_first_layer = temp.reduce((a, b) => a + b)

    /* DISEGNO DEI NODI*/
    for(var i = 0; i < nodes.length; i++){
        /*devo capire se sto nello stesso liv di coreness, quindi se sto disegnando il primo nodo della riga*/
        k = this.nodes_depth[i];                                 // profondità del nodo corrente
        same_layer = 1                                      // var binaria = 0 se ho cambiato layer, 1 altrimenti
        if(current_depth != k){
            last_node_added = [0,0]
            same_layer = 0
        }
        current_depth = k;

        /*devo identificare prima x e y del nodo da disegnare, poi la larghezza*/
        y = vertical_layer_space * (this.maxDepth + 1 - k)
        if(this.nodes_parent[i] == -1){                          // se sto sul primo layer
            /*x = (posizione del nodo disegnato in precedenza + larghezza nodo prec) * stesso_layer + piccolo margine*/
            x = (last_node_added[0] + last_node_added[1]) * same_layer + margin
            /*devo mappare la larghezza del nodo corrente sul totale degli archi del liv di coreness corrente*/
            bcomp_width = map_on_range(this.nodes_internal_size[i], 0, sum_internal_size_first_layer, 0, width - cv_radius * 2 * this.num_CV[k] - margin * (this.num_CV[k]+this.num_comp_B[k]-1))
        }
        else{
            parent = this.nodes_parent[i]
            /*x = max[(posizione del nodo disegnato in precedenza + larghezza nodo prec) * stesso_layer, posizione del parent] + piccolo margine*/
            if(parent == this.nodes_parent[i-1]){
                    x = (last_node_added[0] + last_node_added[1]) * same_layer + margin
            }
            else{
                    x = nodes_dimension[parent][0]
            }
            /*devo mappare la larghezza del nodo corrente sul totale degli archi del parent*/
            bcomp_width = map_on_range(this.nodes_internal_size[i], 0, this.nodes_internal_size[parent], 0, nodes_dimension[parent][2])
        }

        if(nodes_type[i] == 1){                     // sto disegnando un cv
            nodes_dimension[i] = [x, y, cv_radius * 2];
            last_node_added = [x, cv_radius * 2];
            let circle = new PIXI.Graphics();
            circle.beginFill(0x3498db);
            circle.drawCircle(x + cv_radius, y, cv_radius);
            circle.endFill();
            app.stage.addChild(circle);
        }
        else{                                       // sto disegnando una componente B
            nodes_dimension[i] = [x, y, bcomp_width];
            last_node_added = [x, bcomp_width];
            let rect = new PIXI.Graphics();
            rect.beginFill(0xdaa520);
            rect.drawRect(x, y-bcomp_height/2, bcomp_width, bcomp_height);
            rect.endFill();
            app.stage.addChild(rect);
        }

        // linee tratteggiate tra cv corrispondenti in livelli di coreness diversi
        if(this.nodes_parent[i] != -1 && this.nodes_type[this.nodes_parent[i]] == 1){
        console.log(i)
            p_ypos = nodes_dimension[nodes_parent[i]][1] - cv_radius
            dash_factor = 20;
            draw = true;
            x_temp = nodes_dimension[i][0] + cv_radius
            y_temp = nodes_dimension[i][1] + cv_radius
            segment = (p_ypos - y_temp) / dash_factor
            for(var j = 1; j <= dash_factor; j++){
                if(draw == true){
                    let line = new PIXI.Graphics();
                    line.lineStyle(0.5, 0x444444, 2);
                    line.moveTo(x_temp, y_temp)
                    line.lineTo(x_temp, y_temp + segment)
                    app.stage.addChild(line);
                    draw = false;
                }
                else{
                    draw = true
                }
                y_temp += segment
            }
        }
    }

    /* DISEGNO DEGLI ARCHI*/
    for(var i = 0; i < edges_intra_layer.length; i++){
        s = edges_intra_layer[i][0]
        t = edges_intra_layer[i][1]
        x1 = nodes_dimension[s][0] + margin
        y1 = nodes_dimension[s][1] + cv_radius
        x2 = nodes_dimension[t][0] + nodes_dimension[t][2]/2
        y2 = nodes_dimension[t][1] + bcomp_height/2
        let arc = new PIXI.Graphics();
        arc.lineStyle(2, 0x444444, 2);
        arc.moveTo(x1,y1)
        arc.quadraticCurveTo((x1+x2)/2, y2 + 30, x2, y2)
        app.stage.addChild(arc);
    }

    app.renderer.render(app.stage);

}


function load_xml_cctree() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
  console.log(this.readyState +" "+ this.status)
    if (this.readyState == 4 && this.status == 200) {
      init_data(this);
    }
  };
  xhttp.open("GET", "data/graph.xml", true);
  xhttp.send();
}

function init_data(xml){
    var xmlDoc = xml.responseXML;
    nodes_xml = xmlDoc.getElementsByTagName("node");
    edges_xml = xmlDoc.getElementsByTagName("edge");
    this.nodes = new Array()
    this.nodes_depth = new Array()
    this.nodes_parent = new Array()
    this.nodes_type = new Array()
    this.edges_between_layer = new Array()
    this.edges_intra_layer = new Array()
    this.nodes_internal_size = new Array()
    for(var i = 0; i < nodes_xml.length; i++){
        node = parseInt(nodes_xml[i].id.substring(1))
        node_depth = parseInt(nodes_xml[i].children[0].textContent)
        node_internal_size = parseInt(nodes_xml[i].children[1].textContent)
        node_parent = parseInt(nodes_xml[i].children[2].textContent)
        node_type = parseInt(nodes_xml[i].children[3].textContent)
        this.nodes.push(node)
        this.nodes_depth.push(node_depth)
        this.nodes_internal_size.push(node_internal_size)
        //console.log(nodes_internal_size)

        if(node_depth == 1){
            this.nodes_parent.push(-1)
        }
        else{
            this.nodes_parent.push(node_parent)
        }
        this.nodes_type.push(node_type)
    }
    for(var i = 0; i < edges_xml.length; i++){
        edge_type = parseInt(edges_xml[i].children[0].textContent)
        s = parseInt(edges_xml[i].attributes.source.textContent.substring(1))
        t = parseInt(edges_xml[i].attributes.target.textContent.substring(1))
        if(edge_type == 1){
            this.edges_intra_layer.push([s,t])
        }
        else{
            this.edges_between_layer.push([s,t])
        }
    }

    this.num_nodes = nodes.length;
    this.num_edges = edges_intra_layer.length + edges_between_layer.length;
    this.maxDepth = parseInt(xmlDoc.getElementsByTagName("data")[0].textContent);
    this.nodes_in_layer = xmlDoc.getElementsByTagName("data")[1].textContent.split(",").map(x=>+x);
    this.num_CV = xmlDoc.getElementsByTagName("data")[2].textContent.split(",").map(x=>+x);
    this.num_comp_B = xmlDoc.getElementsByTagName("data")[3].textContent.split(",").map(x=>+x);
}