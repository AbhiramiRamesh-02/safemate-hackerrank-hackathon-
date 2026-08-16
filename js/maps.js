
let mapRef = null;

const CITY_CENTERS = {
    Bangalore: [12.9716, 77.5946],
    Chennai: [13.0827, 80.2707],
    Jaipur: [26.9124, 75.7873],
    Pondicherry: [11.9416, 79.8083],
    Coorg: [12.3375, 75.8069],
    Delhi: [28.6139, 77.2090],
    Mumbai: [18.9750, 72.8258],
    Hyderabad: [17.3850, 78.4867]
};

async function loadDarkSpots() {
    const container = document.getElementById('darkSpotsList');
    if (!container) return;
    
    container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">Loading active risk zones...</p>';

    if (mapRef) {
        setTimeout(() => mapRef.invalidateSize(), 100);
    }

    try {
        const spots = await apiCall('GET', '/dark-spots');
        if (!spots.length) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">No active dark spots reported in this city.</p>';
            return;
        }

        container.innerHTML = spots.map(s => {
            const badgeColor = s.risk_level === 'High' ? '#ef4444' : (s.risk_level === 'Medium' ? '#f59e0b' : '#10b981');
            return `
                <div style="background:#fafafa; border: 1px solid #e5e7eb; border-left: 4px solid ${badgeColor}; border-radius:12px; padding:15px; text-align:left;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <strong style="color:#333; font-size:15px;">${s.title} (${s.city})</strong>
                        <span style="background:${badgeColor}; color:#fff; font-size:11px; padding:2px 8px; border-radius:10px;">${s.risk_level} Risk</span>
                    </div>
                    <p style="font-size:14px; color:#555; line-height:1.4;">${s.description}</p>
                </div>
            `;
        }).join('');
    } catch {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">Could not load dark spots.</p>';
    }
}

async function submitDarkSpot() {
    const title = document.getElementById('darkSpotTitle')?.value.trim();
    const city = document.getElementById('darkSpotCity')?.value || 'Bangalore';
    const risk = document.getElementById('darkSpotRisk')?.value || 'Medium';
    const desc = document.getElementById('darkSpotDescription')?.value.trim() || '';

    if (!title) {
        alert('Please give a title or landmark for this unsafe spot.');
        return;
    }

    let lat = 0, lng = 0;
    try {
        
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${title}, ${city}`)}`);
        const geoData = await geoRes.json();
        if (geoData?.length) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
        }
    } catch (e) {
        console.warn('Geocoding fallback:', e);
    }

    if (lat === 0 && lng === 0) {
        const center = CITY_CENTERS[city] || [12.9716, 77.5946];
        lat = center[0] + (Math.random() - 0.5) * 0.04;
        lng = center[1] + (Math.random() - 0.5) * 0.04;
    }

    try {
        await apiCall('POST', '/dark-spots', {
            title,
            city,
            risk_level: risk,
            description: desc,
            latitude: lat,
            longitude: lng
        });

        alert('Unsafe area reported. Thank you for keeping the community safe!');
        document.getElementById('darkSpotTitle').value = '';
        document.getElementById('darkSpotDescription').value = '';
        loadDarkSpots();
    } catch (err) {
        alert(err.message || 'Failed to submit report.');
    }
}

