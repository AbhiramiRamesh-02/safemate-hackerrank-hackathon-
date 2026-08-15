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
                html: "<div style='background-color:#ef4444; color:white; padding:4px 8px; border-radius:10px; font-size:10px; font-weight:bold; white-space:nowrap; border:1px solid white;'>3 Dark Spots</div>",
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
                html: "<div style='background-color:#22c55e; color:white; padding:4px 8px; border-radius:10px; font-size:10px; font-weight:bold; white-space:nowrap; border:1px solid white;'>Police Patrol</div>",
                iconSize: [90, 20],
                iconAnchor: [45, 10]
            })
        }).addTo(mapRef);

        L.marker(unsafePoints[0]).addTo(mapRef).bindPopup("Start: " + start);
        L.marker(unsafePoints[2]).addTo(mapRef).bindPopup("End: " + end);

        mapRef.invalidateSize();
    }, 100);
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
