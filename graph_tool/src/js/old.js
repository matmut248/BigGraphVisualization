
var nodes;
var nodes_depth;
var nodes_parent;
var nodes_type;
var nodes_internal_size;
var edges_intra_layer;
var edges_between_layer;
var num_nodes;
var num_edges;
var num_CV;
var num_comp_B;
var maxDepth;
var nodes_in_layer;
var width = window.innerWidth;
var height = window.innerHeight;
const map_on_range = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;

var stage = new PIXI.Container();
var renderer = PIXI.autoDetectRenderer({
    width: window.innerWidth,
    height: window.innerHeight,
    transparent: true,
    resolution: 1
});
var graphics = new PIXI.Graphics();
const loader = new PIXI.Loader(); // you can also create your own if you want

function init_container(){
    document.getElementById("display").appendChild(renderer.view);
    loader.load(draw_graph)
}

function draw_graph(){
    var margin = 20;
    var cv_radius = 5;
    var bcomp_height = 10;
    var bcomp_width = 70;
    var vertical_layer_space = height / (maxDepth+1);
    var count = 1;
    var current_depth = 1;
    var nodes_position = new Array();
    var max_internal_size = new Array();
    var last_node_added = [0,0]         //x e width dell'ultimo nodo aaggiunto
    bin = 0
    for(var i = 1; i<= maxDepth; i++){

        temp = nodes_internal_size.slice( bin, (num_comp_B[i] + num_CV[i] + bin) )
        console.log(temp)
        max_internal_size[i] = temp.reduce((a, b) => a + b)
        bin += num_comp_B[i] + num_CV[i]
    }

    console.log(max_internal_size)

    for (var i = 0; i < nodes.length; i++){
        k = nodes_depth[i]
        max_range = (window.innerWidth - num_CV[k] * cv_radius * 16 )
        node_range_width_pixel = [50,max_range];
        node_range_width_numEdges = [0, max_internal_size[k]]
        bcomp_width = map_on_range(nodes_internal_size[i], 0, max_internal_size[k], 10, max_range)


        if(current_depth != k){
            current_depth = k;
            count = 1;
            last_node_added = [0,0]
        }

        if(nodes_parent[i] == -1){
            //x = width / (nodes_in_layer[k] + 1) * count;
            x = last_node_added[0] + last_node_added[1] + 15
            y = height - (vertical_layer_space * k);
        }
        else{
            x = nodes_position[nodes_parent[i]][0]
                        //x = last_node_added[0] + last_node_added[1] + 15

            y = height - (vertical_layer_space * k);
        }

        if(nodes_type[i] == 1){         //vertice di taglio
            graphics.beginFill(0x3498db); // Blue
            graphics.drawCircle(x, y, cv_radius);
            graphics.endFill();
            stage.addChild(graphics);
            nodes_position[i] = [x,y]
            last_node_added = [x,cv_radius*2]
        }
        else{
            graphics.beginFill(0xdaa520); // Blue
            graphics.drawRect(x, y - bcomp_height/2, bcomp_width, bcomp_height)
            graphics.endFill();
            stage.addChild(graphics);
            nodes_position[i] = [x,y]
            last_node_added = [x,bcomp_width]
        }
        count ++;
    }

    for(var i = 0; i < edges_intra_layer.length; i++){
        s = edges_intra_layer[i][0]
        t = edges_intra_layer[i][1]
        x1 = nodes_position[s][0]
        y1 = nodes_position[s][1]
        x2 = nodes_position[t][0] + (bcomp_width/2)
        y2 = nodes_position[t][1] + bcomp_height/2
        graphics.lineStyle(2, 0x444444, 2);
        graphics.moveTo(x1,y1)
        graphics.quadraticCurveTo((x1+x2)/2 ,y1 + 50 ,x2,y2)
        stage.addChild(graphics);
    }
    renderer.render(stage);
}

function load_xml_cctree() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
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
    nodes = new Array()
    nodes_depth = new Array()
    nodes_parent = new Array()
    nodes_type = new Array()
    edges_between_layer = new Array()
    edges_intra_layer = new Array()
    nodes_internal_size = new Array()
    for(var i = 0; i < nodes_xml.length; i++){
        node = parseInt(nodes_xml[i].id.substring(1))
        node_depth = parseInt(nodes_xml[i].children[0].textContent)
        node_internal_size = parseInt(nodes_xml[i].children[1].textContent)
        node_parent = parseInt(nodes_xml[i].children[2].textContent)
        node_type = parseInt(nodes_xml[i].children[3].textContent)
        nodes.push(node)
        nodes_depth.push(node_depth)
        nodes_internal_size.push(node_internal_size)
        if(node_depth == 1){
            nodes_parent.push(-1)
        }
        else{
            nodes_parent.push(node_parent)
        }
        nodes_type.push(node_type)
    }
    for(var i = 0; i < edges_xml.length; i++){
        edge_type = parseInt(edges_xml[i].children[0].textContent)
        s = parseInt(edges_xml[i].attributes.source.textContent.substring(1))
        t = parseInt(edges_xml[i].attributes.target.textContent.substring(1))
        if(edge_type == 1){
            edges_intra_layer.push([s,t])
        }
        else{
            edges_between_layer.push([s,t])
        }
    }

    num_nodes = nodes.length;
    num_edges = edges_intra_layer.length + edges_between_layer.length;
    maxDepth = parseInt(xmlDoc.getElementsByTagName("data")[0].textContent);
    nodes_in_layer = xmlDoc.getElementsByTagName("data")[1].textContent.split(",").map(x=>+x);
    num_CV = xmlDoc.getElementsByTagName("data")[2].textContent.split(",").map(x=>+x);
    num_comp_B = xmlDoc.getElementsByTagName("data")[3].textContent.split(",").map(x=>+x);
    init_container();
}

function main(){
    load_xml_cctree();

}

main()
