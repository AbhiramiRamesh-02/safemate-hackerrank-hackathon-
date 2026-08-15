var placesData = {
    "Pondicherry": {
        "Nature": [
            { name: "Paradise Beach", rating: "5/5", count: 28, comment: "Beautiful!" },
            { name: "Auroville Gardens", rating: "4/5", count: 42, comment: "Peaceful" }
        ],
        "Cafes": [
            { name: "Cafe des Arts", rating: "5/5", count: 56, comment: "Great!" },
            { name: "Coromandel Cafe", rating: "4/5", count: 34, comment: "Nice" }
        ],
        "Adventure": [
            { name: "Scuba Diving", rating: "5/5", count: 19, comment: "Safe" },
            { name: "Surfing", rating: "4/5", count: 23, comment: "Fun" }
        ],
        "Shopping": [
            { name: "Mission Street", rating: "4/5", count: 67, comment: "Busy" },
            { name: "Sunday Market", rating: "5/5", count: 89, comment: "Bargains!" }
        ]
    },
    "Coorg": {
        "Nature": [
            { name: "Abbey Falls", rating: "5/5", count: 124, comment: "Must visit!" },
            { name: "Raja's Seat", rating: "4/5", count: 98, comment: "Sunset!" }
        ],
        "Cafes": [
            { name: "Coffee Plantation", rating: "5/5", count: 58, comment: "Best coffee!" },
            { name: "Beans n Brews", rating: "4/5", count: 41, comment: "Cozy" }
        ],
        "Adventure": [
            { name: "Tadiandamol Trek", rating: "5/5", count: 45, comment: "Safe" },
            { name: "River Rafting", rating: "4/5", count: 32, comment: "Thrilling" }
        ],
        "Shopping": [
            { name: "Coorg Spice Market", rating: "4/5", count: 73, comment: "Authentic" },
            { name: "Madikeri Shops", rating: "5/5", count: 89, comment: "Souvenirs" }
        ]
    },
    "Jaipur": {
        "Nature": [
            { name: "Sisodia Garden", rating: "4/5", count: 45, comment: "Peaceful" },
            { name: "Kanak Vrindavan", rating: "5/5", count: 62, comment: "Beautiful" }
        ],
        "Cafes": [
            { name: "Tapri Central", rating: "5/5", count: 89, comment: "Chai!" },
            { name: "Wind View Cafe", rating: "4/5", count: 67, comment: "Views" }
        ],
        "Adventure": [
            { name: "Fort Cycling", rating: "5/5", count: 38, comment: "Adventure" },
            { name: "Hot Air Balloon", rating: "5/5", count: 156, comment: "Unforgettable!" }
        ],
        "Shopping": [
            { name: "Bapu Bazaar", rating: "5/5", count: 234, comment: "Textiles!" },
            { name: "Johari Bazaar", rating: "4/5", count: 187, comment: "Jewelry" }
        ]
    }
};

function createTrip() {
    var destination = document.getElementById('tripDestination').value;
    var interest = document.getElementById('tripInterest').value;
    var fromDate = document.getElementById('tripFromDate').value;
    var toDate = document.getElementById('tripToDate').value;
    
    if (fromDate && toDate) {
        if (new Date(toDate) < new Date(fromDate)) {
            alert("To Date must be after From Date!");
            return;
        }
    }
    
    var daysText = "";
    if (fromDate && toDate) {
        var from = new Date(fromDate);
        var to = new Date(toDate);
        var days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
        daysText = " (" + days + " day" + (days > 1 ? "s" : "") + ")";
    }
    
    var places = placesData[destination][interest];
    var dateRange = "";
    if (fromDate && toDate) {
        dateRange = '<p style="color:#ec4899;font-weight:600;margin-bottom:15px;">Date: ' + fromDate + ' to ' + toDate + daysText + '</p>';
    } else if (fromDate) {
        dateRange = '<p style="color:#ec4899;font-weight:600;margin-bottom:15px;">Starting from: ' + fromDate + '</p>';
    }
    
    var html = '<h3 style="color:#333;margin-bottom:15px">Safe Places in ' + destination + '</h3>';
    html += dateRange;
    
    places.forEach(function(place) {
        html += '<div class="place-card">' +
            '<h4>' + place.name + '</h4>' +
            '<p><span class="rating">Rating: ' + place.rating + '</span> <span class="reviews-count">(' + place.count + ' reviews)</span></p>' +
            '<p class="comment">"' + place.comment + '"</p>' +
            '<span class="safe-badge">Safe for women</span>' +
            '</div>';
    });

    document.getElementById('recommendations').innerHTML = html;
    document.getElementById('recommendations').classList.remove('hidden');
}

