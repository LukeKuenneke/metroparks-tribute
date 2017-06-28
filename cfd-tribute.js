// Add cfd tribute initialization function to onload
window.onload = function() {
    cfdInit();
};

var cfdTributeMap;
var cfdData = [];
var cfdMarkers = [];
var CFD_SPREADSHEET = 'https://docs.google.com/spreadsheets/d/1rOgUf2f6PwxUKVUZ9RgmO6Ulhh5PquNuFvNROovvd1w/pubhtml';

// Called on page load
function cfdInit() {
    Tabletop.init({
        key: CFD_SPREADSHEET,
        callback: cfdShowInfo,
        simpleSheet: true
    });

    jQuery('.data-filter').change(function() {
        cfdUpdateInfo({
            park: jQuery('#shelter-filter-parks').val(),
            type: jQuery('#shelter-filter-types').val()
        });
    })
}

function cfdInitMap() {
    cfdTributeMap = new google.maps.Map(document.getElementById('insivia-frmp-shelter-map'), {
        center: { lat: 39.715654, lng: -84.191239 },
        zoom: 8
    });
}

function cfdUpdateInfo(dataFilters) {
    let filters = Object.assign({}, dataFilters);

    for (var i = 0; i < cfdMarkers.length; i++) {
        if ((filters.park && filters.park !== cfdData[cfdMarkers[i].elementIndex].MetroPark) ||
            (filters.type && filters.type !== cfdData[cfdMarkers[i].elementIndex].Type)) {
            cfdMarkers[i].setMap(null);
        }
        else {
            cfdMarkers[i].setMap(cfdTributeMap);
        }
    }

    jQuery('.cfd-result-row').addClass('hidden-row');
    jQuery('.cfd-result-row' + (filters.park ? '[data-park="' + filters.park + '"]' : '') + (filters.type ? '[data-type="' + filters.type + '"]' : '')).removeClass('hidden-row');
}

function cfdShowInfo(data, tabletop) {
    console.log('Loaded ' + data.length + ' tribute items...');

    let uniqueParks = [];
    let uniqueTypes = [];
    let bounds = new google.maps.LatLngBounds();
    data.forEach(function(elem) {
        if (elem) {
            cfdData.push(elem);

			let lat = parseFloat(elem.Latitude);
			let lon = parseFloat(elem.Longitude);

			if (lat && lon) {
				var marker = new google.maps.Marker({
                    position: {lat: lat, lng: lon},
                    map: cfdTributeMap,
                    title: elem.MetroPark + " " + elem.Type + ': ' + elem['Location Description'],
                });

                marker.elementIndex = cfdData.length - 1;

                var img_html = '';

                if (elem['Photo link'] !== '') {
                  var file_id = elem['Photo link'].slice(elem['Photo link'].indexOf("=") + 1); // exploiting the fact the file id is the only query parameter
                  var asset_url = "https://drive.google.com/uc?export=view&id=" + file_id;
                  img_html = '<a href="'+ asset_url + '" data-lightbox="image-1" data-title="'+elem['Location Description']+'"><img src="' + asset_url + '"" width="64" height="48"></img></a>';
                }

                var purchase_html = '<a class="blue-btn btn reserve-now" href="tribute-checkout?item='+elem['MetroPark']+elem['Type']+elem['Location Description']+'&price='+elem['Cost']+'">Purchase Now</a>';

                var contentString =
                    '<div class="marker-content">' +
                        '<h1>' + elem.Type + '</h1>' +
                        '<span>' + elem.Cost + '</span><br>' +
                        '<span><strong>' + elem.MetroPark + '</strong></span><br>' +
                        '<span>' + elem['Location Description'] + '</span><br>' +
                        '<span><strong>Status:</strong> ' + elem.Status + '</span><br>' +
                        '<div>' + img_html + '</div>' +
                        '<div>' + purchase_html + '</div>'
                    '</div>';

                marker.infowindow = new google.maps.InfoWindow({
                    content: contentString
                });

                marker.addListener('click', function() {
                    for (var i = 0; i < cfdMarkers.length; i++) {
                      cfdMarkers[i].infowindow.close()
                    }
                    if (marker.infowindow.map) {
                        marker.infowindow.close();
                    } else {
                        marker.infowindow.open(cfdTributeMap, marker);
                    }
                });

                cfdMarkers.push(marker);

                bounds.extend({lat: lat, lng: lon});
			}

            // track unique parks and add an item to the filter for each
            if (elem.MetroPark && uniqueParks.indexOf(elem.MetroPark) === -1) {
                uniqueParks.push(elem.MetroPark);
                jQuery('#shelter-filter-parks').append('<option value="' + elem.MetroPark + '">' + elem.MetroPark + '</option>');
            }

            // track unique types and add an item to the filter for each
            if (elem.Type && uniqueTypes.indexOf(elem.Type) === -1) {
                uniqueTypes.push(elem.Type);
                jQuery('#shelter-filter-types').append('<option value="' + elem.Type + '">' + elem.Type + '</option>');
            }
		}

        var template = jQuery('#cfd-tribute-result-template').html();
        var row = jQuery(template);
        row.find('.insivia-frmp-list-item-type').text(elem.Type);
        row.find('.insivia-frmp-list-item-location').text('at ' + elem.MetroPark);
        row.find('.insivia-frmp-list-item-cost').text(elem.Cost);
        row.find('.insivia-frmp-list-item-location-description').html('<strong>Location:</strong> ' + elem['Location Description']);
        row.find('.insivia-frmp-list-item-location-status').html('<strong>Status:</strong> ' + elem.Status);
        row.find('.insivia-frmp-list-item-reserve-now-wrapper').html('<a class="blue-btn btn reserve-now" href="tribute-checkout?item='+elem['MetroPark']+elem['Type']+elem['Location Description']+'&price='+elem['Cost']+'">Purchase Now</a>');
        if (elem['Photo link'] !== '') {
          var file_id = elem['Photo link'].slice(elem['Photo link'].indexOf("=") + 1); // exploiting the fact the file id is the only query parameter
          var asset_url = "https://drive.google.com/uc?export=view&id=" + file_id;
          row.find('.insivia-frmp-gallery-link').html('<a href="'+ asset_url + '" data-lightbox="image-1" data-title="'+elem['Location Description']+'"><img src="' + asset_url + '"" width="64" height="48"></img></a>');
        } else{
          row.find('.insivia-frmp-gallery-link').remove();
        }
        row.attr('data-type', elem.Type);
        row.attr('data-park', elem.MetroPark);
        if (elem.Status !== 'Taken') {
          jQuery('#tribute-searchresults').append(row);
        }

    });

    if (!bounds.isEmpty()) {
        cfdTributeMap.fitBounds(bounds);
    }
}
