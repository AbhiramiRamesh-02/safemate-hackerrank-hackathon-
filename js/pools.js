async function loadTravelGroups() {
    var container = document.getElementById('tab-travelPartner');
    if (!container) return;

    var section = container.querySelector('.dashboard-section');
    if (!section) return;

    var html = '<h3>Find Travel Partner & Cab Pooling</h3>' +
        '<p style="color:#555;margin-bottom:20px;">Join other verified women traveling to similar destinations to share cab costs and travel safely together.</p>' +
        
        '<div class="planner-form" style="margin-bottom:25px; padding:15px; border: 1px solid #fbcfe8; background:#fffbfd; border-radius:12px;">' +
        '<h4>Create Travel Group / Cab Pool</h4>' +
        '<div class="form-group"><label>Trip Title / Route</label><input type="text" id="groupTitle" placeholder="e.g. Bangalore to Coorg Cab Pool"></div>' +
        '<div class="form-group"><label>Trip Category</label><select id="groupCategory"><option>Cab Pooling</option><option>Group Vacation</option><option>College Shared Travel</option><option>Weekend Trek</option></select></div>' +
        '<div class="form-group"><label>Starting From</label><input type="text" id="groupStarting" placeholder="e.g. Bangalore Majestic"></div>' +
        '<div class="form-group"><label>Trip Date</label><input type="date" id="groupDate"></div>' +
        '<button class="submit-btn" style="margin-top:10px;" onclick="createTravelGroup()">Create Group</button>' +
        '</div>' +
        
        '<h4>Active Travel Groups</h4>' +
        '<div class="service-grid" id="travelGroupsGrid">Loading groups...</div>';
    
    section.innerHTML = html;

    try {
        var groups = await apiCall('GET', '/travel-groups');
        var grid = document.getElementById('travelGroupsGrid');
        if (groups.length === 0) {
            grid.innerHTML = '<p style="color:#666;padding:20px;text-align:center;">No active travel groups. Be the first to create one!</p>';
            return;
        }

        var gridHtml = '';
        groups.forEach(function(g) {
            var formattedDate = new Date(g.date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'});
            gridHtml += '<div class="service-card">' +
                '<h4>' + g.title + '</h4>' +
                '<p class="service-type">' + g.category + '</p>' +
                '<p>Members joined: ' + g.members_count + '</p>' +
                '<p>Starting from: ' + g.starting_from + '</p>' +
                '<p>Date: ' + formattedDate + '</p>' +
                '<button class="booking-btn" onclick="joinTravelGroup(\'' + g._id + '\')">Join Group</button>' +
                '</div>';
        });
        grid.innerHTML = gridHtml;
    } catch (err) {
        document.getElementById('travelGroupsGrid').innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Could not load travel groups.</p>';
    }
}

async function createTravelGroup() {
    var title = document.getElementById('groupTitle').value.trim();
    var category = document.getElementById('groupCategory').value;
    var starting = document.getElementById('groupStarting').value.trim();
    var date = document.getElementById('groupDate').value;

    if (!title || !starting || !date) {
        alert('Please fill in all travel group fields!');
        return;
    }

    try {
        await apiCall('POST', '/travel-groups', {
            title: title,
            category: category,
            starting_from: starting,
            date: date
        });
        alert('Travel Group created successfully!');
        loadTravelGroups();
    } catch (err) {
        alert(err.message);
    }
}

async function joinTravelGroup(groupId) {
    try {
        await apiCall('PUT', '/travel-groups/' + groupId + '/join');
        alert('Successfully joined this travel group! You are now part of the pool.');
        loadTravelGroups();
    } catch (err) {
        alert(err.message);
    }
}

async function loadTravelerMyBookings() {
    var container = document.getElementById('travelerMyBookings');
    if (!container) return;

    var bookingsList = [];

    // Mock Bookings (older dates to naturally sort below recent bookings)
    bookingsList.push({
        title: 'Jaipur Heritage Tour',
        subtitle: 'Route: Hawa Mahal, City Palace, Amber Fort',
        meta: 'Date: 15 March 2026 • 1 Day',
        price: 'Price: ₹2,500 - Confirmed',
        status: 'accepted',
        recipient: 'Anjali Sharma',
        date: new Date('2026-03-15T00:00:00Z'),
        chatTip: 'Guide: Anjali Sharma (Click to Chat)',
        type: 'guide_mock',
        mockTour: 'Jaipur Heritage Tour',
        mockRoute: 'Hawa Mahal, City Palace, Amber Fort',
        mockDate: '15 March 2026',
        mockDays: '1 Day',
        mockPrice: '₹2,500',
        mockGuide: 'Anjali Sharma',
        mockCity: 'Jaipur'
    });

    bookingsList.push({
        title: 'Pondicherry Beach Tour',
        subtitle: 'Route: Paradise Beach, Promenade',
        meta: 'Date: 20 March 2026 • 2 Days',
        price: 'Price: ₹6,000 - Confirmed',
        status: 'accepted',
        recipient: 'Priya Venkatesh',
        date: new Date('2026-03-20T00:00:00Z'),
        chatTip: 'Guide: Priya Venkatesh (Click to Chat)',
        type: 'guide_mock',
        mockTour: 'Pondicherry Beach Tour',
        mockRoute: 'Paradise Beach, Promenade',
        mockDate: '20 March 2026',
        mockDays: '2 Days',
        mockPrice: '₹6,000',
        mockGuide: 'Priya Venkatesh',
        mockCity: 'Pondicherry'
    });

    try {
        var rides = await apiCall('GET', '/rides/pending');
        var acceptedRides = await apiCall('GET', '/rides/my');
        var allRides = [...rides, ...acceptedRides];

        var rideIds = new Set();
        allRides.forEach(function(r) {
            if (!rideIds.has(r._id)) {
                rideIds.add(r._id);
                var statusLabel = r.status.toUpperCase();
                var chatTip = r.status === 'accepted' ? 'Click to open Chat with Driver' : 'Chat locked until driver accepts';
                bookingsList.push({
                    id: r._id,
                    title: 'Cab Booking: ' + r.driver_name,
                    subtitle: 'Route: ' + r.pickup + ' → ' + r.drop_location,
                    meta: 'Vehicle: ' + (r.vehicle || 'Cab') + ' (' + (r.vehicle_number || '') + ')',
                    price: 'Price: ₹' + r.price + ' - ' + statusLabel,
                    status: r.status,
                    recipient: r.driver_name,
                    date: new Date(r.created_at || Date.now()),
                    chatTip: chatTip,
                    type: 'cab'
                });
            }
        });

        var bookings = await apiCall('GET', '/bookings/pending');
        var acceptedBookings = await apiCall('GET', '/bookings/my');
        var allBookings = [...bookings, ...acceptedBookings];

        var bookingIds = new Set();
        allBookings.forEach(function(b) {
            if (!bookingIds.has(b._id)) {
                bookingIds.add(b._id);
                var statusLabel = b.status.toUpperCase();
                var chatTip = b.status === 'accepted' ? 'Click to open Chat with Guide' : 'Chat locked until guide accepts';
                var formattedDate = b.booking_date ? new Date(b.booking_date).toLocaleDateString() : '';
                bookingsList.push({
                    id: b._id,
                    title: 'Guide Booking: ' + b.guide_name,
                    subtitle: 'Route: Date: ' + formattedDate + ' • ' + b.days + ' Day(s)',
                    meta: 'Tour: ' + b.tour_type,
                    price: 'Price: ₹' + b.price + ' - ' + statusLabel,
                    status: b.status,
                    recipient: b.guide_name,
                    date: new Date(b.created_at || b.booking_date || Date.now()),
                    chatTip: chatTip,
                    type: 'guide',
                    tour_type: b.tour_type,
                    booking_date: formattedDate,
                    days: b.days + ' Days',
                    priceRaw: b.price
                });
            }
        });

        var staysBookings = await apiCall('GET', '/stays/bookings/my');
        if (staysBookings && staysBookings.length > 0) {
            staysBookings.forEach(function(sb) {
                var statusLabel = sb.status.toUpperCase();
                var chatTip = sb.status === 'confirmed' ? 'Click to open Chat with Reception' : 'Chat locked until confirmed';
                bookingsList.push({
                    id: sb._id,
                    title: 'Stay Booking: ' + sb.stay_name + ' (' + sb.stay_type + ')',
                    subtitle: 'Booked Date: ' + new Date(sb.booking_date).toLocaleDateString(),
                    meta: '',
                    price: 'Price: ' + sb.price + ' - ' + statusLabel,
                    status: sb.status,
                    recipient: sb.stay_name,
                    date: new Date(sb.created_at || sb.booking_date || Date.now()),
                    chatTip: chatTip,
                    type: 'stay'
                });
            });
        }

    } catch (e) {
        console.warn("Could not load dynamic bookings in My Bookings:", e);
    }

    // Sort bookings descending by date (most recent on top)
    bookingsList.sort(function(a, b) {
        return b.date - a.date;
    });

    var html = '';
    bookingsList.forEach(function(item) {
        var statusColor = (item.status === 'accepted' || item.status === 'confirmed') ? '#10b981' : (item.status === 'pending' ? '#f59e0b' : '#71717a');
        
        html += '<div class="dashboard-card completed-card" onclick="openChatFromBooking(\'' + (item.id || item.recipient) + '\', \'' + item.recipient + '\', \'' + item.status + '\')" style="cursor:pointer; border-left: 4px solid ' + statusColor + ';">' +
            '<div style="display:flex; justify-content:space-between; align-items:center; width:100%;">';
            
        html += '<div>' +
            '<h4>' + item.title + '</h4>' +
            '<p class="route">' + item.subtitle + '</p>' +
            (item.meta ? '<p class="meta">' + item.meta + '</p>' : '') +
            '<p class="price">' + item.price + '</p>' +
            '<p style="color:#be185d; font-size:13px; margin-top:8px; font-weight:600;">' + item.chatTip + '</p>' +
            '</div>';
            
        if (item.type === 'guide_mock') {
            html += '<button onclick="event.stopPropagation(); viewBookingDetails(\'' + item.mockTour + '\', \'' + item.mockRoute + '\', \'' + item.mockDate + '\', \'' + item.mockDays + '\', \'' + item.mockPrice + '\', \'' + item.mockGuide + '\', \'' + item.mockCity + '\')" class="booking-btn" style="margin-top:0; width:auto; padding:6px 12px; font-size:11px;">Review</button>';
        } else if (item.type === 'guide') {
            html += '<button onclick="event.stopPropagation(); viewBookingDetails(\'' + item.tour_type + '\', \'Local Area\', \'' + item.booking_date + '\', \'' + item.days + '\', \'' + item.priceRaw + '\', \'' + item.recipient + '\', \'\')" class="booking-btn" style="margin-top:0; width:auto; padding:6px 12px; font-size:11px;">Review</button>';
        }
        
        html += '</div></div>';
    });

    container.innerHTML = html;
}
