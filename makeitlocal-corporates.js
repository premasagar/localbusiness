var REDBRIDGE_LATLNG = new google.maps.LatLng(51.578776399817066, 0.070037841796875),
    REDBRIDGE_DATA = redbridgePayments(),
    
    // Grab Tim template for map infowindow
    infowindowTemplate = document.getElementById("template-infowindow").innerHTML,
    map, openInfowindow, undef;
    
function marker(map, options){
    var latlng = options.latlng || new google.maps.LatLng(options.lat, options.lng),
        infowindow = new google.maps.InfoWindow({
            content: tim(infowindowTemplate, options)
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

function boundingBox(lats, lngs){
    return google.maps.LatLngBounds({
        sw: google.maps.LatLng(Math.min.apply(Math, lats), Math.min.apply(Math, lngs)),
        ne: google.maps.LatLng(Math.max.apply(Math, lats), Math.max.apply(Math, lngs))
    });
}

function getBoundingBoxFromPaymentsData(data){
    var lats = [],
        lngs = [];

    _.each(data, function(datum){
        if (datum.lat && datum.lng){
            lats.push(datum.lat);
            lngs.push(datum.lng);
        }
    });
    
    return lats.length ? boundingBox(lats, lngs) : null;
}

function init(){
    var options = {
            zoom: 12,
            center: REDBRIDGE_LATLNG,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        },
        boundingBox = getBoundingBoxFromPaymentsData(REDBRIDGE_DATA),
        map = new google.maps.Map(document.getElementById("map"), options);
    
    if (boundingBox){
        map.fitBounds(boundingBox);
    }
    return map;
}

/////

map = init();
marker(map, {lat:51.578, lng:0.070, title:"Foo", content:"<p>My brother knows Karl Marx.</p>"});

