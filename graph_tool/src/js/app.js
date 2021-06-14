
var nodes;                              // nodi del cctree
var nodes_depth;                        // profondità dei nodi del cctree
var nodes_parent;                       // parent dei nodi del cctree (se layer = 1, parent = -1)
var nodes_type;                         // tipo dei nodi del cctree (se cv = 1, se comp B = 0)
var nodes_internal_size;                // quantità di archi di g contenuti nel nodo del cctree     DA TOGLIERE
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
var height = window.innerHeight * 0.95;
var texture_compB
var texture_sameCV
var texture_CV
var texture_arc
var prevX = 0
var prevY = 0
var nodi = []
var archi = []
var cvTocv = []
var hidden_edges = true;
var vertical_layer_space = 0

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
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
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
            coreness_filtering_init();
            load_texture();
            draw_graph();
            DragNDrop();
        }
    };
    xhttp.open("GET", "data/stanford.xml", true);
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
        this.nodes_width.push(nodes_xml[i].children[4].textContent.split(",").map(x=>+x))
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
    arc.quadraticCurveTo(128, 128, 256, 0)

    texture_compB = app.renderer.generateTexture(rect)
    texture_CV = app.renderer.generateTexture(circle)
    texture_sameCV = app.renderer.generateTexture(line)
    texture_arc = app.renderer.generateTexture(arc)

    PIXI.Texture.addToCache(texture_compB, "texture_compB")
    PIXI.Texture.addToCache(texture_CV, "texture_CV")
    PIXI.Texture.addToCache(texture_sameCV, "texture_sameCV")
    PIXI.Texture.addToCache(texture_arc, "texture_arc")

}

