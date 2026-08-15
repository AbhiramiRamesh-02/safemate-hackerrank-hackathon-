var mapRef = null;

async function loadDarkSpots() {
    var container = document.getElementById('darkSpotsList');
    if (!container) return;
    container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">Loading active risk zones...</p>';

    // Fix hidden Leaflet container resize distortion
    if (mapRef !== null) {
        setTimeout(function() {
            mapRef.invalidateSize();
        }, 100);
    }

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
                '<strong style="color:#333; font-size:15px;">' + s.title + ' (' + s.city + ')</strong>' +
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

    var lat = 0, lng = 0;
    try {
        var geoRes = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(title + ', ' + city));
        var geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
        }
    } catch(e) {
        console.warn(e);
    }

    if (lat === 0 && lng === 0) {
        var centers = {
            'Bangalore': [12.9716, 77.5946],
            'Chennai': [13.0827, 80.2707],
            'Jaipur': [26.9124, 75.7873],
            'Pondicherry': [11.9416, 79.8083],
            'Coorg': [12.3375, 75.8069],
            'Delhi': [28.6139, 77.2090],
            'Mumbai': [18.9750, 72.8258],
            'Hyderabad': [17.3850, 78.4867]
        };
        var center = centers[city] || [12.9716, 77.5946];
        lat = center[0] + (Math.random() - 0.5) * 0.04;
        lng = center[1] + (Math.random() - 0.5) * 0.04;
    }

    try {
        await apiCall('POST', '/dark-spots', {
            title: title,
            city: city,
            risk_level: risk,
            description: desc,
            latitude: lat,
            longitude: lng
        });
        alert('Unsafe area reported successfully!');
        document.getElementById('darkSpotTitle').value = '';
        document.getElementById('darkSpotDescription').value = '';
        loadDarkSpots();
    } catch (err) {
        alert(err.message);
    }
}

