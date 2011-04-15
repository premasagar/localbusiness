var REDBRIDGE_LATLNG = new google.maps.LatLng(51.578776399817066, 0.070037841796875),
    REDBRIDGE_DATA = redbridgePayments(),
    googleMapsImagePath = "http://www.google.com/intl/en_ALL/mapfiles/",
    markerFilenames = [
        "marker.png",
        "marker_black.png",
        "marker_brown.png",
        "marker_green.png",
        "marker_purple.png",
        "marker_yellow.png",
        "marker_grey.png",
        "marker_orange.png",
        "marker_white.png",
        "ms/micons/blue-dot.png"
    ],
    map, openInfowindow, undef;
    
function marker(map, options){_(2);
    var latlng = options.latlng || new google.maps.LatLng(options.lat, options.lng),
        marker = new google.maps.Marker({
            position: latlng,
            map: map,
            icon: options.icon,
            title: options.title
        });
        
    google.maps.event.addListener(marker, 'click', function() {
        if (openInfowindow){
            openInfowindow.close();
        }
        
        openInfowindow = marker.infowindow || (marker.infowindow = new google.maps.InfoWindow({
            content: tim("template-infowindow", options.content)
        }));
        
        openInfowindow.open(map, marker);
    });
    _(marker, marker.position);
}

function boundingBox(lats, lngs){
    return new google.maps.LatLngBounds(
        new google.maps.LatLng(
            Math.min.apply(Math, lats),
            Math.min.apply(Math, lngs)
        ),
        new google.maps.LatLng(
            Math.max.apply(Math, lats),
            Math.max.apply(Math, lngs)
        )
    );
}

function getBoundingBoxFromPaymentsData(data){
    var lats = [],
        lngs = [];

    _.each(data, function(datum){
        if (datum.lat && datum.lon){
            lats.push(datum.lat);
            lngs.push(datum.lon);
        }
    });
    
    return lats.length ? boundingBox(lats, lngs) : null;
}

function createMarkers(map, data){
    var valid = [];
    function markerFromDatum(datum, i){
        if (datum.lat && datum.lat !== "None" && datum.lon && datum.lon !== "None"){
            valid.push(datum);
            marker(map, {
                lat: datum.lat,
                lng: datum.lon,
                icon: googleMapsImagePath + markerFilenames[0],
                title: datum["Supplier description"].join(","),
                content: {
                    supplier: datum["Supplier description"].join(", "),
                    company_reg: datum["Company registration number"],
                    oc_description: datum.oc_description,
                    meta: {
                        "Bvsum":            datum["Bvsum description"].join(", "),
                        "Classification":   datum["Classification description"].join(", "),
                        "Service":          datum.Service.join(", ")
                    },
                    oc_address: datum.oc_address,
                    amount: datum.Amount
                }
            });
        }
    }
    
    _.each(data, markerFromDatum);
}

function init(){
    var data = REDBRIDGE_DATA,
        options = {
            zoom: 8,
            center: REDBRIDGE_LATLNG,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        },
        boundingBox = null,//getBoundingBoxFromPaymentsData(data),
        map = new google.maps.Map(document.getElementById("map"), options),
        infoElem = document.getElementById("info"),
        closeinfoElem = document.getElementById("closeinfo");
    
    if (boundingBox){
        map.fitBounds(boundingBox);
    }
    
    // Allow time for map to render
    window.setTimeout(function(){
        createMarkers(map, data);
        data = null;
    }, 500);
    
    if (closeinfoElem.addEventListener){
        document.getElementById("closeinfo").addEventListener("click", function(event){
            infoElem.parentNode.removeChild(infoElem);
        }, false);
    }
    else {
        closeinfoElem.parentNode.removeChild(closeinfoElem);
    }
    
    return map;
}
//http://data.redbridge.gov.uk/View/finance/payments-over-500

/////

map = init();