/*  VISUALIZZAZIONE DEL GRAFO   */
function draw_graph(){
    var margin = 5;                                         //margine tra i nodi disegnati
    var cv_radius = 3;                                      // raggio dei cv
    var bcomp_height = 10;                                   // lunghezza delle componenti biconnesse
    var bcomp_width = 0;                                    // larghezza delle componenti biconnesse
    var min_bcomp_width = 5;
    vertical_layer_space = Math.max(height / (maxDepth+1), 40);       // segmentazione verticale del canvas
    var current_depth = 0;                                  // livello di coreness corrente
    var nodes_dimension = new Array();                      // posizione dei nodi del cctree nel canvas [x,y,width]
    var sum_internal_size_first_layer = new Array();        //somma degli archi di g per k = 1
    var last_node_added = [0,0]                             //x e width dell'ultimo nodo aaggiunto
    var last_child_added = [0,0]

    /* DISEGNO DEI NODI*/
    for(var i = 0; i < nodes.length; i++){

        last_child_added[i] = []
        /*devo capire se sto nello stesso liv di coreness, quindi se sto disegnando il primo nodo della riga*/
        k = this.nodes_depth[i];                                // profondità del nodo corrente
        same_layer = 1                                          // var binaria = 0 se ho cambiato layer, 1 altrimenti
        if(current_depth != k){
            last_node_added = [0,0]
            same_layer = 0
        }
        current_depth = k;

        /*devo identificare x, y e width del nodo*/
        //y = vertical_layer_space * (this.maxDepth + 1 - k)            // se voglio visualizzare tutti i livelli
        y =  vertical_layer_space * (- k) + height                      //se considero un spazio minimo in verticale tra i livelli


        if(this.nodes_width[i][0] != 0 || this.nodes_width[i][1] != 0){     //se il nodo corrente ha foglie nel sottoalbero
            bcomp_width = (this.nodes_width[i][0] * 2 * cv_radius) + (this.nodes_width[i][1] * min_bcomp_width) + (margin * (this.nodes_width[i][0] +this.nodes_width[i][1] - 1))
        }
        else{                                                               //se il nodo corrente è una foglia
            bcomp_width = min_bcomp_width
        }

        if(this.nodes_parent[i] == -1){                          // se sto sul primo layer
            /*x = (posizione del nodo disegnato in precedenza + larghezza nodo prec) * stesso_layer + piccolo margine*/
            x = (last_node_added[0] + last_node_added[1]) * same_layer + margin
        }
        else{
            parent = this.nodes_parent[i]
            if(last_child_added[parent].length == 0){       // se sto disegnando il primo figlio del parent
                x = nodes_dimension[parent][0]              // prendo le dimensioni del parent
            }
            else{
                /* altrimenti prendo le dimensioni dell'ultimo figlio + un margine*/
                x = (last_child_added[parent][0] + last_child_added[parent][1]) * same_layer + margin
            }
        }

        //bcomp_width = min_bcomp_width
        //x = (last_node_added[0] + last_node_added[1]) * same_layer + margin

        if(nodes_type[i] == 1){                     // sto disegnando un cv
            nodes_dimension[i] = [x, y, cv_radius];
            last_node_added = [x, 2*cv_radius];
            last_child_added[this.nodes_parent[i]] = [x,2*cv_radius]
            new_node = new Node(i, x, y - cv_radius, cv_radius*2,  cv_radius*2, this.nodes_depth[i], 1, this.nodes_parent[i], this.nodes_width[i])
            this.nodi.push(new_node)
        }
        else{                                       // sto disegnando una componente B
            nodes_dimension[i] = [x, y, bcomp_width];
            last_node_added = [x, bcomp_width];
            last_child_added[this.nodes_parent[i]] = [x, bcomp_width]
            new_node = new Node(i, x, y - bcomp_height/2, bcomp_width,  bcomp_height, this.nodes_depth[i], 0, this.nodes_parent[i], this.nodes_width[i])
            this.nodi.push(new_node)
        }

        // linee tratteggiate tra cv corrispondenti in livelli di coreness diversi
        if(this.nodes_parent[i] != -1 && this.nodes_type[this.nodes_parent[i]] == 1){
            p_ypos = nodes_dimension[nodes_parent[i]][1] - cv_radius
            dash_factor = 20;
            draw = true;
            x_temp = nodes_dimension[i][0] + cv_radius/2
            y_temp = nodes_dimension[i][1] + cv_radius
            segment = (p_ypos - y_temp) / dash_factor

            for(var j = 1; j <= dash_factor; j++){
                if(draw == true){
                    newCvToCv = new CvToCv(x_temp,y_temp,3,segment,0.5, this.nodes_depth[this.nodes_parent[i]])
                    this.cvTocv.push(newCvToCv)
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
    for(var i = 0; i < this.edges_intra_layer.length; i++){
        s = edges_intra_layer[i][0]
        t = edges_intra_layer[i][1]
        x1 = nodes_dimension[s][0] + cv_radius
        y1 = nodes_dimension[s][1] + cv_radius
        x2 = nodes_dimension[t][0] + nodes_dimension[t][2]/2
        new_edge = new Edge(s, t, x1, y1, x2-x1, Math.min(vertical_layer_space - bcomp_height,40), 0, nodi[s].getDepth())
        this.nodi[s].addEdge(new_edge)
        this.nodi[t].addEdge(new_edge)
        this.archi.push(new_edge)
    }

    app.renderer.render(app.stage);
}

/*  INTERAZIONI */
function zoom(event){
    if (event.deltaY < 0){
        isZoomIn = false;
    }
    else{
        isZoomIn = true;
    }
    direction = isZoomIn ? 1 : -1;
    var factor = (1 + direction * 0.1);
    app.stage.scale.x *= factor;
    app.stage.scale.y *= factor;
    app.stage.hitArea.width /= factor;
    app.stage.hitArea.height /= factor;
}

function DragNDrop() {
    var stage = app.stage;

    var isDragging = false,
    prevX, prevY;

    stage.pointerdown = function (moveData) {
      var pos = moveData.data.global;
      console.log(pos)
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

function hide_edges(){
    firstCoreLV = document.getElementById("firstCore")
    lastCoreLV = document.getElementById("lastCore")
    selected_first = firstCoreLV.options[firstCoreLV.selectedIndex].value
    selected_last = lastCoreLV.options[lastCoreLV.selectedIndex].value
    if(!hidden_edges){
        this.archi.forEach(edge => edge.setAlpha(0))

        hidden_edges = true
        console.log("bellaaa")
    }
    else{
        for(var i in archi){
            if(archi[i].getDepth() >= selected_first && archi[i].getDepth() <= selected_last){
                archi[i].setAlpha(0.3)
            }
        }
        //this.archi.forEach(edge => edge.setAlpha(0.3))
        hidden_edges = false
        console.log("ciaoo")
    }
}

function coreness_filtering_init(){
    firstCoreLV = document.getElementById("firstCore")
    lastCoreLV = document.getElementById("lastCore")
    for(var i = 1; i<= maxDepth; i++){
        newOption = document.createElement("option",[value=1])
        newOptionCopy = document.createElement("option", {value: i})
        newContent = document.createTextNode(i);
        newContentCopy = document.createTextNode(i);
        newOption.appendChild(newContent)
        newOptionCopy.appendChild(newContentCopy)
        lastCoreLV.appendChild(newOption)
        firstCoreLV.appendChild(newOptionCopy)
    }
    firstCoreLV.selectedIndex = 0
    lastCoreLV.selectedIndex = maxDepth-1
}

function coreness_filtering(){
    firstCoreLV = document.getElementById("firstCore")
    lastCoreLV = document.getElementById("lastCore")
    selected_first = firstCoreLV.options[firstCoreLV.selectedIndex].value
    selected_last = lastCoreLV.options[lastCoreLV.selectedIndex].value
    if(selected_first <= selected_last){
        for(var i in nodi){
            if(nodi[i].getDepth() < selected_first || nodi[i].getDepth() > selected_last){
                nodi[i].setAlpha(0)
            }
            else{
                nodi[i].setAlpha(1)
            }
        }
        for(var i in archi){
            if(archi[i].getDepth() < selected_first || archi[i].getDepth() > selected_last){
                archi[i].setAlpha(0)
            }
            else if(!hidden_edges){
                archi[i].setAlpha(0.3)
            }
        }
        for(var i in cvTocv){
            if(cvTocv[i].getDepth() < selected_first || cvTocv[i].getDepth() >= selected_last){
                cvTocv[i].setAlpha(0)
            }
            else{
                cvTocv[i].setAlpha(1)
            }
        }
        app.stage.position.y += (selected_first - 1) * vertical_layer_space
    }
}

/*  CLASSI  */
class Edge extends PIXI.Sprite{
    constructor(s, t, x, y, width, height, alpha, depth){
        super(texture_arc)
        this.source = s
        this.target = t
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.alpha = alpha
        this.depth = depth
        app.stage.addChild(this);
    }
    setAlpha(a){ this.alpha = a; }
    getDepth(){ return this.depth; }
}

class Node extends PIXI.Sprite{

    constructor(id, x, y, width, height, depth, type, parent, leaf){
        if(type == 1){
            super(texture_CV)
        }
        else{
            super(texture_compB)
        }
        this.id = id
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.depth = depth
        this.type = type
        this.parentNode = parent
        this.leaf = leaf
        this.interactive = true
        this.edges = []
        app.stage.addChild(this)
    }

    /*Event Handler*/
    pointerdown = function(e){
        console.log("hai cliccato il nodo "+this.id+" in posizione ( "+this.x+", "+this.y+")")
        console.log("questo nodo ha "+this.edges.length+" archi")
        this.edges.forEach(edge => edge.setAlpha(0.3))
        hidden_edges = false
    }

    /*edges*/
    addEdge(e){ this.edges.push(e) }
    removeEdge(e){
        index = this.edges.indexOf(e)
        new_edges = this.edges.splice(index,1)
        this.edges = new_edges
    }

    /*  Getter and Setter   */
    getX(){ return this.x }
    setX(x){ this.x = x }

    getY(){ return this.y }
    setY(y){ this.y = y }

    getWidth(){ return this.width }
    setWidth(w){this.width = w }

    getHeight(){ return this.height }
    setHeight(h){ this.height = h }

    getDepth(){ return this.depth; }
    setDepth(k){ this.depth = k }

    getType(){ return this.type }
    setType(t){ this.type = t }

    getParentNode(){ return this.parentNode }
    setParentNode(p){ this.parentNode = p }

    getLeaf(){ return this.leaf }
    setLeaf(l){ this.leaf = l }

    setAlpha(a){ this.alpha = a; }
}

class CvToCv extends PIXI.Sprite{
    constructor(x, y, width, height, alpha, depth){
        super(texture_sameCV)
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.alpha = alpha
        this.depth = depth
        app.stage.addChild(this);
    }
    setAlpha(a){ this.alpha = a; }
    getDepth(){ return this.depth; }
}

