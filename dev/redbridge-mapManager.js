google.load("maps", "2");
var map;
var geo;
var gmarkers = [];
var panoClient;
var streetview;
var _mapManager = new MapManager();
var _reportManager = new ReportManager();
var mm;
var polyLineWeight = 8;
var polygonLineWeight = 4;
var redbridgeBoundaryPolygon;
var visibleOverLaysArr = new Array();
var scrollToView = true;
var marker;
var homeMarker;
var neighbourhoodPolygon;
var newMarkers = new Array();
var moveBoundaryMarker;
var prevLoc;
var zoneMovePoints;

function MapManager() {
    this.AddCategoryAcordion = addCategoryAcordion;
    this.AddLayerMapLocations = addLayerMapLocations;
    this.ShowStreetView = showStreetView;
    this.EditStreetView = jQuery.fn.EditStreetView;
    this.CloseStreetView = jQuery.fn.CloseStreetView;
    this.ViewMapLocation = viewMapLocation;
    this.ClearAllOverlays = clearAllPreviousOverlays;
    this.ShowLoading = showLoading;
    this.AddSearchPoint = addSearchPoint;
    this.AddSearchMarkerList = addSearchMarkerList;
    this.ClearAllMapItems = clearAllMapItems;
    this.GeocodePoint = geocodePoint;
    this.ShowPickedPoint = showPickedPoint;
    this.ChangeNeighbourhoodRadius = changeNeighbourhoodRadius;
    this.ChangePostcode = changePostcode;
    this.SaveNeighbourhood = saveNeighbourhood;
    this.CancelNeighbourhoodUpdate = cancelNeighbourhoodUpdate;
    this.ShowReport = showReport;
    this.EditNeighbourhoodBoundary = false
}
function ReportManager() {
    this.ShowStreetView = showStreetView
}
google.setOnLoadCallback(function () {
    var a = document.getElementById("map");
    if (typeof(a) != "undefined" && a != null) {
        a.innerHTML = "Map coming...";
        if (!GBrowserIsCompatible()) {
            alert("Sorry. Your browser is not Google Maps compatible.")
        }
        if (document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#SVG", "1.1")) {
            _mSvgEnabled = true;
            _mSvgForced = true
        }
        _mPreferMetric = true;
        map = new GMap2(a);
        map.setUIToDefault();
        addRedbridgeBoundary();
        $("#SetHomeLocation").live("mouseover", function () {
            $(this).draggable({
                handle: "#MenuDrag"
            })
        })
    }
});

