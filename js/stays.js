async function createTrip() {
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

    // Integrated Co-Travelers & Groups for Destination
    var groupsHtml = '<div style="margin-top:25px; padding-top:20px; border-top: 2px solid #e5e7eb;">' +
        '<h3 style="color:#333; margin-bottom:10px;">Co-Travelers & Groups for ' + destination + '</h3>' +
        '<p style="color:#555; font-size:13px; margin-bottom:15px;">Do not want to travel alone? Join a verified group or create one below to travel together.</p>';
        
    try {
        var groups = await apiCall('GET', '/travel-groups');
        var matching = groups.filter(function(g) {
            var destLower = destination.toLowerCase();
            return (g.title && g.title.toLowerCase().includes(destLower)) || 
                   (g.starting_from && g.starting_from.toLowerCase().includes(destLower)) ||
                   (g.category && g.category.toLowerCase().includes(destLower));
        });
        
        if (matching.length === 0) {
            groupsHtml += '<p style="color:#666; font-style:italic; padding:10px 0;">No active travel groups found for ' + destination + ' yet.</p>';
        } else {
            groupsHtml += '<div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">';
            matching.forEach(function(g) {
                var formattedDate = new Date(g.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'});
                groupsHtml += '<div class="dashboard-card" style="padding:15px; border:1px solid #e4e4e7; border-radius:10px; background:#fffbfd; display:flex; justify-content:space-between; align-items:center;">' +
                    '<div>' +
                    '  <h4 style="margin:0;color:#db2777;">' + g.title + '</h4>' +
                    '  <p style="margin:4px 0 0 0; font-size:12px; color:#71717a;">Category: ' + g.category + ' • Starting: ' + g.starting_from + '</p>' +
                    '  <p style="margin:4px 0 0 0; font-size:12px; color:#71717a;">Date: ' + formattedDate + ' • Members: ' + g.members_count + '</p>' +
                    '</div>' +
                    '<button class="booking-btn" style="margin-top:0; width:auto; padding:6px 12px; font-size:12px;" onclick="joinTripPlannerGroup(\'' + g._id + '\')">Join</button>' +
                    '</div>';
            });
            groupsHtml += '</div>';
        }
    } catch (err) {
        groupsHtml += '<p style="color:#ef4444; font-size:12px;">Could not load active groups.</p>';
    }

    groupsHtml += '<div class="planner-form" style="background:#fdf2f8; border: 1px dashed #fbcfe8; padding:15px; border-radius:10px; margin-top:15px;">' +
        '<h4 style="margin-top:0; color:#be185d;">Create a Travel Group for ' + destination + '</h4>' +
        '<div class="form-group" style="margin-bottom:10px;">' +
        '  <label style="font-size:12px;">Trip Title / Route</label>' +
        '  <input type="text" id="plannerGroupTitle" placeholder="e.g. Girls Trip to ' + destination + '" style="font-size:14px; padding:8px;">' +
        '</div>' +
        '<div class="form-group" style="margin-bottom:10px;">' +
        '  <label style="font-size:12px;">Trip Category</label>' +
        '  <select id="plannerGroupCategory" style="font-size:14px; padding:8px;">' +
        '    <option>Group Vacation</option>' +
        '    <option>Cab Pooling</option>' +
        '    <option>Weekend Trek</option>' +
        '  </select>' +
        '</div>' +
        '<div class="form-group" style="margin-bottom:10px;">' +
        '  <label style="font-size:12px;">Starting Location</label>' +
        '  <input type="text" id="plannerGroupStarting" placeholder="e.g. Bangalore" style="font-size:14px; padding:8px;">' +
        '</div>' +
        '<div class="form-group" style="margin-bottom:15px;">' +
        '  <label style="font-size:12px;">Trip Date</label>' +
        '  <input type="date" id="plannerGroupDate" style="font-size:14px; padding:8px;">' +
        '</div>' +
        '<button class="submit-btn" style="padding:10px; font-size:13px;" onclick="submitPlannerGroup(\'' + destination + '\')">Create & Join Group</button>' +
        '</div>' +
        '</div>';

    html += groupsHtml;

    document.getElementById('recommendations').innerHTML = html;
    document.getElementById('recommendations').classList.remove('hidden');
}

async function joinTripPlannerGroup(groupId) {
    try {
        await apiCall('PUT', '/travel-groups/' + groupId + '/join');
        alert('Successfully joined the travel group!');
        createTrip();
    } catch (err) {
        alert(err.message);
    }
}

async function submitPlannerGroup(destination) {
    var title = document.getElementById('plannerGroupTitle').value.trim();
    var category = document.getElementById('plannerGroupCategory').value;
    var starting = document.getElementById('plannerGroupStarting').value.trim();
    var date = document.getElementById('plannerGroupDate').value;
    
    if (!title || !starting || !date) {
        alert('Please fill out all group details!');
        return;
    }
    
    try {
        await apiCall('POST', '/travel-groups', {
            title: title,
            category: category,
            starting_from: starting,
            date: date
        });
        alert('Travel group created successfully!');
        createTrip();
    } catch (err) {
        alert(err.message);
    }
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
            var measuresList = (s.safety_measures || []).map(m => '<li>' + m + '</li>').join('');
            
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
