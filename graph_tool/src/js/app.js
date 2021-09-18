var nodes;                              // nodi del cctree
var nodes_connComp;                    // componente connessa corrispondente nel grafo iniziale (parte da 0 per ogni lv di k)
var nodes_depth;                        // profondità dei nodi del cctree
var nodes_parent;                       // parent dei nodi del cctree (se layer = 1, parent = -1)
var nodes_children = [];
var nodes_type;                         // tipo dei nodi del cctree (se cv = 1, se comp B = 0)
var nodes_internal_size;                // quantità di archi di g contenuti nel nodo del cctree
var nodes_width;       //da togliere                 // array che indica la quantità e il tipo di foglie nel sottoalbero di un nodo
var max_internal_size = 0;
var edges_intra_layer;                  // archi del cctree tra nodi dello stesso livello di coreness
var edges_between_layer;                // archi del cctree tra nodi di diverso livello di coreness
var num_nodes;                          // numero di nodi del cctree
var num_edges;                          // numero di archi del cctree
var num_CV;                             // numero di cut-vertex del cctree
var num_comp_B;                         // numero di componenti biconnesse del cctree
var maxDepth;                           // profondità massima del cctree
var nodes_in_layer;                     // numero di nodi per ogni livello di profondità
var vertex_order                        // ordine dei vertici al primo livello
var biggest_node                        // nodo più grande per ogni liv di k
var width = window.innerWidth;
var height = window.innerHeight * 0.95;
var min_bcomp_width = 3;
var min_ccomp_width = 5;
var cv_radius = 4;                                      // raggio dei cv
var margin = 5;                                         //margine tra i nodi disegnati
const foo = function(i){ return nodes_internal_size[i] / 100}
const foo_ccomp = function(v){ return Math.log2(v.size) + v.size/5000}
var texture_compB
var texture_sameCV
var texture_CV
var texture_arc
var graphics_nodes = []
var graphics_arcs = []
var graphics_cvTocv = []
var graphics_links = []
var graphics_rails = []
var graphics_nodes_ccomp = []
var hidden_edges = true;
var vertical_layer_space = 0
var prevX = 0
var prevY = 0
var edge_length_tot = 0
var edge_length_max = 0


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
//PIXI.settings.ROUND_PIXELS = true;
app.loader.load(setup);
app.stage.interactive = true;
document.getElementById("display").appendChild(app.view);
document.addEventListener('contextmenu', event => event.preventDefault());
app.ticker.add(function(){
    update()
    app.renderer.render(app.stage)
})


/*  SETUP   */
function setup(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
    console.log(this.readyState +" "+ this.status)
        if (this.readyState == 4 && this.status == 200) {
            init_data(this);
            coreness_filtering_init();
            nodes_filtering_init();
            load_texture();
            init_nodes();
            draw();
            draw_graph();
            console.log("ciao")
            DragNDrop();
            //update();
            test_edges();
            test_nodes();
            test_nodes_ccomp();
        }
    };
    xhttp.open("GET", "new_data/stanford.xml", true);
    xhttp.send();

}

function isContained(obj){
        rect = new PIXI.Rectangle(0,0,width,height)
        bb = obj.getBounds()
        return rect.contains(bb.x,bb.y) ||( bb.x < 0 && bb.y >= 0 && bb.y < height)
}

function update () {
    for(var i in graphics_nodes){
        if(isContained(graphics_nodes[i]) && graphics_nodes[i].expanded)
            graphics_nodes[i].visible = true
        else
            graphics_nodes[i].visible = false
    }
    for(var i in graphics_arcs){
        if(isContained(graphics_arcs[i]) && graphics_nodes[graphics_arcs[i].source].expanded)
            graphics_arcs[i].visible = true
        else
            graphics_arcs[i].visible = false
    }
    for(var i in graphics_cvTocv){
        if(isContained(graphics_cvTocv[i]) && graphics_nodes[graphics_cvTocv[i].nodes[1]].expanded)
            graphics_cvTocv[i].visible = true
        else
            graphics_cvTocv[i].visible = false
    }
    for(var i in graphics_rails){
        if(isContained(graphics_rails[i]) && graphics_nodes[graphics_rails[i].node].expanded)
            graphics_rails[i].visible = true
        else
            graphics_rails[i].visible = false
    }
    for(var i in graphics_links){
        if(isContained(graphics_links[i]) && graphics_nodes[graphics_links[i].node].expanded)
            graphics_links[i].visible = true
        else
            graphics_links[i].visible = false
    }
}