function showStreetView(e, b, f, d, c) {
    var a = new GLatLng(e, b);
    panoClient.getNearestPanoramaLatLng(a, function (g) {
        if (g != null) {
            jQuery.fn.ShowStreetView(e, b, f, d, c)
        } else {
            alert("StreetView not available for this location")
        }
    });
    return false
}
function addRedbridgeBoundary() {
    PageMethods.GetRedbridge(function (b) {
        redbridgeBoundaryPolygon = jQuery.fn.AddPolygon(b.PolyLineEncoded, b.PolyLevelsEncoded, b.PolyColor, 15, b.PolyLineType);
        addHomeIcon();
        var c = redbridgeBoundaryPolygon.getBounds().getCenter();
        var a = c;
        if (typeof(lat) != "undefined" && typeof(lon) != "undefined" && lat != "" && lon != "") {
            a = new GLatLng(lat, lon)
        }
        map.setCenter(a, 12);
        map.checkResize();
        geo = new GClientGeocoder();
        panoClient = new GStreetviewClient();
        streetview = new GStreetviewPanorama(document.getElementById("StreetView"));
        if (typeof(MarkerManager) != "undefined") {
            mm = new MarkerManager(map)
        }
    })
}
function addHomeIcon() {
    PageMethods.GetHome(function (c) {
        var b = c.split("#");
        var a = new GLatLng(b[0], b[1]);
        createHomeIcon(a)
    })
}
function createHomeIcon(a) {
    var b = new GIcon(G_DEFAULT_ICON);
    b.image = "/images/icons/houses/colour/house_iso.png";
    b.iconSize = new GSize(28, 33);
    b.shadow = "/images/icons/houses/colour/shadow-house_iso.png";
    b.shadowSize = new GSize(45, 33);
    b.iconAnchor = new GPoint(14, 24);
    b.infoWindowAnchor = new GPoint(14, 16);
    markerOptions = {
        icon: b,
        draggable: false
    };
    homeMarker = new GMarker(a, markerOptions);
    map.addOverlay(homeMarker);
    if (_mapManager.EditNeighbourhoodBoundary == true) {
        enableBoundaryEdit(a)
    }
}
function enableBoundaryEdit(a) {
    PageMethods.GetBoundaryLocation(function (e) {
        var b = $(".NewRadius").val();
        var d = e.split("#");
        var f = new GLatLng(d[0], d[1]);
        zoneMovePoints = drawCircle(f, b, "#090", 3, 1, true);
        var c = new GIcon(G_DEFAULT_ICON);
        moveBoundaryMarker = new GMarker(f, {
            icon: c,
            draggable: true
        });
        moveBoundaryMarker.enableDragging();
        prevLoc = f;
        GPolygon.prototype.Contains = function (h) {
            var k = 0;
            var m = false;
            var g = h.lng();
            var n = h.lat();
            for (var l = 0; l < this.getVertexCount(); l++) {
                k++;
                if (k == this.getVertexCount()) {
                    k = 0
                }
                if (((this.getVertex(l).lat() < n) && (this.getVertex(k).lat() >= n)) || ((this.getVertex(k).lat() < n) && (this.getVertex(l).lat() >= n))) {
                    if (this.getVertex(l).lng() + (n - this.getVertex(l).lat()) / (this.getVertex(k).lat() - this.getVertex(l).lat()) * (this.getVertex(k).lng() - this.getVertex(l).lng()) < g) {
                        m = !m
                    }
                }
            }
            return m
        };
        showNeighbourhoodUserCount(f, b);
        GEvent.addListener(moveBoundaryMarker, "mouseover", function () {
            moveBoundaryMarker.closeInfoWindow();
            addNeighbourhoodDragPoints(zoneMovePoints)
        });
        GEvent.addListener(moveBoundaryMarker, "mouseout", function () {
            moveBoundaryMarker.closeInfoWindow();
            removeNeighbourhoodDragPoints()
        });
        GEvent.addListener(moveBoundaryMarker, "dragstart", function () {
            moveBoundaryMarker.closeInfoWindow();
            map.removeOverlay(neighbourhoodPolygon)
        });
        GEvent.addListener(moveBoundaryMarker, "dragend", function () {
            removeNeighbourhoodDragPoints();
            var g = $(".NewRadius").val();
            zoneMovePoints = drawCircle(moveBoundaryMarker.getLatLng(), g, "#090", 3, 1, false);
            showNeighbourhoodUserCount(moveBoundaryMarker.getLatLng(), g)
        });
        GEvent.addListener(moveBoundaryMarker, "drag", function () {
            var h = prevLoc.lat() - moveBoundaryMarker.getLatLng().lat();
            var l = prevLoc.lng() - moveBoundaryMarker.getLatLng().lng();
            var n = new Array();
            for (i = 0; i < newMarkers.length; i++) {
                var g = newMarkers[i].getLatLng();
                var j = g.lat() - h;
                var m = g.lng() - l;
                var g = new GLatLng(j, m);
                n.push(g)
            }
            var k = new GPolygon(n, "#000000", 1, 1);
            if (k.getBounds() != null && k.Contains(a) != false) {
                for (i = 0; i < n.length; i++) {
                    newMarkers[i].setLatLng(n[i])
                }
                prevLoc = moveBoundaryMarker.getLatLng()
            } else {
                moveBoundaryMarker.setLatLng(prevLoc)
            }
        });
        this.map.addOverlay(moveBoundaryMarker);
        moveBoundaryMarker.openInfoWindowHtml("<b>Did you know?</b><p>You can drag the centre marker <br/>which will move your neighbourhood<br/> around.<br/><br/>This can be useful if you wish to <br/>remove certain streets/areas from <br/>your neighbourhood view.</p>")
    })
}
function addNeighbourhoodDragPoints(c) {
    var b = new GIcon(G_DEFAULT_ICON);
    b.image = "/images/icons/houses/colour/house_iso.png";
    b.iconSize = new GSize(20, 20);
    b.iconAnchor = new GPoint(10, 10);
    b.shadowSize = new GSize(0, 0);
    for (i = 0; i < c.length; i++) {
        var a = new GMarker(c[i], {
            icon: b,
            draggable: true
        });
        map.addOverlay(a);
        newMarkers[i] = a
    }
}
function removeNeighbourhoodDragPoints() {
    for (i = 0; i < newMarkers.length; i++) {
        map.removeOverlay(newMarkers[i])
    }
    newMarkers = new Array()
}
function showNeighbourhoodUserCount(b, a) {
    PageMethods.GetUsersInNeighbourhoodCount(b.lat(), b.lng(), a, function (c) {
        $("#UsersInNeighbourhood").html(c + " users in neighbourhood")
    })
}
function changeNeighbourhoodRadius() {
    PageMethods.GetUsersBoundarySize(function (c) {
        moveBoundaryMarker.closeInfoWindow();
        var b = $(".NewPostCode").val();
        var a = $(".NewRadius").val();
        map.removeOverlay(neighbourhoodPolygon);
        if (c > a) {
            var d = homeMarker.getLatLng();
            moveBoundaryMarker.setLatLng(d);
            zoneMovePoints = drawCircle(d, a, "#090", 3, 1, true);
            prevLoc = d
        } else {
            zoneMovePoints = drawCircle(moveBoundaryMarker.getLatLng(), a, "#090", 3, 1, true)
        }
        showNeighbourhoodUserCount(moveBoundaryMarker.getLatLng(), a)
    })
}
function changePostcode() {
    moveBoundaryMarker.closeInfoWindow();
    if (Page_ClientValidate()) {
        var a = $(".NewPostCode").val();
        PageMethods.GetLatLng(a, function (c) {
            var b = $(".NewRadius").val();
            var d = new GLatLng(c.Latitude, c.Longitude);
            map.removeOverlay(neighbourhoodPolygon);
            homeMarker.setLatLng(d);
            moveBoundaryMarker.setLatLng(d);
            prevLoc = d;
            if (c.District != "BC") {
                moveBoundaryMarker.openInfoWindowHtml("<b>Non Redbridge Postcode</b><p>The postcode you entered <br/>is outside of Redbridge.</p><p>We have set your neighbourhood<br/> to the center of redbridge <br/>by default.</p>");
                b = 3;
                $(".NewRadius").val(3)
            }
            zoneMovePoints = drawCircle(d, b, "#090", 3, 1, true);
            showNeighbourhoodUserCount(d, b)
        })
    }
}
function saveNeighbourhood() {
    var b = $(".NewPostCode").val();
    var a = $(".NewRadius").val();
    var c = moveBoundaryMarker.getLatLng();
    var d = homeMarker.getLatLng();
    PageMethods.SaveNeighbourhood(b, a, c.lat(), c.lng(), function (e) {
        if (e == false) {
            alert("There was a problem saving the update, please try again")
        } else {
            window.location = "/Default.aspx"
        }
    })
}
function cancelNeighbourhoodUpdate() {
    window.location = "/Default.aspx"
}
function addLayerMapLocations(b) {
    $("#MapMenu ul li div").hide();
    showRedbridgePolygon(false);
    clearAllMapItems();
    var c = b.MapLocations;
    if (c != null && c.length > 0) {
        for (var a = 0; a < c.length; a++) {
            createMarker(c[a], b.MapZoom)
        }
        mm.addMarkers(gmarkers, 0);
        mm.refresh()
    }
    map.setZoom(b.MapZoom);
    setTimeout("openDefaultMapLocation();showRedbridgePolygon(true);showLoading(false);", 2)
}
function showReport(a) {
    PageMethods.GetMapLocation(a, function (c) {
        var b = new GLatLng(c.Latitude, c.Longitude);
        var d = new Object();
        d.clickable = true;
        d.draggable = false;
        d.bouncy = false;
        marker = new GMarker(b, d);
        map.addOverlay(marker);
        marker.openInfoWindow(c.LocationData);
        map.setCenter(b, 16)
    })
}
function addSearchPoint(d, c, e) {
    var a = new GLatLng(d, c);
    var b = new Object();
    b.clickable = true;
    b.draggable = false;
    b.bouncy = false;
    marker = new GMarker(a, b);
    GEvent.addListener(marker, "click", function () {
        PageMethods.GetMapLocation(e, function (f) {
            if (f != null) {
                map.setCenter(a);
                showClickedItemInList(f);
                scrollListToView(f);
                marker.openInfoWindow(f.LocationData);
                if (f.PolyLineEncoded != null && f.PolyLineEncoded.length > 0) {
                    clearAllPreviousOverlays();
                    var g = jQuery.fn.AddPolygon(f.PolyLineEncoded, f.PolyLevelsEncoded, f.PolyColor, 13, f.PolyLineType);
                    visibleOverLaysArr[visibleOverLaysArr.length] = g
                }
                if (f.IsRatable) {
                    jQuery.fn.RatingSetup("StarRatingControl", f.Rating, f.ContentId, function (j, h) {
                        PageMethods.Rate(j, "" + h + "");
                        f.Rating = j
                    })
                } else {
                    setTimeout("$('#star-rating-holder').hide();", 2)
                }
            }
        })
    });
    gmarkers.push(marker)
}
function addSearchMarkerList(c) {
    map.setZoom(13);
    var d = c.split("|");
    for (var b = 0; b < d.length; b++) {
        var a = d[b].split("~");
        addSearchPoint(a[0], a[1], "" + a[2] + "")
    }
    $("#MapSearch ul li div").hide();
    mm.addMarkers(gmarkers, 0);
    setTimeout("showLoading(false);", 1)
}
function createMarker(b, g) {
    var e = b.Longitude;
    var h = b.Latitude;
    var f = b.LocationData;
    $("#StreetViewHolder").hide();
    var a = new GLatLng(h, e);
    var d = new Object();
    d.clickable = true;
    d.draggable = false;
    d.bouncy = false;
    var c = new GMarker(a, d);
    GEvent.addListener(c, "click", function () {
        map.setCenter(a);
        showClickedItemInList(b);
        scrollListToView(b);
        c.openInfoWindow(f);
        if (b.PolyLineEncoded != null && b.PolyLineEncoded.length > 0) {
            clearAllPreviousOverlays();
            var j = jQuery.fn.AddPolygon(b.PolyLineEncoded, b.PolyLevelsEncoded, b.PolyColor, g, b.PolyLineType);
            visibleOverLaysArr[visibleOverLaysArr.length] = j
        }
        if (b.IsRatable) {
            jQuery.fn.RatingSetup("StarRatingControl", b.Rating, b.ContentId, function (l, k) {
                PageMethods.Rate(l, "" + k + "");
                b.Rating = l
            })
        } else {
            setTimeout("$('#star-rating-holder').hide();", 2)
        }
    });
    gmarkers.push(c)
}
function showRating(b, c, a) {
    jQuery.fn.RatingSetup(b, c, function (e, d) {
        RedbridgeI.WebUI.Map.Default.Rate(e, "" + d + "");
        a.Rating = e
    })
}
function showClickedItemInList(a) {
    $("#MapMenu ul li,#MapSearch ul li").removeClass("selected");
    $("#MapMenu ul li .address,,#MapSearch ul li .address").hide();
    var b = $("#Address_" + a.MapLocationId);
    b.addClass("selected");
    $(".address", b).slideDown()
}
function scrollListToView(a) {
    if (scrollToView) {
        var b = $("#Address_" + a.MapLocationId)[0];
        if (typeof(b) != "undefined") {
            $("#MapMenu ul")[0].scrollTop = b.offsetTop - b.offsetHeight
        }
    }
    scrollToView = true
}
function addCategoryAcordion(c) {
    var b;
    var a = $("#" + c).val();
    if (a == "false") {
        b = Boolean.parse(a)
    } else {
        b = parseInt(a)
    }
    $("#MapMenu").accordion({
        fillSpace: true,
        collapsible: true,
        header: "h3",
        active: b
    })
}
function viewMapLocation(c, a) {
    var b = gmarkers[c];
    if (typeof(b) != "undefined") {
        $("#StreetViewHolder").hide();
        a = a;
        GEvent.trigger(b, "click")
    }
}
function openDefaultMapLocation() {
    var a = $(".MapLocIndexToShow").val();
    if (a != "") {
        viewMapLocation(a, true);
        $(".MapLocIndexToShow").val("")
    }
}
function showRedbridgePolygon(a) {
    if (a) {
        redbridgeBoundaryPolygon.show()
    } else {
        redbridgeBoundaryPolygon.hide()
    }
}
function clearAllMapItems() {
    gmarkers.length = 0;
    mm.clearMarkers();
    clearAllPreviousOverlays()
}
function clearAllPreviousOverlays() {
    map.getInfoWindow().hide();
    for (var a = 0; a <= visibleOverLaysArr.length - 1; a++) {
        map.removeOverlay(visibleOverLaysArr[a])
    }
}
function showLoading(a) {
    if (a) {
        document.getElementById("LoadingImap").style.display = "inline"
    } else {
        document.getElementById("LoadingImap").style.display = "none"
    }
}
function geocodePoint(a) {
    var c = a;
    var b = /[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][ABD-HJLNP-UW-Z]{2}/i;
    if (b.test(c)) {
        c = c.substr(0, c.length - 1)
    }
    if (c.indexOf("london") < 0) {
        c = c + ",london"
    }
    if (c.indexOf("uk") < 0) {
        c = c + ",uk"
    }
    geocode(c)
}
function geocode(a) {
    $("#LoadingImap").show();
    geo.getLocations(a, function (f) {
        if (f.Status.code == 200) {
            var d = f.Placemark;
            if (d.length >= 1 || typeof(a) == "object") {
                var b = d[0];
                var e = b.Point.coordinates[1];
                var c = b.Point.coordinates[0];
                $(".LongitudeValue").val(c);
                $(".LatitudeValue").val(e);
                showPickedPoint()
            }
        }
        $("#LoadingImap").hide()
    })
}
function showPickedPoint() {
    $(document).ready(function () {
        var e = $(".LatitudeValue").val();
        var c = $(".LongitudeValue").val();
        if (e != "" && c != "") {
            $(".ShowMarkerValue").val("Y");
            map.clearOverlays();
            var a = new GLatLng(e, c);
            var b = new Object();
            b.clickable = true;
            b.draggable = false;
            b.bouncy = false;
            marker = new GMarker(a, b);
            map.addOverlay(marker);
            map.setCenter(a, 15);
            var d = "<div style=\"width:200px;\"><div class=\"float_right\"><a href='#' id='streetViewLink' onclick='_mapManager.EditStreetView(false); return false;'>street view</a></div><p>You can choose the exact location with:</p></div>";
            marker.openInfoWindowHtml(d);
            GEvent.addListener(marker, "click", function () {
                marker.openInfoWindowHtml(d)
            });
            GEvent.addListener(map, "click", function (g, f) {
                if (f) {
                    marker.closeInfoWindow();
                    marker.setLatLng(f);
                    $(".LatitudeValue").val(f.lat());
                    $(".LongitudeValue").val(f.lng());
                    $(".StreetViewYawValue").val("0");
                    $(".StreetViewPitchValue").val("5");
                    $(".StreetViewZoomValue").val("0");
                    $(".ShowMarkerValue").val("Y");
                    marker.openInfoWindowHtml(d)
                }
                return false
            })
        }
    })
}
function drawCircle(center, circleRadius, color, thickness, opacity, recenter) {
    var bounds = new GLatLngBounds();
    var circlePoints = Array();
    var zoneMovePoints = Array();
    var zoneEditCount = 0;
    var circleUnits = "KM";
    with(Math) {
        if (circleUnits == "KM") {
            var d = circleRadius / 6378.8
        } else {
            var d = circleRadius / 3963.189
        }
        var lat1 = (PI / 180) * center.lat();
        var lng1 = (PI / 180) * center.lng();
        for (var a = 0; a < 361; a++) {
            var tc = (PI / 180) * a;
            var y = asin(sin(lat1) * cos(d) + cos(lat1) * sin(d) * cos(tc));
            var dlng = atan2(sin(tc) * sin(d) * cos(lat1), cos(d) - sin(lat1) * sin(y));
            var x = ((lng1 - dlng + PI) % (2 * PI)) - PI;
            var point = new GLatLng(parseFloat(y * (180 / PI)), parseFloat(x * (180 / PI)));
            circlePoints.push(point);
            if (zoneEditCount == 20) {
                zoneMovePoints.push(point);
                zoneEditCount = 0
            }
            zoneEditCount++
        }
        if (d < 1.5678565720686044) {
            neighbourhoodPolygon = new GPolygon(circlePoints, "#000000", 2, 1, color, 0.25)
        } else {
            neighbourhoodPolygon = new GPolygon(circlePoints, "#000000", 2, 1)
        }
        map.addOverlay(neighbourhoodPolygon)
    }
    if (recenter) {
        var boundary = neighbourhoodPolygon.getBounds();
        map.setCenter(boundary.getCenter(), map.getBoundsZoomLevel(boundary))
    }
    return zoneMovePoints
};
