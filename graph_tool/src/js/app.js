
var nodes;                              // nodi del cctree
var nodes_depth;                        // profondità dei nodi del cctree
var nodes_parent;                       // parent dei nodi del cctree (se layer = 1, parent = -1)
var nodes_type;                         // tipo dei nodi del cctree (se cv = 1, se comp B = 0)
var nodes_internal_size;                // quantità di archi di g contenuti nel nodo del cctree
var nodes_width;
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
var texture_compB
var texture_sameCV
var texture_CV
var texture_arc

/*  APP SETTINGS    */
let app = new PIXI.Application({
    width: window.innerWidth,         // default: 800
    height: window.innerHeight,        // default: 600
    antialias: true,    // default: false
    transparent: true, // default: false
    resolution: 1,       // default: 1
}
);
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
app.loader.load(setup);
app.stage.interactive = true;
app.stage.hitArea = new PIXI.Rectangle(0, 0, app.renderer.width/app.renderer.resolution, app.renderer.height/app.renderer.resolution);
document.getElementById("display").appendChild(app.view);

/*  SETUP   */
function setup(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
    console.log(this.readyState +" "+ this.status)
        if (this.readyState == 4 && this.status == 200) {
            init_data(this);
            load_texture();
            draw_graph();
            DragNDrop();
        }
    };
    xhttp.open("GET", "data/graph.xml", true);
    xhttp.send();

}

/*  LETTURA DEI DATI DA XML */
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
    this.nodes_width = new Array()
    for(var i = 0; i < nodes_xml.length; i++){
        node = parseInt(nodes_xml[i].id.substring(1))
        node_depth = parseInt(nodes_xml[i].children[0].textContent)
        node_internal_size = parseInt(nodes_xml[i].children[1].textContent)
        node_parent = parseInt(nodes_xml[i].children[2].textContent)
        node_type = parseInt(nodes_xml[i].children[3].textContent)
        //this.nodes_width.push(nodes_xml[i].children[4].textContent.split(",").map(x=>+x))
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

/*  CARICAMENTO DELLE TEXTURE*/
function load_texture(){
    let rect = new PIXI.Graphics();
    rect.beginFill(0xdaa520);
    rect.drawRect(0,0,32,32);
    rect.endFill();

    let circle = new PIXI.Graphics();
    circle.beginFill(0x3498db);
    circle.drawCircle(0,0,5);
    circle.endFill();

    let line = new PIXI.Graphics();
    line.beginFill(0x555555);
    line.lineStyle(0.5,0x555555,2)
    line.drawRect(0,0,0.5,5)
    line.endFill();

    let arc = new PIXI.Graphics();
    arc.lineStyle(4, 0x444444, 2);
    arc.quadraticCurveTo(32, 32, 64, 0)

    texture_compB = app.renderer.generateTexture(rect)
    texture_CV = app.renderer.generateTexture(circle)
    texture_sameCV = app.renderer.generateTexture(line)
    texture_arc = app.renderer.generateTexture(arc)

}

/*  VISUALIZZAZIONE DEL GRAFO   */
function draw_graph(){
    var margin = 5;                                         //margine tra i nodi disegnati
    var cv_radius = 3;                                      // raggio dei cv
    var bcomp_height = 10;                                   // lunghezza delle componenti biconnesse
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
    //sum_internal_size_first_layer = temp.reduce((a, b) => a + b)
    max_internal_size_first_layer = Math.max(...temp)

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
            bcomp_width = map_on_range(this.nodes_internal_size[i], 1, max_internal_size_first_layer, 20, 50)
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
            bcomp_width = map_on_range(this.nodes_internal_size[i], 0, this.nodes_internal_size[parent], 1, nodes_dimension[parent][2])
        }

        if(nodes_type[i] == 1){                     // sto disegnando un cv
            nodes_dimension[i] = [x, y, cv_radius * 2];
            last_node_added = [x, cv_radius * 2];
            sprite = new PIXI.Sprite(texture_CV);
            sprite.x = x
            sprite.y = y - cv_radius
            sprite.width = cv_radius*2
            sprite.height = cv_radius*2
            app.stage.addChild(sprite);
        }
        else{                                       // sto disegnando una componente B
            nodes_dimension[i] = [x, y, bcomp_width];
            last_node_added = [x, bcomp_width];
            sprite = new PIXI.Sprite(texture_compB);
            sprite.x = x
            sprite.y = y - bcomp_height/2
            sprite.width = bcomp_width
            sprite.height = bcomp_height
            app.stage.addChild(sprite);
        }

        // linee tratteggiate tra cv corrispondenti in livelli di coreness diversi
        if(this.nodes_parent[i] != -1 && this.nodes_type[this.nodes_parent[i]] == 1){
            p_ypos = nodes_dimension[nodes_parent[i]][1] - cv_radius
            dash_factor = 20;
            draw = true;
            x_temp = nodes_dimension[i][0] + cv_radius
            y_temp = nodes_dimension[i][1] + cv_radius
            segment = (p_ypos - y_temp) / dash_factor

            for(var j = 1; j <= dash_factor; j++){
                if(draw == true){
                    sprite = new PIXI.Sprite(texture_sameCV);
                    sprite.x = x_temp - 1.5
                    sprite.y = y_temp
                    sprite.height = segment
                    sprite.width = 3
                    sprite.alpha = 0.5
                    app.stage.addChild(sprite);
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
        sprite = new PIXI.Sprite(texture_arc);
        sprite.x = x1
        sprite.y = y1
        sprite.height = 10
        sprite.width = x2-x1
        sprite.alpha = 0.2
        app.stage.addChild(sprite);
    }

    app.renderer.render(app.stage);
}

/*  INTERAZIONI */
function zoom(isZoomIn) {
    direction = isZoomIn ? 1 : -1;
    var factor = (1 + direction * 0.1);
    app.stage.scale.x *= factor;
    app.stage.scale.y *= factor;
    app.stage.hitArea.width /= factor;
    app.stage.hitArea.height /= factor;
}

function event_handler_zoom(event){
    if (event.deltaY < 0){
        isZoomIn = false;
    }
    else{
        isZoomIn = true;
    }
    zoom(isZoomIn)
}

function DragNDrop() {
    var stage = app.stage;

    var isDragging = false,
    prevX, prevY;

    stage.pointerdown = function (moveData) {
      var pos = moveData.data.global;
      prevX = pos.x; prevY = pos.y;
      isDragging = true;
    };

    stage.pointermove = function (moveData) {
      if (!isDragging) {
        return;
      }
      var pos = moveData.data.global;
      var dx = pos.x - prevX;
      var dy = pos.y - prevY;

      stage.position.x += dx;
      stage.position.y += dy;
      prevX = pos.x; prevY = pos.y;
      stage.hitArea.x -= dx;
      stage.hitArea.y -= dy;
    };

    stage.pointerup = function (moveDate) {
      isDragging = false;
    };
}

function reset(){
    app.stage.setTransform()
    app.stage.hitArea = new PIXI.Rectangle(0, 0, app.renderer.width/app.renderer.resolution, app.renderer.height/app.renderer.resolution);
}

