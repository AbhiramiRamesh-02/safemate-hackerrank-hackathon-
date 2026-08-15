var mapRef = null;

async function loadDarkSpots() {
    var container = document.getElementById('darkSpotsList');
    if (!container) return;
    container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">Loading active risk zones...</p>';

    try {
        var spots = await apiCall('GET', '/dark-spots');
        if (spots.length === 0) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">No active dark spots reported in this city.</p>';
            return;
        }

        container.innerHTML = spots.map(function(s) {
            var badgeColor = s.risk_level === 'High' ? '#ef4444' : (s.risk_level === 'Medium' ? '#f59e0b' : '#10b981');
            return '<div style="background:#fafafa; border: 1px solid #e5e7eb; border-left: 4px solid ' + badgeColor + '; border-radius:12px; padding:15px; text-align:left;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">' +
                '<strong style="color:#333; font-size:15px;">📍 ' + s.title + ' (' + s.city + ')</strong>' +
                '<span style="background:' + badgeColor + '; color:#fff; font-size:11px; padding:2px 8px; border-radius:10px;">' + s.risk_level + ' Risk</span>' +
                '</div>' +
                '<p style="font-size:14px; color:#555; line-height:1.4;">' + s.description + '</p>' +
                '</div>';
        }).join('');
    } catch (err) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">Could not load dark spots.</p>';
    }
}

async function submitDarkSpot() {
    var title = document.getElementById('darkSpotTitle').value.trim();
    var city = document.getElementById('darkSpotCity').value;
    var risk = document.getElementById('darkSpotRisk').value;
    var desc = document.getElementById('darkSpotDescription').value.trim();

    if (!title) {
        alert('Please provide a name/title for the unsafe area!');
        return;
    }

    try {
        await apiCall('POST', '/dark-spots', {
            title: title,
            city: city,
            risk_level: risk,
            description: desc
        });
        alert('Unsafe area reported successfully!');
        document.getElementById('darkSpotTitle').value = '';
        document.getElementById('darkSpotDescription').value = '';
        loadDarkSpots();
    } catch (err) {
        alert(err.message);
    }
}

function calculateSafeRoute() {
    var start = document.getElementById('routeStart').value.trim();
    var end = document.getElementById('routeEnd').value.trim();

    if (!start || !end) {
        alert('Please enter both start and destination locations!');
        return;
    }

    document.getElementById('routeResultsDiv').classList.remove('hidden');

    var lat = 12.9716;
    var lng = 77.5946;

    setTimeout(function() {
        if (mapRef === null) {
            mapRef = L.map('map').setView([lat, lng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(mapRef);
        } else {
            mapRef.setView([lat, lng], 13);
        }

        mapRef.eachLayer(function (layer) {
            if (layer instanceof L.Polyline || layer instanceof L.Marker) {
                mapRef.removeLayer(layer);
            }
        });

        var unsafePoints = [
            [12.9784, 77.5724],
            [12.9818, 77.5951],
            [12.9344, 77.6192]
        ];
        var unsafePolyline = L.polyline(unsafePoints, {color: '#ef4444', weight: 4, dashArray: '5, 10'}).addTo(mapRef);
        L.marker(unsafePoints[1], {
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: "<div style='background-color:#ef4444; color:white; padding:4px 8px; border-radius:10px; font-size:10px; font-weight:bold; white-space:nowrap; border:1px solid white;'>⚠️ 3 Dark Spots</div>",
                iconSize: [80, 20],
                iconAnchor: [40, 10]
            })
        }).addTo(mapRef);

        var safePoints = [
            [12.9784, 77.5724],
            [12.9756, 77.6067],
            [12.9344, 77.6192]
        ];
        var safePolyline = L.polyline(safePoints, {color: '#22c55e', weight: 6}).addTo(mapRef);
        L.marker(safePoints[1], {
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: "<div style='background-color:#22c55e; color:white; padding:4px 8px; border-radius:10px; font-size:10px; font-weight:bold; white-space:nowrap; border:1px solid white;'>🛡️ Police Patrol</div>",
                iconSize: [90, 20],
                iconAnchor: [45, 10]
            })
        }).addTo(mapRef);

        L.marker(unsafePoints[0]).addTo(mapRef).bindPopup("Start: " + start);
        L.marker(unsafePoints[2]).addTo(mapRef).bindPopup("End: " + end);

        mapRef.invalidateSize();
    }, 100);
}