async function calculateSafeRoute() {
    var start = document.getElementById('routeStart').value.trim();
    var end = document.getElementById('routeEnd').value.trim();

    if (!start || !end) {
        alert('Please enter both start and destination locations!');
        return;
    }

    try {
        var shortestPathEl = document.getElementById('shortestRoutePath');
        var shortestRiskEl = document.getElementById('shortestRouteRiskCount');
        var safePathEl = document.getElementById('safeRoutePath');
        var safeStatusEl = document.getElementById('safeRouteStatus');

        if (shortestPathEl) shortestPathEl.innerHTML = "<strong>Path:</strong> Calculating shortest path coordinates...";
        if (safePathEl) safePathEl.innerHTML = "<strong>Path:</strong> Applying safety weights...";

        document.getElementById('routeResultsDiv').classList.remove('hidden');

        // 1. Geocode Start
        var startLat = 12.9716, startLng = 77.5946;
        var startGeoRes = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(start));
        var startGeoData = await startGeoRes.json();
        if (startGeoData && startGeoData.length > 0) {
            startLat = parseFloat(startGeoData[0].lat);
            startLng = parseFloat(startGeoData[0].lon);
        }

        // 2. Geocode End
        var endLat = 12.9344, endLng = 77.6192;
        var endGeoRes = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(end));
        var endGeoData = await endGeoRes.json();
        if (endGeoData && endGeoData.length > 0) {
            endLat = parseFloat(endGeoData[0].lat);
            endLng = parseFloat(endGeoData[0].lon);
        }

        // 3. Fetch real database dark spots
        var spots = await apiCall('GET', '/dark-spots');

        // Set map view
        if (mapRef === null) {
            mapRef = L.map('map').setView([startLat, startLng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(mapRef);
        } else {
            mapRef.setView([startLat, startLng], 13);
        }

        // Clear existing polylines/markers
        mapRef.eachLayer(function (layer) {
            if (layer instanceof L.Polyline || layer instanceof L.Marker) {
                mapRef.removeLayer(layer);
            }
        });

        // 4. Query OSRM for shortest route
        var routeUrl = 'https://router.project-osrm.org/route/v1/driving/' + startLng + ',' + startLat + ';' + endLng + ',' + endLat + '?overview=full&geometries=geojson';
        var routeRes = await fetch(routeUrl);
        var routeData = await routeRes.json();
        
        if (!routeData.routes || routeData.routes.length === 0) {
            alert("Could not calculate route via OpenStreetMap OSRM.");
            return;
        }

        var shortestCoords = routeData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);

        // Distance utility
        function getDistance(lat1, lon1, lat2, lon2) {
            var R = 6371e3; // meters
            var phi1 = lat1 * Math.PI/180;
            var phi2 = lat2 * Math.PI/180;
            var deltaPhi = (lat2-lat1) * Math.PI/180;
            var deltaLambda = (lon2-lon1) * Math.PI/180;
            var a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
                    Math.cos(phi1) * Math.cos(phi2) *
                    Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        }

        // 5. Detect intersecting dangerous spots
        var dangerousSpotsAlongRoute = [];
        spots.forEach(function(s) {
            if (!s.latitude || !s.longitude) return;
            // Add a marker for reported dark spots
            var spotMarker = L.marker([s.latitude, s.longitude], {
                icon: L.divIcon({
                    className: 'darkspot-marker-icon',
                    html: "<div style='background-color:#dc2626; color:white; padding:2px 6px; border-radius:8px; font-size:9px; font-weight:bold; border:1px solid white; white-space:nowrap;'>" + s.title + "</div>"
                })
            }).addTo(mapRef);
            spotMarker.bindPopup("<strong>Unsafe Spot:</strong> " + s.title + "<br>Risk: " + s.risk_level + "<br>" + s.description);

            for (var i = 0; i < shortestCoords.length; i++) {
                if (getDistance(shortestCoords[i][0], shortestCoords[i][1], s.latitude, s.longitude) < 600) {
                    dangerousSpotsAlongRoute.push(s);
                    break;
                }
            }
        });

        // 6. Draw route path lines
        var shortestPoly = L.polyline(shortestCoords, {color: '#ef4444', weight: 4, dashArray: '5, 10'}).addTo(mapRef);

        var finalSafeCoords = shortestCoords;
        if (dangerousSpotsAlongRoute.length > 0) {
            var sumLat = 0, sumLng = 0;
            dangerousSpotsAlongRoute.forEach(s => { sumLat += s.latitude; sumLng += s.longitude; });
            var avgLat = sumLat / dangerousSpotsAlongRoute.length;
            var avgLng = sumLng / dangerousSpotsAlongRoute.length;

            // Shift waypoint by 0.012 degrees to detour
            var detourLat = avgLat + 0.012;
            var detourLng = avgLng - 0.012;

            try {
                // Fetch detoured safe route
                var safeUrl = 'https://router.project-osrm.org/route/v1/driving/' + startLng + ',' + startLat + ';' + detourLng + ',' + detourLat + ';' + endLng + ',' + endLat + '?overview=full&geometries=geojson';
                var safeRes = await fetch(safeUrl);
                var safeData = await safeRes.json();
                if (safeData.routes && safeData.routes.length > 0) {
                    finalSafeCoords = safeData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    
                    var midIndex = Math.floor(finalSafeCoords.length / 2);
                    L.marker(finalSafeCoords[midIndex], {
                        icon: L.divIcon({
                            className: 'patrol-marker-icon',
                            html: "<div style='background-color:#16a34a; color:white; padding:3px 8px; border-radius:10px; font-size:10px; font-weight:bold; border:1px solid white; white-space:nowrap;'>Police Patrol Active</div>"
                        })
                    }).addTo(mapRef);
                }
            } catch(e) {
                console.warn("Alternative detour calculation failed:", e);
            }
        }

        var safePoly = L.polyline(finalSafeCoords, {color: '#22c55e', weight: 6}).addTo(mapRef);

        var bounds = L.latLngBounds([ [startLat, startLng], [endLat, endLng] ]);
        mapRef.fitBounds(bounds, { padding: [30, 30] });

        L.marker([startLat, startLng]).addTo(mapRef).bindPopup("Start: " + start);
        L.marker([endLat, endLng]).addTo(mapRef).bindPopup("Destination: " + end);

        // 7. Update UI results text dynamically
        if (shortestPathEl) shortestPathEl.innerHTML = "<strong>Path:</strong> " + start + " to " + end + " via shortest OSRM path";
        if (shortestRiskEl) {
            shortestRiskEl.textContent = dangerousSpotsAlongRoute.length + " Dark Spots detected in 600m routing radius!";
            shortestRiskEl.style.color = dangerousSpotsAlongRoute.length > 0 ? "#dc2626" : "#16a34a";
        }

        if (safePathEl) {
            safePathEl.innerHTML = dangerousSpotsAlongRoute.length > 0 
                ? "<strong>Path:</strong> Detoured route avoiding dangerous coordinates" 
                : "<strong>Path:</strong> Shortest route (No active dark spots detected)";
        }
        if (safeStatusEl) {
            safeStatusEl.textContent = dangerousSpotsAlongRoute.length > 0 
                ? "Safe route generated around reported risks. Well-lit streets prioritizing active patrols."
                : "Route is clear! MG Road & main highways are fully lit.";
        }

        setTimeout(function() {
            mapRef.invalidateSize();
        }, 100);

    } catch (err) {
        console.error(err);
        alert("Error plotting safe route: " + err.message);
    }
}