/*  LETTURA DEI DATI DA XML */
function init_data(xml){
    var xmlDoc = xml.responseXML;
    nodes_xml = xmlDoc.getElementsByTagName("node");
    edges_xml = xmlDoc.getElementsByTagName("edge");
    this.nodes = new Array()
    this.nodes_connComp = new Array()
    this.nodes_depth = new Array()
    this.nodes_parent = new Array()
    this.nodes_type = new Array()
    this.edges_between_layer = new Array()
    this.edges_intra_layer = new Array()
    this.nodes_internal_size = new Array()
    this.nodes_width = new Array()
    for(var i = 0; i < nodes_xml.length; i++){
        node = parseInt(nodes_xml[i].id.substring(1))
        node_connComp = parseInt(nodes_xml[i].children[0].textContent)
        node_depth = parseInt(nodes_xml[i].children[1].textContent)
        node_internal_size = parseInt(nodes_xml[i].children[2].textContent)
        node_parent = parseInt(nodes_xml[i].children[3].textContent)
        node_type = parseInt(nodes_xml[i].children[4].textContent)
        this.nodes_width.push(nodes_xml[i].children[5].textContent.split(",").map(x=>+x))
        this.nodes_connComp.push(node_connComp)
        this.nodes.push(node)
        this.nodes_depth.push(node_depth)
        this.nodes_internal_size.push(node_internal_size)
        //console.log(nodes_internal_size)
        if(node_internal_size > max_internal_size)
            max_internal_size = node_internal_size

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
    this.vertex_order = xmlDoc.getElementsByTagName("data")[4].textContent.split(",").map(x=>parseInt(x));
    /*this.vertex_order = [...Array(this.nodes_in_layer[1]).keys()]
    this.vertex_order[0] = 5
    this.vertex_order[5] = 0
    this.vertex_order[2] = 7
    this.vertex_order[7] = 2*/

    children_init()
}

function children_init(){
    for(var i in nodes){
        nodes_children.push([])
        if(nodes_depth[i] > 1){
            parent = nodes_parent[i]
            nodes_children[parent].push(i)
        }
    }
}

function biggest_node_init(){
    //funzione che calcola il nodo più grande per ogni liv di coreness
    biggest_node = new Array(maxDepth+1).fill(null);

    for(var n in nodes){
        current_big = biggest_node[nodes_depth[n]]
        if(current_big == null)
            biggest_node[nodes_depth[n]] = n
        else
            if(nodes_internal_size[n] > nodes_internal_size[current_big])
                biggest_node[nodes_depth[n]] = n
    }
    return biggest_node
}

/*  CARICAMENTO DELLE TEXTURE*/
function load_texture(){

    let rect = new PIXI.Graphics();
    rect.beginFill(0xdaa520);
    rect.drawRect(0,0,32,32);
    rect.endFill();

    let ccomp = new PIXI.Graphics();
    ccomp.beginFill(0xcfb56f);
    ccomp.drawRect(0,0,32,32);
    ccomp.endFill();

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

    let rail = new PIXI.Graphics();
    rail.lineStyle(4, 0x444444, 2);
    rail.lineTo(1000,0)

    let link = new PIXI.Graphics();
    link.lineStyle(1, 0x444444, 1);
    link.quadraticCurveTo(0, 16, -10, 20)

    texture_compB = app.renderer.generateTexture(rect)
    texture_compC = app.renderer.generateTexture(ccomp)
    texture_CV = app.renderer.generateTexture(circle)
    texture_sameCV = app.renderer.generateTexture(line)
    texture_arc = app.renderer.generateTexture(arc)
    texture_rail = app.renderer.generateTexture(rail)
    texture_link = app.renderer.generateTexture(link)

    PIXI.Texture.addToCache(texture_compB, "texture_compB")
    PIXI.Texture.addToCache(texture_compC, "texture_compC")
    PIXI.Texture.addToCache(texture_CV, "texture_CV")
    PIXI.Texture.addToCache(texture_sameCV, "texture_sameCV")
    PIXI.Texture.addToCache(texture_arc, "texture_arc")
    PIXI.Texture.addToCache(texture_rail, "texture_rail")
    PIXI.Texture.addToCache(texture_link, "texture_link")

}

function width_calculator(i){

    if(nodes_children[i].length == 0)
        return Math.max(min_bcomp_width, foo(i))
    size = 0
    for(var j in nodes_children[i])
        size = size + width_calculator(nodes_children[i][j]) + margin
    return size

}

function width_calculator_ccomp(v){
    if(v.childrenNode.length == 0)
        return Math.max(min_ccomp_width, foo_ccomp(v))
    size = 0
    for(var j in v.childrenNode)
        size = size + width_calculator_ccomp(v.childrenNode[j]) + margin
    return size
}

/*  VISUALIZZAZIONE DEL GRAFO   */
function draw_graph_old(){
    biggest_node = biggest_node_init();
    var bcomp_height = 10;                                   // lunghezza delle componenti biconnesse
    var bcomp_width = 0;                                    // larghezza delle componenti biconnesse
    vertical_layer_space = Math.max(height / (maxDepth+1), 40);       // segmentazione verticale del canvas
    var current_depth = 1;                                  // livello di coreness corrente
    var nodes_dimension = new Array();                      // posizione dei nodi del cctree nel canvas [x,y,width]
    var last_node_added = [0,0]                             //x e width dell'ultimo nodo aaggiunto
    var last_child_added = [0,0]
    var last_cComp = this.nodes_connComp[this.vertex_order[0]]

    /* DISEGNO DEI NODI*/
    this.vertex_order.forEach(v =>{
        last_child_added[v] = []
        k = this.nodes_depth[v];                                // profondità del nodo corrente
        same_layer = 1                                          // var binaria = 0 se ho cambiato layer, 1 altrimenti
        if(current_depth != k){
            last_node_added = [0,0]
            same_layer = 0
        }
        current_depth = k;

        y =  vertical_layer_space * (- k) + height
        bcomp_width = width_calculator(v)
        x = (last_node_added[0] + last_node_added[1]) * same_layer + margin

        if(k >= 2){
            parent = this.nodes_parent[v]
            if(last_child_added[parent].length == 0)      // se sto disegnando il primo figlio del parent
                x = nodes_dimension[parent][0]              // prendo le dimensioni del parent
            else
                x = (last_child_added[parent][0] + last_child_added[parent][1]) * same_layer + margin
        }

        if(last_cComp != this.nodes_connComp[v] && k == 1){
            x += 25
            last_cComp = this.nodes_connComp[v]
        }

        if(nodes_type[v] == 1){                     // sto disegnando un cv
            nodes_dimension[v] = [x, y, cv_radius];
            last_node_added = [x, 2*cv_radius];
            last_child_added[this.nodes_parent[v]] = [x,2*cv_radius]
            new_node = new Node(v, x, y - cv_radius, cv_radius*2,  cv_radius*2, this.nodes_depth[v], 1, this.nodes_parent[v], this.nodes_width[v], this.nodes_internal_size[v])
            new_node.alpha = 0
            new_node.visible = false
            new_node.draw()
            this.graphics_nodes[v] = new_node
        }
        else{                                       // sto disegnando una componente B
            nodes_dimension[v] = [x, y, bcomp_width];
            last_node_added = [x, bcomp_width];
            last_child_added[this.nodes_parent[v]] = [x, bcomp_width]
            new_node = new Node(v, x, y - bcomp_height/2, bcomp_width,  bcomp_height, this.nodes_depth[v], 0, this.nodes_parent[v], this.nodes_width[v], this.nodes_internal_size[v])
            new_node.alpha = 0
            new_node.visible = false
            new_node.draw()
            this.graphics_nodes[v] = new_node
        }

        /*LINEE TRATTEGGIATE*/
        if(this.nodes_parent[v] != -1 && this.nodes_type[this.nodes_parent[v]] == 1){
            p_ypos = nodes_dimension[nodes_parent[v]][1] - cv_radius
            dash_factor = 20;
            draw = true;
            x_temp = nodes_dimension[v][0] + cv_radius/2
            y_temp = nodes_dimension[v][1] + cv_radius
            segment = (p_ypos - y_temp) / dash_factor

            for(var j = 1; j <= dash_factor; j++){
                if(draw == true){
                    newCvToCv = new CvToCv(x_temp,y_temp,3,segment,0.5, this.nodes_depth[this.nodes_parent[v]])
                    newCvToCv.alpha = 0
                    newCvToCv.visible = false
                    newCvToCv.nodes.push(v)
                    newCvToCv.nodes.push(this.nodes_parent[v])
                    newCvToCv.draw()
                    this.graphics_nodes[v].addCv2Cv(newCvToCv)
                    this.graphics_cvTocv.push(newCvToCv)
                    draw = false;
                }
                else{
                    draw = true
                }
                y_temp += segment
            }
        }
    })

    /* DISEGNO DEGLI ARCHI*/
    for(var i = 0; i < this.edges_intra_layer.length; i++){
        s = edges_intra_layer[i][0]
        t = edges_intra_layer[i][1]
        x1 = nodes_dimension[s][0] + cv_radius
        y1 = nodes_dimension[s][1] + cv_radius
        x2 = nodes_dimension[t][0] + nodes_dimension[t][2]/2
        if(t == biggest_node[nodes_depth[t]]){
            continue
        }
        else{
            new_edge = new Edge(s, t, x1, y1, x2-x1, Math.min(vertical_layer_space - bcomp_height,40), 0, graphics_nodes[s].getDepth())
            new_edge.visible = false
            new_edge.draw()
            this.graphics_nodes[s].addEdge(new_edge)
            this.graphics_nodes[t].addEdge(new_edge)
            this.graphics_arcs.push(new_edge)
            this.edge_length_tot += Math.abs(x2-x1)
            if( x2-x1 > this.edge_length_max)
                this.edge_length_max = x2-x1
        }

    }

    /* DISEGNO DEI BINARI*/
    biggest_node.shift()
    for(var i in biggest_node){
        current_node = biggest_node[i]
        d = graphics_nodes[current_node].getDepth()
        current_edges = this.edges_intra_layer.filter(edge => edge[1] == current_node)
        if(current_edges.length == 0)
            continue
        x = nodes_dimension[current_node][0] + nodes_dimension[current_node][2] / 2
        y = nodes_dimension[current_node][1] + bcomp_height / 2
        h = vertical_layer_space / 2
        w = 10
        new_link = new Link(x, y, w, h, 0, d)
        new_link.visible = false
        new_link.reverse()
        graphics_nodes[current_node].addLink(new_link)
        app.stage.addChild(new_link)
        this.graphics_links.push(new_link)
        min_pos = nodes_dimension[current_node][0] + nodes_dimension[current_node][2] / 2
        max_pos = nodes_dimension[current_node][0] + nodes_dimension[current_node][2] / 2
        current_edges.forEach(edge =>{
            // DISEGNARE LINK QUI E CALCOLARE MIN E MAX, CIOÈ DIMENSIONI BINARIO
            new_link = new PIXI.Sprite(texture_link)
            x = nodes_dimension[edge[0]][0] + cv_radius - 10
            y = nodes_dimension[edge[0]][1] + cv_radius + 2
            h = vertical_layer_space / 2
            w = 10
            new_link = new Link(x, y, w, h, 0, d)
            new_link.visible = false
            graphics_nodes[current_node].addLink(new_link)
            graphics_nodes[edge[0]].addLink(new_link)
            app.stage.addChild(new_link)
            this.graphics_links.push(new_link)
            if(nodes_dimension[edge[0]][0] < min_pos)
                min_pos = nodes_dimension[edge[0]][0]
            if(nodes_dimension[edge[0]][0] > max_pos)
                max_pos = nodes_dimension[edge[0]][0]
        })
        //DISEGNARE BINARIO
        x = min_pos
        y = nodes_dimension[current_node][1] + bcomp_height / 2 + vertical_layer_space / 2
        h = 1
        w = max_pos - min_pos
        new_rail = new Rail(x, y, w, h, 0, d)
        new_rail.visible = false
        graphics_nodes[current_node].addRail(new_rail)
        app.stage.addChild(new_rail)
        this.graphics_rails.push(new_rail)

        this.edge_length_tot += w
        if( w > this.edge_length_max)
                this.edge_length_max = w
    }

    app.renderer.render(app.stage);
    console.log("lunghezza totale degli archi: " + this.edge_length_tot.toExponential(2) + " px")
    console.log("lunghezza massima degli archi: " + this.edge_length_max.toExponential(2) + " px")
}

function draw_graph(){
    biggest_node = biggest_node_init();
    var bcomp_height = 10;                                   // lunghezza delle componenti biconnesse
    //var bcomp_width = 0;                                    // larghezza delle componenti biconnesse
    //vertical_layer_space = Math.max(height / (maxDepth+1), 40);       // segmentazione verticale del canvas
    //var current_depth = 1;                                  // livello di coreness corrente
    var nodes_dimension = new Array();                      // posizione dei nodi del cctree nel canvas [x,y,width]
    //var last_node_added = [0,0]                             //x e width dell'ultimo nodo aaggiunto
    var last_child_added = [0,0]
    var last_node_added = null
    var last_child_of_parent = []

    /* DISEGNO DEI NODI*/
    this.vertex_order.forEach(n =>{
        v = graphics_nodes[n]
        /*if(last_node_added != null && v.depth != last_node_added.depth)
            last_node_added = null*/
        if(v.parentNode != null && last_child_of_parent[v.parentNode.id] == null)
            last_child_of_parent[v.parentNode.id] = [0,0]
        ccomp = v.node_ccomp.id
        parent_x = 0
        if(v.depth > 1)
            parent_x = nodes_dimension[this.nodes_parent[n]][0]

        if(last_node_added != null && last_node_added.depth != v.depth){
            x = parent_x
        }

        else if(last_node_added == null || last_node_added.node_ccomp.id != ccomp)
            x = graphics_nodes_ccomp[ccomp].x
        else if(v.parentNode != null && last_node_added.parentNode.id != v.parentNode.id)
            x = Math.max(parent_x, last_child_of_parent[v.parentNode.id][0] + last_child_of_parent[v.parentNode.id][1] + margin)
        else
            x = last_child_added[ccomp][0] + last_child_added[ccomp][1] + margin

        if(nodes_type[v] == 1){
            last_child_added[ccomp] = [x,2*cv_radius]
            nodes_dimension[n] = [x, graphics_nodes_ccomp[ccomp].y, 2*cv_radius]
        }
        else{                                       // sto disegnando una componente B
            last_child_added[ccomp] = [x, v.width]
            nodes_dimension[n] = [x, graphics_nodes_ccomp[ccomp].y, v.width]
        }

        v.x = x
        v.y = graphics_nodes_ccomp[ccomp].y
        if(v.depth > 1)
            last_child_of_parent[v.parentNode.id] = [x, v.width]
        last_node_added = v

        /*LINEE TRATTEGGIATE*/
        if(this.nodes_parent[n] != -1 && this.nodes_type[this.nodes_parent[n]] == 1){
            p_ypos = nodes_dimension[nodes_parent[n]][1] - cv_radius
            dash_factor = 20;
            draw = true;
            x_temp = nodes_dimension[n][0] + cv_radius
            y_temp = nodes_dimension[n][1] + 3 * cv_radius
            segment = (p_ypos - y_temp) / dash_factor

            for(var j = 1; j <= dash_factor; j++){
                if(draw == true){
                    newCvToCv = new CvToCv(x_temp,y_temp,3,segment,0.5, this.nodes_depth[this.nodes_parent[n]])
                    newCvToCv.alpha = 0
                    newCvToCv.visible = false
                    newCvToCv.nodes.push(n)
                    newCvToCv.nodes.push(this.nodes_parent[n])
                    newCvToCv.draw()
                    this.graphics_nodes[n].addCv2Cv(newCvToCv)
                    this.graphics_cvTocv.push(newCvToCv)
                    draw = false;
                }
                else{
                    draw = true
                }
                y_temp += segment
            }
        }

    })

    /* DISEGNO DEGLI ARCHI*/
    for(var i = 0; i < this.edges_intra_layer.length; i++){
        s = edges_intra_layer[i][0]
        t = edges_intra_layer[i][1]
        x1 = nodes_dimension[s][0] + cv_radius
        y1 = nodes_dimension[s][1] + cv_radius
        x2 = nodes_dimension[t][0] + nodes_dimension[t][2]/2
        if(t == biggest_node[nodes_depth[t]]){
            continue
        }
        else{
            new_edge = new Edge(s, t, x1, y1, x2-x1, Math.min(vertical_layer_space - bcomp_height - 5,40), 0, graphics_nodes[s].getDepth())
            new_edge.visible = false
            new_edge.draw()
            this.graphics_nodes[s].addEdge(new_edge)
            this.graphics_nodes[t].addEdge(new_edge)
            this.graphics_arcs.push(new_edge)
            this.edge_length_tot += Math.abs(x2-x1)
            if( x2-x1 > this.edge_length_max)
                this.edge_length_max = x2-x1
        }

    }

    /* DISEGNO DEI BINARI*/
    biggest_node.shift()
    for(var i in biggest_node){
        current_node = biggest_node[i]
        d = graphics_nodes[current_node].getDepth()
        current_edges = this.edges_intra_layer.filter(edge => edge[1] == current_node)
        if(current_edges.length == 0)
            continue
        x = nodes_dimension[current_node][0] + nodes_dimension[current_node][2] / 2
        y = nodes_dimension[current_node][1] + bcomp_height / 2
        h = vertical_layer_space / 2 + 7
        w = 10
        new_link = new Link(x, y, w, h, 0, d)
        new_link.visible = false
        new_link.reverse()
        graphics_nodes[current_node].addLink(new_link)
        new_link.node = current_node
        app.stage.addChild(new_link)
        this.graphics_links.push(new_link)
        min_pos = nodes_dimension[current_node][0] + nodes_dimension[current_node][2] / 2
        max_pos = nodes_dimension[current_node][0] + nodes_dimension[current_node][2] / 2
        current_edges.forEach(edge =>{
            // DISEGNARE LINK QUI E CALCOLARE MIN E MAX, CIOÈ DIMENSIONI BINARIO
            new_link = new PIXI.Sprite(texture_link)
            x = nodes_dimension[edge[0]][0] + cv_radius - 10
            y = nodes_dimension[edge[0]][1] + cv_radius + 2
            h = vertical_layer_space / 2 + 7
            w = 10
            new_link = new Link(x, y, w, h, 0, d)
            new_link.visible = false
            graphics_nodes[current_node].addLink(new_link)
            graphics_nodes[edge[0]].addLink(new_link)
            new_link.node = edge[0]
            app.stage.addChild(new_link)
            this.graphics_links.push(new_link)
            if(nodes_dimension[edge[0]][0] < min_pos)
                min_pos = nodes_dimension[edge[0]][0]
            if(nodes_dimension[edge[0]][0] > max_pos)
                max_pos = nodes_dimension[edge[0]][0]
        })
        //DISEGNARE BINARIO
        x = min_pos
        y = nodes_dimension[current_node][1] + bcomp_height / 2 + vertical_layer_space / 2 + 7
        h = 1
        w = max_pos - min_pos
        new_rail = new Rail(x, y, w, h, 0, d)
        new_rail.lineStyle(4, 0x444444, 2);
        new_rail.moveTo(0,0)
        new_rail.lineTo(w,0)
        new_rail.x = x
        new_rail.y = y
        new_rail.width = w
        new_rail.height = 1
        new_rail.visible = false
        graphics_nodes[current_node].addRail(new_rail)
        new_rail.node = current_node
        app.stage.addChild(new_rail)
        this.graphics_rails.push(new_rail)

        this.edge_length_tot += w
        if( w > this.edge_length_max)
                this.edge_length_max = w
    }


    app.renderer.render(app.stage)
}

function draw(){
    //biggest_node = biggest_node_init();
    var bcomp_height = 10;                                   // lunghezza delle componenti biconnesse
    var bcomp_width = 0;                                    // larghezza delle componenti biconnesse
    vertical_layer_space = Math.max(height / (maxDepth+1), 40);       // segmentazione verticale del canvas
    var current_depth = 1;                                  // livello di coreness corrente
    var nodes_dimension = new Array();                      // posizione dei nodi del cctree nel canvas [x,y,width]
    var last_node_added = [0,0]                             //x e width dell'ultimo nodo aaggiunto
    var last_child_added = [0,0]
    var last_cComp = this.nodes_connComp[this.vertex_order[0]]

    this.graphics_nodes_ccomp.forEach(v =>{
        last_child_added[v.id] = []
        k = v.depth;                                // profondità del nodo corrente
        same_layer = 1                                          // var binaria = 0 se ho cambiato layer, 1 altrimenti
        if(current_depth != k){
            last_node_added = [0,0]
            same_layer = 0
        }
        current_depth = k;

        y =  vertical_layer_space * (- k) + height
        bcomp_width = width_calculator_ccomp(v)
        //bcomp_width =5
        x = (last_node_added[0] + last_node_added[1]) * same_layer + margin

        if(k >= 2){
            parent = v.parentNode.id
            if(last_child_added[parent].length == 0)      // se sto disegnando il primo figlio del parent
                x = nodes_dimension[parent][0]              // prendo le dimensioni del parent
            else
                x = (last_child_added[parent][0] + last_child_added[parent][1]) * same_layer + margin
            last_child_added[v.parentNode.id] = [x,bcomp_width]
        }

        if(k == 1)
            x += 25

        nodes_dimension[v.id] = [x, y, bcomp_width];
        last_node_added = [x, bcomp_width];
        //last_child_added[v.parentNode.id] = [x,bcomp_width]
        v.x = x
        v.y = y
        v.width = bcomp_width
        v.original_w = bcomp_width
        //v.draw()
        //app.stage.addChild(v)

    })
    //app.renderer.render(app.stage);

}

function init_nodes(){
    this.vertex_order.forEach(v =>{
        k = this.nodes_depth[v]
        var bcomp_height = 10;
        //creo nuovo nodo
        dimension = [0,0]
        if(nodes_type[v] == 1){
            dimension = [cv_radius*2,  cv_radius*2]
        }
        else{
            bcomp_width = width_calculator(v)
            dimension = [bcomp_width,  bcomp_height]
        }
        new_node = new Node(v, 0, 0, dimension[0], dimension[1], k, this.nodes_type[v], this.nodes_width[v], this.nodes_internal_size[v])
        new_node.visible = false
        new_node.expanded = false
        if(this.nodes_parent[v] != -1){
            new_node.parentNode = this.graphics_nodes[this.nodes_parent[v]]
            new_node.parentNode.childrenNode.push(new_node)
        }
        this.graphics_nodes[v] = new_node

        //creo nuovo nodoCCOmp se non l'ho già creato
        new_ccomp = null
        if(graphics_nodes_ccomp[nodes_connComp[v]] == null){
            new_ccomp = new NodeCComp(nodes_connComp[v], 0, 0, 0, bcomp_height, nodes_depth[v])
            this.graphics_nodes_ccomp[nodes_connComp[v]] = new_ccomp
        }
        else
            new_ccomp = graphics_nodes_ccomp[nodes_connComp[v]]

        //riferimenti ad altri nodi
        new_ccomp.nodes_cctree.push(new_node)
        new_ccomp.size = new_ccomp.size + this.nodes_internal_size[v]
        new_node.node_ccomp = new_ccomp
        if(k>=2){
            parent = this.nodes_parent[new_node.id]
            //console.log("parent:"+parent+" con tipo:"+typeof(parent))
            parent_ccomp = graphics_nodes[parent].node_ccomp
            //console.log("parent_ccomp:"+parent_ccomp.id+" con tipo:"+typeof(parent_ccomp))
            new_ccomp.parentNode = parent_ccomp
            if(parent_ccomp.childrenNode.indexOf(new_ccomp) == -1)
                parent_ccomp.childrenNode.push(new_ccomp)
        }
        app.stage.addChild(new_node)
        app.stage.addChild(new_ccomp)

    })
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
    app.stage.pivot.x = 0
    app.stage.pivot.y = 0
    app.stage.scale.x *= factor;
    app.stage.scale.y *= factor;

}

function DragNDrop() {
    var stage = app.stage;

    var isDragging = false

    app.renderer.plugins.interaction.on("mousedown", event => {
      var pos = event.data.global;
      console.log(pos)
      prevX = pos.x; prevY = pos.y;
      isDragging = true;
    });

    app.renderer.plugins.interaction.on("mousemove", event => {
      if (!isDragging) {
        return;
      }
      var pos = event.data.global;
      var dx = pos.x - prevX;
      var dy = pos.y - prevY;



      stage.position.x += dx;
      stage.position.y += dy;
      prevX = pos.x; prevY = pos.y;

    });

    app.renderer.plugins.interaction.on("mouseup", event =>{
      isDragging = false;
    });
    app.renderer.plugins.interaction.on("mouseupoutside", event =>{
      isDragging = false;
    });
}

function reset(){
    //reset zoom e d&d
    app.stage.setTransform();
}

function hide_edges(){
    firstCoreLV = document.getElementById("firstCore")
    lastCoreLV = document.getElementById("lastCore")
    selected_first = firstCoreLV.options[firstCoreLV.selectedIndex].value
    selected_last = lastCoreLV.options[lastCoreLV.selectedIndex].value
    if(!hidden_edges){
        this.graphics_arcs.forEach(edge => edge.setAlpha(0))
        this.graphics_links.forEach(link => link.setAlpha(0))
        this.graphics_rails.forEach(rail => rail.setAlpha(0))
        hidden_edges = true
    }
    else{
        for(var i in graphics_arcs){
            if(graphics_arcs[i].visible && graphics_arcs[i].getDepth() >= selected_first && graphics_arcs[i].getDepth() <= selected_last){
                graphics_arcs[i].setAlpha(0.8)
            }
        }
        for(var i in graphics_links){
            if(graphics_links[i].visible && graphics_links[i].getDepth() >= selected_first && graphics_links[i].getDepth() <= selected_last){
                graphics_links[i].setAlpha(1)
            }
        }
        for(var i in graphics_rails){
            if(graphics_rails[i].visible && graphics_rails[i].getDepth() >= selected_first && graphics_rails[i].getDepth() <= selected_last){
                graphics_rails[i].setAlpha(1)
            }
        }
        //this.graphics_arcs.forEach(edge => edge.setAlpha(0.3))
        hidden_edges = false
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
    reset()
    firstCoreLV = document.getElementById("firstCore")
    lastCoreLV = document.getElementById("lastCore")
    selected_first = firstCoreLV.options[firstCoreLV.selectedIndex].value
    selected_last = lastCoreLV.options[lastCoreLV.selectedIndex].value
    if(selected_first <= selected_last){
        for(var i in graphics_nodes){
            if(graphics_nodes[i].getDepth() < selected_first || graphics_nodes[i].getDepth() > selected_last){
                graphics_nodes[i].setAlpha(0)
            }
            else{
                graphics_nodes[i].setAlpha(1)
            }
        }
        for(var i in graphics_arcs){
            if(graphics_arcs[i].getDepth() < selected_first || graphics_arcs[i].getDepth() > selected_last){
                graphics_arcs[i].setAlpha(0)
            }
            else if(!hidden_edges){
                graphics_arcs[i].setAlpha(0.3)
            }
        }
        for(var i in graphics_cvTocv){
            if(graphics_cvTocv[i].getDepth() < selected_first || graphics_cvTocv[i].getDepth() >= selected_last){
                graphics_cvTocv[i].setAlpha(0)
            }
            else{
                graphics_cvTocv[i].setAlpha(0.5)
            }
        }
        app.stage.position.y += (selected_first - 1) * vertical_layer_space
    }
}

function nodes_filtering_init(){
    slide = document.getElementById("nodeFilter")
    val = document.getElementById("slideValue")
    slide.max = max_internal_size
    val.value = slide.value
}

function nodes_filtering(event){
    slide = document.getElementById("nodeFilter")
    val = document.getElementById("slideValue")
    if(event.srcElement == slide)
        val.value = slide.value
    if(event.srcElement == val)
        slide.value = val.value
    for(var i in graphics_nodes){
        if(graphics_nodes[i].getType() == 0){
            if(graphics_nodes[i].getIntSize() < slide.value){
                graphics_nodes[i].setAlpha(0)
            }
            else{
                graphics_nodes[i].setAlpha(1)
            }
        }
        else{
            toFilter = true
            for(var j in graphics_nodes[i].edges){
                e = graphics_nodes[i].edges[j]
                toFilter = toFilter && graphics_nodes[e.getTarget()].getIntSize() < slide.value
            if(toFilter){
                graphics_nodes[i].setAlpha(0)
                for(var k in graphics_nodes[i].cv2cv){
                    graphics_nodes[i].cv2cv[k].setAlpha(0)
                }
            }
            else{
                graphics_nodes[i].setAlpha(1)
                for(var k in graphics_nodes[i].cv2cv){
                    graphics_nodes[i].cv2cv[k].setAlpha(0.5)
                }
            }
            }
        }

    }
}


/*  ALGORITMO DI ESPANSIONE */
function expand_node(v){

    replace(v)
    delta = delta_expand_calculator(v)
    shift_right_brother(v,delta)
    recursive_replace(v)
    change_lower_nodes(v, delta)

    app.renderer.render(app.stage)
}

function delta_expand_calculator(v){
    dim_X = v.nodes_cctree.map(c => c.x)
    dim_W = v.nodes_cctree.map(c => c.width)
    min_child_x = Math.min(...dim_X)
    max_child_x = Math.max(...dim_X) + dim_W[dim_X.indexOf(Math.max(...dim_X))]
    delta = (max_child_x - min_child_x) - v.width
    return delta
}

/*replace(v) rimpiazza il nodo_Ccomp cliccato con i suoi nodi_cctree*/
function replace(v){
        v.visible = false
        v.expanded = true
        v.interactive = false
        for(var i in v.nodes_cctree){
            v.nodes_cctree[i].expanded = true
            v.nodes_cctree[i].visible = true
            v.nodes_cctree[i].interactive = true
        }
        for(var i in graphics_cvTocv){
            first = graphics_nodes[graphics_cvTocv[i].nodes[0]]
            last = graphics_nodes[graphics_cvTocv[i].nodes[1]]
            if(first.expanded && last.expanded)
                graphics_cvTocv[i].setAlpha(0.5)
        }
}

/*calcola i fratelli destri del nodo cliccato v e chiama shift*/
function shift_right_brother(v, delta){
    if(v.parentNode != null)
        right_brothers = v.parentNode.childrenNode.filter(c => c.x > v.x)
    else
        right_brothers = graphics_nodes_ccomp.filter(c => c.depth == 1 && c.x > v.x)

    shift(right_brothers, delta)
    shift_children(right_brothers, delta)

}

/*permette di shiftare un'intera colonna (i nodi superiori(figli) nella visualizzazione)*/
function shift_children(collection, delta){
    collection.forEach(v =>{
        shift(v.childrenNode,delta)
        shift_children(v.childrenNode, delta)
    })
}

/*shifta i nodi_ccomp in una collezione di un valore delta
 si occupa solo dei nodi non espansi, quindi quelli sotto e a destra di quello cliccato*/
function shift(collection, delta){
    collection.forEach(n =>{
        w = n.width
        h = n.height
        initial_x = n.x
        n.setTransform(n.x + delta, n.y)
        n.width = w
        n.height = h
        n.nodes_cctree.forEach(c =>{
            w = c.width
            h = c.height
            c.setTransform(c.x + delta, c.y)
            if(c.type == 1){
                c.edges.forEach(e =>{
                    e.x = c.x + cv_radius
                })
                c.cv2cv.forEach(cv => {
                    cv.x = c.x + cv_radius/2
                })
            }
            c.width = w
            c.height = h
        })
    })
}

/*shifta un nodo_ccomp posizionandolo sul parent
 si occupa solo dei nodi espansi, quindi quelli sopra quello cliccato*/
function shift_expanded(v){
    w = v.width
    h = v.height
    initial_x = v.x
    if(v.parentNode.childrenNode.length == 1)
        v.setTransform(v.parentNode.x, v.y)

    else{
        dim_X = v.parentNode.childrenNode.map(c => c.x)
        min_child_x = Math.min(...dim_X)
        v.setTransform(v.x + v.parentNode.x - min_child_x, v.y)
    }

    v.width = w
    v.height = h
    v.nodes_cctree.forEach(c =>{
        w = c.width
        h = c.height
        if(c.parentNode.childrenNode.length == 1)
            c.setTransform(c.parentNode.x, c.y)
        else{
            dim_X = c.parentNode.childrenNode.map(c => c.x)
            min_child_x = Math.min(...dim_X)
            c.setTransform(c.x + c.parentNode.x - min_child_x, c.y)
        }
        if(c.type == 1){
            c.edges.forEach(e =>{
                e.x = c.x + cv_radius
            })
            c.cv2cv.forEach(cv => {
                cv.x = c.x + cv_radius/2
            })
        }

        c.width = w
        c.height = h
    })
}

/*rimpiazza ricorsivamente tutti i nodi sopra quello cliccato e li posiziona sul parent*/
function recursive_replace(v){
    v.childrenNode.forEach(c =>{
        //if(c.expanded == false){
            replace(c)
            shift_expanded(c)
            recursive_replace(c)
        //}
    })
}

function change_lower_nodes(v, delta){
    if(v.parentNode != null && v.parentNode.expanded == false){
        v.parentNode.width = v.parentNode.width + delta
        shift_right_brother(v.parentNode, delta)
        //if(v.parentNode.expanded == false)
        change_lower_nodes(v.parentNode, delta)
    }
}


/*  ALGORITMO DI COMPRESSIONE   */
function compress_node(v){
    replace_with_ccomp(v.node_ccomp)
    delta = delta_compress_calculator(v.node_ccomp)
    shift_right_brother(v.node_ccomp,delta)
    recursive_replace_with_ccomp(v.node_ccomp)
    change_lower_nodes(v.node_ccomp, delta)

    app.renderer.render(app.stage)
}

function delta_compress_calculator(v){
    dim_X = v.nodes_cctree.map(c => c.x)
    dim_W = v.nodes_cctree.map(c => c.width)
    min_child_x = Math.min(...dim_X)
    max_child_x = Math.max(...dim_X) + dim_W[dim_X.indexOf(Math.max(...dim_X))]
    delta = v.width - (max_child_x - min_child_x)

    return delta
}

function replace_with_ccomp(v){
    v.visible = true
    v.expanded = false
    v.interactive = true
    for(var i in v.nodes_cctree){
        current = v.nodes_cctree[i]
        current.visible = false
        current.expanded = false
        current.interactive = false
    }
    for(var i in graphics_cvTocv){
        first = graphics_nodes[graphics_cvTocv[i].nodes[0]]
        last = graphics_nodes[graphics_cvTocv[i].nodes[1]]
        if(first.expanded == false || last.expanded == false)
            graphics_cvTocv[i].setAlpha(0)
    }
}

function recursive_replace_with_ccomp(v){
    v.childrenNode.forEach(c => {
        if(c.expanded == true){
            replace_with_ccomp(c)
            //delta = delta_compress_calculator(c)
            //shift_right_brother(c,delta)
            shift_compress(c)
            recursive_replace_with_ccomp(c)
        }
    })
}

function shift_compress(v){
    w = v.width
    h = v.height
    initial_x = v.x
    if(v.parentNode.childrenNode.length == 1)
        v.setTransform(v.parentNode.x, v.y)
    else{
        dim_X = v.parentNode.childrenNode.map(c => c.x)
        min_child_x = Math.min(...dim_X)
        v.setTransform(v.x + v.parentNode.x - min_child_x, v.y)
    }

    v.width = w
    v.height = h
    v.nodes_cctree.forEach(c =>{
        w = c.width
        h = c.height
        if(v.nodes_cctree.length == 1)
            c.setTransform(v.x, c.y)
        else{
            dim_X = v.nodes_cctree.map(c => c.x)
            min_child_x = Math.min(...dim_X)
            c.setTransform(c.x + v.x - min_child_x, c.y)
        }
        if(c.type == 1){
            c.edges.forEach(e =>{
                e.x = c.x + cv_radius
            })
            c.cv2cv.forEach(cv => {
                cv.x = c.x + cv_radius/2
            })
        }

        c.width = w
        c.height = h
    })
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

    }
    getSource(){ return this.source; }
    getTarget(){ return this.target; }

    setAlpha(a){ this.alpha = a; }
    getDepth(){ return this.depth; }
    draw(){ app.stage.addChild(this); }
    getX(){ return this.x }
    setX(x){ this.x = x }

    getY(){ return this.y }
    setY(y){ this.y = y }

    getWidth(){ return this.width }
    setWidth(w){this.width = w }

    getHeight(){ return this.height }
    setHeight(h){ this.height = h }
}

class Link extends PIXI.Sprite{
    constructor(x, y, w, h, a, d){
        super(texture_link)
        this.x = x
        this.y = y
        this.width = w
        this.height = h
        this.alpha = a
        this.depth = d
        this.node = null
    }
    setAlpha(a){ this.alpha = a; }
    getDepth(){ return this.depth; }
    reverse(){this.scale.x = -1}
}

class Rail extends PIXI.Graphics{
    constructor(x, y, w, h, a, d){
        super()
        this.x = x
        this.y = y
        this.width = w
        this.height = h
        this.alpha = a
        this.depth = d
        this.node = null
    }
    setAlpha(a){ this.alpha = a; }
    getDepth(){ return this.depth; }
}

class Node extends PIXI.Sprite{

    constructor(id, x, y, width, height, depth, type, leaf, internal_size){
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
        this.leaf = leaf
        this.int_size = internal_size
        this.interactive = false
        this.edges = []
        this.cv2cv = []
        this.links = []
        this.rail = null
        this.node_ccomp = null
        this.expanded = false
        this.parentNode = null
        this.childrenNode = []
    }

    draw(){ app.stage.addChild(this); }

    /*Event Handler*/
    mousedown = function(e){
        console.log("hai cliccato il nodo "+this.id+" in posizione ( "+this.x+", "+this.y+")")
        console.log("questo nodo ha "+(this.edges.length + this.links.length)+" archi")
        if(this.parentNode != null)
            console.log("questo nodo ha parent "+this.parentNode.id)
        console.log("questo nodo ha "+this.childrenNode.length+" figli")
        console.log("questo nodo ha "+this.width+" width")
        console.log("questo nodo ha "+this.height+" height")
        console.log("questo nodo ha profondità "+this.depth)
        console.log("questo nodo ha "+this.int_size+" archi interni")
        console.log("questo nodo appartiene alla comp conn #"+nodes_connComp[this.id])
        //app.renderer.render(this)
        this.edges.forEach(edge => edge.setAlpha(0.3))
        hidden_edges = false
    }

    rightclick = function(){
        compress_node(this)
    }

    /*edges*/
    addEdge(e){ this.edges.push(e) }
    removeEdge(e){
        index = this.edges.indexOf(e)
        new_edges = this.edges.splice(index,1)
        this.edges = new_edges
    }

    addCv2Cv(c){ this.cv2cv.push(c) }

    addLink(l){ this.links.push(l)}

    addRail(r){ this.rail = r}

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

    getIntSize(){ return this.int_size }

    setAlpha(a){ this.alpha = a; }
}

class NodeCComp extends PIXI.Sprite{
    constructor(id, x, y, width, height, depth){
        super(texture_compC)
        this.id = id
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.depth = depth
        this.nodes_cctree = []
        this.parentNode = null
        this.childrenNode = []
        this.expanded = false
        this.size = 0
        this.interactive = true
        this.original_w = 0
    }

    draw(){ app.stage.addChild(this); }

    /* EVENT HANDLER */
    rightclick = function(e){
        console.log("espansione in corso della componente connessa # "+this.id+" in posizione ( "+this.x+", "+this.y+")")
        if(this.expanded){
            this.expanded = false
        }
        else{
            this.expanded = true
            expand_node(this)
        }
    }

    mousedown = function(e){
        console.log("hai cliccato la componente connessa # "+this.id+" in posizione ( "+this.x+", "+this.y+")")
        if(this.parentNode != null)
            console.log("questo nodo ha parent "+this.parentNode.id)
        console.log("questo nodo ha "+this.childrenNode.length +" figli")
        console.log("questo nodo ha "+this.width+" width")
        console.log("questo nodo ha "+this.height+" height")
        console.log("questo nodo ha profondità "+this.depth)
        console.log("questo nodo ha "+this.size+" archi interni")
        console.log("questo nodo contiene "+this.nodes_cctree.length+" nodi del cctree")

    }

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
        this.nodes = []
    }
    setAlpha(a){ this.alpha = a; }
    getDepth(){ return this.depth; }
    draw(){ app.stage.addChild(this); }
    getX(){ return this.x }
    setX(x){ this.x = x }

    getY(){ return this.y }
    setY(y){ this.y = y }

    getWidth(){ return this.width }
    setWidth(w){this.width = w }

    getHeight(){ return this.height }
    setHeight(h){ this.height = h }
}

function test_edges(){
    counter = 0
    for( var n in graphics_nodes){
        if (graphics_nodes[n].type == 1){
            edg = graphics_nodes[n].edges
            link = graphics_nodes[n].links
            if (edg.length + link.length < 2){
                counter ++
            }
        }
    }
    console.log("ci sono "+counter+" cv con meno di due archi")
}

function test_nodes(){
    for(var i in graphics_nodes){
        counter = 0
        v = graphics_nodes[i]
        if(v.depth > 1){
            if(v.int_size > v.parentNode.int_size)
                counter ++
        }
    }
    console.log("ci sono "+counter+" nodi che aumentano di size rispetto al padre")
}

function test_nodes_ccomp(){
    for(var i in graphics_nodes_ccomp){
        counter = 0
        v = graphics_nodes_ccomp[i]
        parent = v.parentNode
        if(v.depth > 1){
            if(v.size > parent.size)
                counter ++
        }
    }
    console.log("ci sono "+counter+" nodi_ccomp che aumentano di size rispetto al padre")
}

