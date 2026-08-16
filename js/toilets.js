// Curated nearby clean and safe restroom directory for female travelers

const TOILETS_DIRECTORY = {
    Pondicherry: [
        { name: "Paradise Beach Public Restroom", type: "Public Toilet", address: "Paradise Beach Road", distance: "0.5 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "Promenade Beach Restroom", type: "Public Toilet", address: "Promenade Beach", distance: "1.2 km", rating: "5/5", clean: true, womenOnly: true },
        { name: "Auroville Visitors Centre", type: "Public Toilet", address: "Auroville Main Road", distance: "2.5 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "Le Cafe Restroom", type: "Hotel/Restaurant", address: "Beach Road", distance: "0.8 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "Pondicherry Railway Station Restrooms", type: "Railway Station", address: "Railway Station Road", distance: "3.0 km", rating: "3/5", clean: false, womenOnly: false }
    ],
    Coorg: [
        { name: "Madikeri Main Bus Stand", type: "Bus Stand", address: "Madikeri Bus Stand", distance: "0.3 km", rating: "3/5", clean: true, womenOnly: false },
        { name: "Abbey Falls Facilities", type: "Public Toilet", address: "Abbey Falls Road", distance: "5.0 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "Raja's Seat Garden Restroom", type: "Public Toilet", address: "Raja's Seat Garden", distance: "1.0 km", rating: "4/5", clean: true, womenOnly: true },
        { name: "Coorg Coffee Plantation Lounge", type: "Hotel/Restaurant", address: "Coffee Plantations", distance: "4.0 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "Kushalnagar Complex", type: "Public Toilet", address: "Kushalnagar Main Road", distance: "8.0 km", rating: "3/5", clean: false, womenOnly: false }
    ],
    Jaipur: [
        { name: "Hawa Mahal Tourist Restroom", type: "Public Toilet", address: "Hawa Mahal Road", distance: "0.5 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "City Palace Complex Facilities", type: "Public Toilet", address: "City Palace Complex", distance: "1.0 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "Amber Fort Rest Area", type: "Public Toilet", address: "Amber Fort Entrance", distance: "6.0 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "Rajmandir Cinema Restrooms", type: "Private/Paid", address: "C Scheme", distance: "2.0 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "Jaipur Junction Lounge", type: "Railway Station", address: "Railway Station Road", distance: "3.0 km", rating: "3/5", clean: false, womenOnly: false },
        { name: "Jantar Mantar Women Restroom", type: "Public Toilet", address: "Jantar Mantar Road", distance: "1.5 km", rating: "4/5", clean: true, womenOnly: true }
    ],
    Bangalore: [
        { name: "MG Road Metro Station", type: "Public Toilet", address: "MG Road", distance: "0.5 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "Koramangala 5th Block", type: "Public Toilet", address: "Koramangala 5th Block", distance: "2.0 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "UB City Executive Restrooms", type: "Private/Paid", address: "Vittal Mallya Road", distance: "1.5 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "Bangalore City Railway", type: "Railway Station", address: "Railway Station Road", distance: "4.0 km", rating: "3/5", clean: false, womenOnly: false },
        { name: "Majestic Terminal Complex", type: "Bus Stand", address: "Shivaji Nagar", distance: "3.0 km", rating: "3/5", clean: false, womenOnly: false }
    ],
    Chennai: [
        { name: "Marina Promenade Facilities", type: "Public Toilet", address: "Marina Beach Road", distance: "0.8 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "T Nagar Shopping Hub", type: "Public Toilet", address: "T Nagar", distance: "2.0 km", rating: "4/5", clean: true, womenOnly: false },
        { name: "Express Avenue Mall", type: "Private/Paid", address: "Royapettah", distance: "3.0 km", rating: "5/5", clean: true, womenOnly: false },
        { name: "Chennai Central Railway Station", type: "Railway Station", address: "Broadway", distance: "4.0 km", rating: "3/5", clean: false, womenOnly: false },
        { name: "Anna Square Restroom", type: "Public Toilet", address: "Anna Square", distance: "1.5 km", rating: "4/5", clean: true, womenOnly: true }
    ]
};

// Filters and displays matching restrooms
function findNearbyToilets() {
    const location = document.getElementById('toiletLocation')?.value || 'Bangalore';
    const selectedType = document.getElementById('toiletType')?.value || 'All Types';
    
    const toilets = TOILETS_DIRECTORY[location] || [];
    const filtered = selectedType === 'All Types' 
        ? toilets 
        : toilets.filter(t => t.type === selectedType);
    
    let html = `<h3 style="color:#333;margin-bottom:15px">Toilets in ${location}</h3>`;
    
    if (filtered.length === 0) {
        html += '<p style="color:#666;padding:20px;text-align:center;">No restrooms found matching the selected criteria.</p>';
    } else {
        html += filtered.map(t => `
            <div class="toilet-card">
                <h4>${t.name}</h4>
                <p class="toilet-type">${t.type}</p>
                <p class="toilet-address">Address: ${t.address}</p>
                <p class="toilet-distance">Distance: ${t.distance} away</p>
                <p class="toilet-rating">Rating: ${t.rating}</p>
                ${t.clean ? '<span class="clean-badge">Clean & Sanitized</span>' : ''}
                ${t.womenOnly ? '<span class="women-only-badge">Women Only</span>' : ''}
            </div>
        `).join('');
    }
    
    const container = document.getElementById('toiletResults');
    if (container) {
        container.innerHTML = html;
        container.classList.remove('hidden');
    }
}

// Estimates user's nearest supported city using browser GPS coordinates
function useCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude: lat, longitude: lon } = position.coords;
            
            const cityCoordinates = [
                { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
                { name: "Chennai", lat: 13.0827, lon: 80.2707 },
                { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
                { name: "Pondicherry", lat: 11.9416, lon: 79.8083 },
                { name: "Coorg", lat: 12.3375, lon: 75.8069 }
            ];
            
            let nearest = cityCoordinates[0];
            let minDistance = Infinity;
            
            cityCoordinates.forEach(city => {
                const distance = Math.hypot(city.lat - lat, city.lon - lon);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = city;
                }
            });
            
            const locationDropdown = document.getElementById('toiletLocation');
            if (locationDropdown) locationDropdown.value = nearest.name;
            
            alert(`Location matched to ${nearest.name}. Fetching nearby restrooms...`);
            findNearbyToilets();
        },
        () => {
            alert('Could not access current GPS position. Please select a city from the list.');
        }
    );
}