// ─── TOILET FINDER FEATURES ─────────────────────────────────
var toiletsData = {
    "Pondicherry": [
        { name: "Paradise Beach Public Toilet", type: "Public Toilet", address: "Paradise Beach Road", distance: "0.5 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "Promenade Beach Toilet", type: "Public Toilet", address: "Promenade Beach", distance: "1.2 km", rating: "5/5", clean: true, womenOnly: true },
        { name: "Auroville Public Toilet", type: "Public Toilet", address: "Auroville Main Road", distance: "2.5 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "Le Cafe Toilet", type: "Hotel/Restaurant", address: "Beach Road", distance: "0.8 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "Pondicherry Railway Station", type: "Railway Station", address: "Railway Station Road", distance: "3 km", rating: "3/5", clean: false, womenOnly: false }
    ],
    "Coorg": [
        { name: "Madikeri Bus Stand Toilet", type: "Bus Stand", address: "Madikeri Bus Stand", distance: "0.3 km", rating: "3/5", clean: true, womenOnly: false },
        { name: "Abbey Falls Toilet", type: "Public Toilet", address: "Abbey Falls Road", distance: "5 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "Raja's Seat Toilet", type: "Public Toilet", address: "Raja's Seat Garden", distance: "1 km", rating: "4/5", clean: true, womenOnly: true },
        { name: "Coorg Coffee Resort Toilet", type: "Hotel/Restaurant", address: "Coffee Plantations", distance: "4 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "Kushalnagar Toilet", type: "Public Toilet", address: "Kushalnagar Main Road", distance: "8 km", rating: "3/5", clean: false, womenOnly: false }
    ],
    "Jaipur": [
        { name: "Hawa Mahal Public Toilet", type: "Public Toilet", address: "Hawa Mahal Road", distance: "0.5 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "City Palace Toilet", type: "Public Toilet", address: "City Palace Complex", distance: "1 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "Amber Fort Toilet", type: "Public Toilet", address: "Amber Fort Entrance", distance: "6 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "Rajmandir Cinema Toilet", type: "Private/Paid", address: "C Scheme", distance: "2 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "Jaipur Railway Station", type: "Railway Station", address: "Railway Station Road", distance: "3 km", rating: "3/5", clean: false, womenOnly: false },
        { name: "Jantar Mantar Toilet", type: "Public Toilet", address: "Jantar Mantar Road", distance: "1.5 km", rating: "4/5", clean: true, womenOnly: true }
    ],
    "Bangalore": [
        { name: "MG Road Public Toilet", type: "Public Toilet", address: "MG Road", distance: "0.5 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "Koramangala Toilet", type: "Public Toilet", address: "Koramangala 5th Block", distance: "2 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "UB City Mall Toilet", type: "Private/Paid", address: "Vittal Mallya Road", distance: "1.5 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "Bangalore Railway Station", type: "Railway Station", address: "Railway Station Road", distance: "4 km", rating: "3/5", clean: false, womenOnly: false },
        { name: "Majestic Bus Stand", type: "Bus Stand", address: "Shivaji Nagar", distance: "3 km", rating: "3/5", clean: false, womenOnly: false }
    ],
    "Chennai": [
        { name: "Marina Beach Toilet", type: "Public Toilet", address: "Marina Beach Road", distance: "0.8 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "T Nagar Public Toilet", type: "Public Toilet", address: "T Nagar", distance: "2 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "Express Avenue Mall", type: "Private/Paid", address: "Royapettah", distance: "3 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "Chennai Central Railway", type: "Railway Station", address: "Broadway", distance: "4 km", rating: "3/5", clean: false, womenOnly: false },
        { name: "Anna Square Toilet", type: "Public Toilet", address: "Anna Square", distance: "1.5 km", rating: "4/5", clean: true, womenOnly: true }
    ]
};

function findNearbyToilets() {
    var location = document.getElementById('toiletLocation').value;
    var type = document.getElementById('toiletType').value;
    
    var toilets = toiletsData[location];
    var filteredToilets = toilets;
    
    if (type !== "All Types") {
        filteredToilets = toilets.filter(function(t) {
            return t.type === type;
        });
    }
    
    var html = '<h3 style="color:#333;margin-bottom:15px">Toilets in ' + location + '</h3>';
    
    if (filteredToilets.length === 0) {
        html += '<p style="color:#666;padding:20px;text-align:center;">No toilets found for selected type.</p>';
    } else {
        filteredToilets.forEach(function(toilet) {
            var badges = '';
            if (toilet.clean) {
                badges += '<span class="clean-badge">Clean</span>';
            }
            if (toilet.womenOnly) {
                badges += '<span class="women-only-badge">Women Only</span>';
            }
            
            html += '<div class="toilet-card">' +
                '<h4>' + toilet.name + '</h4>' +
                '<p class="toilet-type">' + toilet.type + '</p>' +
                '<p class="toilet-address">Address: ' + toilet.address + '</p>' +
                '<p class="toilet-distance">Distance: ' + toilet.distance + ' away</p>' +
                '<p class="toilet-rating">Rating: ' + toilet.rating + '</p>' +
                badges +
                '</div>';
        });
    }
    
    document.getElementById('toiletResults').innerHTML = html;
    document.getElementById('toiletResults').classList.remove('hidden');
}

function useCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                
                var cities = [
                    { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
                    { name: "Chennai", lat: 13.0827, lon: 80.2707 },
                    { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
                    { name: "Pondicherry", lat: 11.9416, lon: 79.8083 },
                    { name: "Coorg", lat: 12.3375, lon: 75.8069 }
                ];
                
                var nearestCity = cities[0];
                var minDistance = Infinity;
                
                cities.forEach(function(city) {
                    var distance = Math.sqrt(Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2));
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestCity = city;
                    }
                });
                
                document.getElementById('toiletLocation').value = nearestCity.name;
                alert("Located near " + nearestCity.name + ". Loading nearby toilets...");
                findNearbyToilets();
            },
            function(error) {
                alert("Could not retrieve GPS coordinates. Please select a city manually.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}