function toggleStayRegistrationForm() {
    var form = document.getElementById('stayRegistrationForm');
    if (form) {
        if (form.classList.contains('hidden')) {
            form.classList.remove('hidden');
        } else {
            form.classList.add('hidden');
        }
    }
}

async function registerStay() {
    var name = document.getElementById('stayNameInput').value.trim();
    var type = document.getElementById('stayTypeInput').value;
    var city = document.getElementById('stayCityInput').value.trim();
    var address = document.getElementById('stayAddressInput').value.trim();
    var price = document.getElementById('stayPriceInput').value.trim();
    var phone = document.getElementById('stayPhoneInput').value.trim();
    var description = document.getElementById('stayDescInput').value.trim();
    var safety = document.getElementById('staySafetyInput').value.trim();

    if (!name || !city || !address || !price || !phone) {
        alert('Please fill out all required fields (Name, City, Address, Price, Phone)!');
        return;
    }

    try {
        await apiCall('POST', '/stays', {
            name: name,
            type: type,
            city: city,
            address: address,
            price_per_month: price,
            phone: phone,
            description: description || undefined,
            safety_measures: safety || undefined
        });
        alert('Success! Your female-safe stay has been registered successfully. It will now show up in the directory.');
        
        document.getElementById('stayNameInput').value = '';
        document.getElementById('stayCityInput').value = '';
        document.getElementById('stayAddressInput').value = '';
        document.getElementById('stayPriceInput').value = '';
        document.getElementById('stayPhoneInput').value = '';
        document.getElementById('stayDescInput').value = '';
        document.getElementById('staySafetyInput').value = '';
        toggleStayRegistrationForm();

        loadStays();
    } catch (err) {
        alert('Registration failed: ' + err.message);
    }
}

async function loadStays() {
    var container = document.getElementById('verifiedStaysList');
    if (!container) return;

    try {
        var stays = await apiCall('GET', '/stays');
        if (stays.length === 0) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;grid-column:1/-1;">No stays registered yet.</p>';
            return;
        }

        var html = '';
        stays.forEach(function(s) {
            var measuresList = (s.safety_measures || []).map(m => '<li>✓ ' + m + '</li>').join('');
            
            html += '<div class="service-card">' +
                '<h4>' + s.name + ' <span style="font-size:11px; background:#fdf2f8; color:#be185d; padding:2px 6px; border-radius:4px; border:1px solid #fbcfe8; float:right;">' + s.type + '</span></h4>' +
                '<p class="service-type">Location: ' + s.city + ' • ' + s.address + '</p>' +
                '<p style="font-weight:600; color:#18181b; margin-top:8px;">Price: ' + s.price_per_month + '</p>' +
                '<p style="font-size:12px; color:#71717a; margin-top:6px; font-style:italic;">' + s.description + '</p>' +
                '<div style="margin-top:10px; padding-top:10px; border-top:1px dashed #f3f4f6;">' +
                '  <span style="font-size:11px; font-weight:700; color:#db2777;">Verified Safety Measures:</span>' +
                '  <ul style="font-size:11px; color:#10b981; list-style:none; padding:0; margin:4px 0 0 0; display:flex; flex-direction:column; gap:2px;">' + measuresList + '</ul>' +
                '</div>' +
                '<button class="booking-btn" onclick="bookStay(\'' + s.name + '\', \'' + s.type + '\', \'' + s.price_per_month + '\')">Book Now</button>' +
                '</div>';
        });
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;grid-column:1/-1;">Could not load stays from server.</p>';
    }
}

async function bookStay(name, type, price) {
    var user = getCurrentUser();
    if (!user) { alert('Please login first!'); return; }

    try {
        await apiCall('POST', '/stays/book', {
            stay_name: name,
            stay_type: type,
            price: price
        });
        alert('Stay Booking Successful!\n\nYou have successfully requested accommodation at ' + name + '.\n\nYou can now view and chat with reception inside "My Bookings".');
        if (typeof loadTravelerMyBookings === 'function') loadTravelerMyBookings();
    } catch (err) {
        alert('Booking failed: ' + err.message);
    }
}
