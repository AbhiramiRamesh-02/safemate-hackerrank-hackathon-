async function loadTravelGroups() {
    var container = document.getElementById('tab-travelPartner');
    if (!container) return;

    var section = container.querySelector('.dashboard-section');
    if (!section) return;

    var html = '<h3>Find Travel Partner & Cab Pooling</h3>' +
        '<p style="color:#555;margin-bottom:20px;">Join other verified women traveling to similar destinations to share cab costs and travel safely together.</p>' +
        
        '<div class="planner-form" style="margin-bottom:25px; padding:15px; border: 1px solid #fbcfe8; background:#fffbfd; border-radius:12px;">' +
        '<h4>➕ Create Travel Group / Cab Pool</h4>' +
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
                '<p>👤 ' + g.members_count + ' women joined</p>' +
                '<p>📍 Starting from: ' + g.starting_from + '</p>' +
                '<p>🕐 Date: ' + formattedDate + '</p>' +
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

    var html = `
        <div class="dashboard-card completed-card" onclick="openChatFromBooking('Anjali Sharma', 'accepted')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h4>Jaipur Heritage Tour</h4>
                <p class="route">📍 Hawa Mahal, City Palace, Amber Fort</p>
                <p class="meta">🕐 15 March 2026 • 1 Day</p>
                <p class="price">💰 ₹2,500 - Confirmed</p>
                <p style="color:#10b981;font-size:12px;margin-top:4px;">✓ Guide: Anjali Sharma (Click to Chat)</p>
            </div>
            <button onclick="event.stopPropagation(); viewBookingDetails('Jaipur Heritage Tour', 'Hawa Mahal, City Palace, Amber Fort', '15 March 2026', '1 Day', '₹2,500', 'Anjali Sharma', 'Jaipur')" class="booking-btn" style="margin-top:0; width:auto; padding:6px 12px; font-size:11px;">Review</button>
        </div>
        <div class="dashboard-card completed-card" onclick="openChatFromBooking('Priya Venkatesh', 'accepted')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h4>Pondicherry Beach Tour</h4>
                <p class="route">📍 Paradise Beach, Promenade</p>
                <p class="meta">🕐 20 March 2026 • 2 Days</p>
                <p class="price">💰 ₹6,000 - Confirmed</p>
                <p style="color:#10b981;font-size:12px;margin-top:4px;">✓ Guide: Priya Venkatesh (Click to Chat)</p>
            </div>
            <button onclick="event.stopPropagation(); viewBookingDetails('Pondicherry Beach Tour', 'Paradise Beach, Promenade', '20 March 2026', '2 Days', '₹6,000', 'Priya Venkatesh', 'Pondicherry')" class="booking-btn" style="margin-top:0; width:auto; padding:6px 12px; font-size:11px;">Review</button>
        </div>
    `;

    try {
        var rides = await apiCall('GET', '/rides/pending');
        var acceptedRides = await apiCall('GET', '/rides/my');
        var allRides = [...rides, ...acceptedRides];

        var uniqueRides = [];
        var rideIds = new Set();
        allRides.forEach(r => {
            if (!rideIds.has(r._id)) {
                rideIds.add(r._id);
                uniqueRides.push(r);
            }
        });

        if (uniqueRides.length > 0) {
            uniqueRides.forEach(function(r) {
                var statusLabel = r.status.toUpperCase();
                var statusColor = r.status === 'accepted' ? '#10b981' : (r.status === 'pending' ? '#f59e0b' : '#71717a');
                var chatTip = r.status === 'accepted' ? '💬 Click to open Chat with Driver' : '⏳ Chat locked until driver accepts';
                
                html += `
                    <div class="dashboard-card completed-card" onclick="openChatFromBooking('${r.driver_name}', '${r.status}')" style="cursor:pointer; border-left: 4px solid ${statusColor};">
                        <div>
                            <h4>Cab Booking: ${r.driver_name}</h4>
                            <p class="route">📍 ${r.pickup} → ${r.drop_location}</p>
                            <p class="meta">🕐 Vehicle: ${r.vehicle || 'Cab'} (${r.vehicle_number || ''})</p>
                            <p class="price">💰 ₹${r.price} - <span style="color:${statusColor}; font-weight:600;">${statusLabel}</span></p>
                            <p style="color:#be185d; font-size:13px; margin-top:8px; font-weight:600;">${chatTip}</p>
                        </div>
                    </div>
                `;
            });
        }

        var bookings = await apiCall('GET', '/bookings/pending');
        var acceptedBookings = await apiCall('GET', '/bookings/my');
        var allBookings = [...bookings, ...acceptedBookings];

        var uniqueBookings = [];
        var bookingIds = new Set();
        allBookings.forEach(b => {
            if (!bookingIds.has(b._id)) {
                bookingIds.add(b._id);
                uniqueBookings.push(b);
            }
        });

        if (uniqueBookings.length > 0) {
            uniqueBookings.forEach(function(b) {
                var statusLabel = b.status.toUpperCase();
                var statusColor = b.status === 'accepted' ? '#10b981' : (b.status === 'pending' ? '#f59e0b' : '#71717a');
                var chatTip = b.status === 'accepted' ? '💬 Click to open Chat with Guide' : '⏳ Chat locked until guide accepts';
                
                html += `
                    <div class="dashboard-card completed-card" onclick="openChatFromBooking('${b.guide_name}', '${b.status}')" style="cursor:pointer; border-left: 4px solid ${statusColor};">
                        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                            <div>
                                <h4>Guide Booking: ${b.guide_name}</h4>
                                <p class="route">📍 Date: ${b.booking_date} • ${b.days} Day(s)</p>
                                <p class="meta">🕐 Tour: ${b.tour_type}</p>
                                <p class="price">💰 ${b.price} - <span style="color:${statusColor}; font-weight:600;">${statusLabel}</span></p>
                                <p style="color:#be185d; font-size:13px; margin-top:8px; font-weight:600;">${chatTip}</p>
                            </div>
                            <button onclick="event.stopPropagation(); viewBookingDetails('${b.tour_type}', 'Local Area', '${b.booking_date}', '${b.days} Days', '${b.price}', '${b.guide_name}', '')" class="booking-btn" style="margin-top:0; width:auto; padding:6px 12px; font-size:11px;">Review</button>
                        </div>
                    </div>
                `;
            });
        }

        var staysBookings = await apiCall('GET', '/stays/bookings/my');
        if (staysBookings && staysBookings.length > 0) {
            staysBookings.forEach(function(sb) {
                var statusLabel = sb.status.toUpperCase();
                var statusColor = sb.status === 'confirmed' ? '#10b981' : (sb.status === 'pending' ? '#f59e0b' : '#71717a');
                var chatTip = sb.status === 'confirmed' ? '💬 Click to open Chat with Reception' : '⏳ Chat locked until confirmed';
                
                html += `
                    <div class="dashboard-card completed-card" onclick="openChatFromBooking('${sb.stay_name}', '${sb.status}')" style="cursor:pointer; border-left: 4px solid ${statusColor};">
                        <div>
                            <h4>Stay Booking: ${sb.stay_name} (${sb.stay_type})</h4>
                            <p class="route">📍 Booked Date: ${new Date(sb.booking_date).toLocaleDateString()}</p>
                            <p class="price">💰 Price: ${sb.price} - <span style="color:${statusColor}; font-weight:600;">${statusLabel}</span></p>
                            <p style="color:#be185d; font-size:13px; margin-top:8px; font-weight:600;">${chatTip}</p>
                        </div>
                    </div>
                `;
            });
        }

    } catch (e) {
        console.warn("Could not load dynamic bookings in My Bookings:", e);
    }

    container.innerHTML = html;
}
