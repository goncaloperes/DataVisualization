//  Define width and height
var chart_width     =   800;
var chart_height    =   600;


// Define the color scale
var color           =   d3.scaleQuantize().range([
    "#f7fbff",
    "#deebf7",
    "#c6dbef",
    "#9ecae1",
    "#6baed6",
    "#4292c6",
    "#2171b5",
    "#08519c",
    "#08306b"
]);


// Navbar
function openNav() {
    document.getElementById("mySidenav").style.width = "20%";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}


// Define the Tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");


// Define the Map Projection
var projection      =   d3.geoAlbersUsa()
    .translate([ 0,0 ]);
var path            =   d3.geoPath( projection );


// Create SVG
var svg             =   d3.select("#chart")
    .append("svg")
    .attr("width", chart_width)
    .attr("height", chart_height);


// Zoom
var zoom_map        =   d3.zoom()
    .scaleExtent([ 0.5, 3.0 ])
    .translateExtent([
        [ -1000, -500 ],
        [ 1000, 500 ]
    ])
    .on( 'zoom', function(){
        // console.log( d3.event );
        var offset      =   [
            d3.event.transform.x,
            d3.event.transform.y
        ];
        var scale       =   d3.event.transform.k * 1100;

        projection.translate( offset )
            .scale( scale );

        svg.selectAll( 'path' )
            .transition()
            .attr( 'd', path );

        svg.selectAll( 'circle' )
            .transition()
            .attr( "cx", function(d) {
                return projection([d.longitude, d.latitude])[0];
            })
            .attr( "cy", function(d) {
                return projection([d.longitude, d.latitude])[1];
            });
    });

var map             =   svg.append( 'g' )
    .attr( 'id', 'map' )
    .call( zoom_map )
    .call(
        zoom_map.transform,
        d3.zoomIdentity
            .translate( chart_width / 2, chart_height / 2 )
            .scale( 1 )
    );

map.append( 'rect' )
    .attr( 'x', 0 )
    .attr( 'y', 0 )
    .attr( 'class', "mapsvg")
    .attr( 'width', chart_width )
    .attr( 'height', chart_height )
    .attr( 'opacity', 0 );



d3.json( `data/HoneyProduction-2012.json` , function( honey_data ){

    color.domain([
        d3.min( honey_data, function(d){
            return d.honey_producing_colonies;
        }),
        d3.max( honey_data, function(d){
            return d.honey_producing_colonies;
        })
    ]);

    // Load GeoJson Data
    d3.json( 'data/us.json', function( us_data ){
        us_data.features.forEach(function(us_e, us_i){
            honey_data.forEach(function(h_e,h_i){
                if( us_e.properties.name !== h_e.state ){
                    return null;
                }

                us_data.features[us_i].properties.honey_producing_colonies   =   parseFloat(h_e.honey_producing_colonies);
            });
        });


        // Bind Data
        map.selectAll( 'path' )
            .data( us_data.features )
            .enter()
            .append( 'path' )
            .attr( 'd', path )
            .attr( 'fill', function( d ){
                var honey_producing_colonies         =   d.properties.honey_producing_colonies;
                return honey_producing_colonies ? color( honey_producing_colonies ) : '#525252';
            })
            .attr( 'stroke', '#fff' )
            .attr( 'stroke-width', 1 )

            // Tooltip
            .on("mouseover", function(d) {
                tooltip.transition()
                    .duration(250)
                    .style("opacity", 1);
                tooltip.html("<strong>" + d.properties.name + "</strong>" + "<br/>" + "Honey Producing Colonies: " +
                    (d.properties.honey_producing_colonies))
                    .style("left", (d3.event.pageX + 15) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(250)
                    .style("opacity", 0);
            })
            .on('click', function(d){
                if(clickFlag){
                    tooltip.hide(d);
                }else{
                    tooltip.show(d);
                }
                return clickFlag = !clickFlag;
            })
            .append('title')
    });

    // Legend
    const x = d3.scaleLinear()
        .domain(d3.extent(color.domain()))
        .rangeRound([500, 750]);

    const g = svg.append("g")
        .attr( "class", "legend" )
        .attr("transform", "translate(0,40)");

    g.selectAll("rect")
        .data(color.range().map(d => color.invertExtent(d)))
        .enter().append("rect")
        .attr("height", 8)
        .attr("x", d => x(d[0]))
        .attr("width", d => x(d[1]) - x(d[0]))
        .attr("fill", d => color(d[0]));

    g.append("text")
        .attr("class", "caption")
        .attr("x", x.range()[0])
        .attr("y", -6)
        .attr("fill", "#fff")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text('Honey Producing Colonies →');

    g.call(d3.axisBottom(x)
        .tickSize(13)
        .tickFormat(( honey_data, function(d){
            return d.honey_producing_colonies;
        }),)
        .tickValues(color.range().slice(1).map(d => color.invertExtent(d)[0])))
        .select(".domain")
        .remove();

    svg.append("g")
        .selectAll("path")
        .data(honey_data, function(d){
            return d.honey_producing_colonies;
        })
        .enter().append("path")
        .attr("fill", d => color(d.honey_producing_colonies))
        .attr("d", path)
        .append("title")
        .text(d => (d.honey_producing_colonies));

    svg.append("path")
        .datum(honey_data, function(d){
            return d.honey_producing_colonies;
        })
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("d", path);

});


// Panning
d3.selectAll( '#buttons button.panning' ).on( 'click', function(){
    var x           =   0;
    var y           =   0;
    var distance    =   100;
    var direction   =   d3.select( this ).attr( 'class' ).replace( 'panning ', '' );

    if( direction === "up" ){
        y           +=  distance; // Increase y offset
    }else if( direction === "down" ){
        y           -=  distance; // Decrease y offset
    }else if( direction === "left" ){
        x           +=  distance; // Increase x offset
    }else if( direction === "right" ){
        x           -=  distance; // Decrease x offset
    }

    map.transition()
        .call( zoom_map.translateBy, x, y );
});


// Zooming
d3.selectAll( '#buttons button.zooming' ).on( 'click', function(){
    var scale       =   1;
    var direction   =   d3.select(this).attr("class").replace( 'zooming ', '' );

    if( direction === "in" ){
        scale       =  1.25;
    }else if(direction === "out"){
        scale       =  0.75;
    }

    map.transition()
        .call(zoom_map.scaleBy, scale);
});