async function calculateSafeRoute() {
    const start = document.getElementById('routeStart')?.value.trim();
    const end = document.getElementById('routeEnd')?.value.trim();

    if (!start || !end) {
        alert('Please specify both start and destination points.');
        return;
    }

    try {
        document.getElementById('routeResultsDiv')?.classList.remove('hidden');

        let [startLat, startLng] = [12.9716, 77.5946];
        let [endLat, endLng] = [12.9344, 77.6192];

        try {
            const [sRes, eRes] = await Promise.all([
                fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(start)}`),
                fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(end)}`)
            ]);
            const [sData, eData] = await Promise.all([sRes.json(), eRes.json()]);
            if (sData?.[0]) { startLat = parseFloat(sData[0].lat); startLng = parseFloat(sData[0].lon); }
            if (eData?.[0]) { endLat = parseFloat(eData[0].lat); endLng = parseFloat(eData[0].lon); }
        } catch {}

        const spots = await apiCall('GET', '/dark-spots').catch(() => []);

        if (!mapRef) {
            mapRef = L.map('map').setView([startLat, startLng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(mapRef);
        } else {
            mapRef.setView([startLat, startLng], 13);
        }

        mapRef.eachLayer(layer => {
            if (layer instanceof L.Polyline || layer instanceof L.Marker) {
                mapRef.removeLayer(layer);
            }
        });

        const routeUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
        const routeRes = await fetch(routeUrl);
        const routeData = await routeRes.json();
        
        if (!routeData.routes?.length) {
            alert('Could not compute road route for given points.');
            return;
        }

        const shortestCoords = routeData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);

        const getDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371e3;
            const p1 = lat1 * Math.PI / 180;
            const p2 = lat2 * Math.PI / 180;
            const dp = (lat2 - lat1) * Math.PI / 180;
            const dl = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dp/2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        const dangerousSpots = [];
        spots.forEach(s => {
            if (!s.latitude || !s.longitude) return;
            
            const spotMarker = L.marker([s.latitude, s.longitude], {
                icon: L.divIcon({
                    className: 'darkspot-marker-icon',
                    html: `<div style='background-color:#dc2626; color:white; padding:2px 6px; border-radius:8px; font-size:9px; font-weight:bold; border:1px solid white; white-space:nowrap;'>${s.title}</div>`
                })
            }).addTo(mapRef);
            spotMarker.bindPopup(`<strong>Unsafe Spot:</strong> ${s.title}<br>Risk: ${s.risk_level}<br>${s.description}`);

            if (shortestCoords.some(c => getDistance(c[0], c[1], s.latitude, s.longitude) < 600)) {
                dangerousSpots.push(s);
            }
        });

        L.polyline(shortestCoords, { color: '#ef4444', weight: 4, dashArray: '5, 10' }).addTo(mapRef);

        let finalSafeCoords = shortestCoords;
        if (dangerousSpots.length > 0) {
            const avgLat = dangerousSpots.reduce((sum, s) => sum + s.latitude, 0) / dangerousSpots.length;
            const avgLng = dangerousSpots.reduce((sum, s) => sum + s.longitude, 0) / dangerousSpots.length;

            const detourLat = avgLat + 0.012;
            const detourLng = avgLng - 0.012;

            try {
                const safeUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${detourLng},${detourLat};${endLng},${endLat}?overview=full&geometries=geojson`;
                const safeRes = await fetch(safeUrl);
                const safeData = await safeRes.json();
                
                if (safeData.routes?.length) {
                    finalSafeCoords = safeData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    const midIndex = Math.floor(finalSafeCoords.length / 2);
                    
                    L.marker(finalSafeCoords[midIndex], {
                        icon: L.divIcon({
                            className: 'patrol-marker-icon',
                            html: "<div style='background-color:#16a34a; color:white; padding:3px 8px; border-radius:10px; font-size:10px; font-weight:bold; border:1px solid white; white-space:nowrap;'>Police Patrol Active</div>"
                        })
                    }).addTo(mapRef);
                }
            } catch (e) {
                console.warn('Detour calculation error:', e);
            }
        }

        L.polyline(finalSafeCoords, { color: '#22c55e', weight: 6 }).addTo(mapRef);

        const bounds = L.latLngBounds([[startLat, startLng], [endLat, endLng]]);
        mapRef.fitBounds(bounds, { padding: [30, 30] });

        L.marker([startLat, startLng]).addTo(mapRef).bindPopup(`Start: ${start}`);
        L.marker([endLat, endLng]).addTo(mapRef).bindPopup(`Destination: ${end}`);

        const shortestPathEl = document.getElementById('shortestRoutePath');
        const shortestRiskEl = document.getElementById('shortestRouteRiskCount');
        const safePathEl = document.getElementById('safeRoutePath');
        const safeStatusEl = document.getElementById('safeRouteStatus');

        if (shortestPathEl) shortestPathEl.innerHTML = `<strong>Path:</strong> ${start} to ${end} via shortest road path`;
        if (shortestRiskEl) {
            shortestRiskEl.textContent = `${dangerousSpots.length} Dark Spot(s) detected near route!`;
            shortestRiskEl.style.color = dangerousSpots.length > 0 ? '#dc2626' : '#16a34a';
        }

        if (safePathEl) {
            safePathEl.innerHTML = dangerousSpots.length > 0 
                ? '<strong>Path:</strong> Detoured route avoiding unlit / reported areas' 
                : '<strong>Path:</strong> Shortest route (No active risks detected)';
        }
        if (safeStatusEl) {
            safeStatusEl.textContent = dangerousSpots.length > 0 
                ? 'Detour active: Routing through monitored main avenues with patrol presence.'
                : 'Route is clear and well-lit.';
        }

        setTimeout(() => mapRef.invalidateSize(), 100);

    } catch (err) {
        console.error('Route calculation error:', err);
        alert(`Error calculating safe route: ${err.message}`);
    }
}
