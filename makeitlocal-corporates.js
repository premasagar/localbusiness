var REDBRIDGE_LATLNG = new google.maps.LatLng(51.578776399817066, 0.070037841796875),
    REDBRIDGE_DATA = redbridgePayments(),
    map, openInfowindow, undef;
    
function marker(map, options){
    var latlng = options.latlng || new google.maps.LatLng(options.lat, options.lng),
        infowindow = new google.maps.InfoWindow({
            content: "<div class=infowindow><h2>" + options.title + "</h2>" + options.content + "</div>"
        }),
        marker = new google.maps.Marker({
            position: latlng,
            map: map,
            icon: options.image,
            title: options.title
        }); 
        
    google.maps.event.addListener(marker, 'click', function() {
        if (openInfowindow){
            openInfowindow.close();
        }
        infowindow.open(map, marker);
        openInfowindow = infowindow;
    });
}

function init(){
    var options = {
            zoom: 12,
            center: REDBRIDGE_LATLNG,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        },
        map = new google.maps.Map(document.getElementById("map"), options);
    
    return map;
}

/////

map = init();
marker(map, {lat:51.578, lng:0.070, title:"Foo", content:"<p>My brother knows Karl Marx.</p>"});

