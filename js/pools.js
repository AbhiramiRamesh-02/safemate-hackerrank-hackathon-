// Travel partner group coordination, cab pooling, and traveler unified bookings history

// Renders the travel partner group hub and pooling creator
async function loadTravelGroups() {
    const container = document.getElementById('tab-travelPartner');
    if (!container) return;

    const section = container.querySelector('.dashboard-section');
    if (!section) return;

    section.innerHTML = `
        <h3>Find Travel Partner & Cab Pooling</h3>
        <p style="color:#555;margin-bottom:20px;">Coordinate with fellow verified female travelers to share cab fares and travel safely in groups.</p>
        
        <div class="planner-form" style="margin-bottom:25px; padding:15px; border: 1px solid #fbcfe8; background:#fffbfd; border-radius:12px;">
            <h4>Create Travel Group / Cab Pool</h4>
            <div class="form-group"><label>Trip Title / Route</label><input type="text" id="groupTitle" placeholder="e.g. Bangalore to Coorg Cab Pool"></div>
            <div class="form-group"><label>Trip Category</label><select id="groupCategory"><option>Cab Pooling</option><option>Group Vacation</option><option>College Shared Travel</option><option>Weekend Trek</option></select></div>
            <div class="form-group"><label>Starting From</label><input type="text" id="groupStarting" placeholder="e.g. Bangalore Majestic"></div>
            <div class="form-group"><label>Trip Date</label><input type="date" id="groupDate"></div>
            <button class="submit-btn" style="margin-top:10px;" onclick="createTravelGroup()">Create Group</button>
        </div>
        
        <h4>Active Travel Groups</h4>
        <div class="service-grid" id="travelGroupsGrid">Loading groups...</div>
    `;

    try {
        const groups = await apiCall('GET', '/travel-groups');
        const grid = document.getElementById('travelGroupsGrid');
        
        if (!groups.length) {
            grid.innerHTML = '<p style="color:#666;padding:20px;text-align:center;">No active travel groups yet. Create one above!</p>';
            return;
        }

        grid.innerHTML = groups.map(g => {
            const formattedDate = new Date(g.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            return `
                <div class="service-card">
                    <h4>${g.title}</h4>
                    <p class="service-type">${g.category}</p>
                    <p>Members joined: ${g.members_count}</p>
                    <p>Starting from: ${g.starting_from}</p>
                    <p>Date: ${formattedDate}</p>
                    <button class="booking-btn" onclick="joinTravelGroup('${g._id}')">Join Group</button>
                </div>
            `;
        }).join('');
    } catch {
        const grid = document.getElementById('travelGroupsGrid');
        if (grid) grid.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Could not load travel groups.</p>';
    }
}

// Creates a new travel / cab pooling group
async function createTravelGroup() {
    const title = document.getElementById('groupTitle')?.value.trim();
    const category = document.getElementById('groupCategory')?.value;
    const starting = document.getElementById('groupStarting')?.value.trim();
    const date = document.getElementById('groupDate')?.value;

    if (!title || !starting || !date) {
        alert('Please complete all travel group fields.');
        return;
    }

    try {
        await apiCall('POST', '/travel-groups', {
            title,
            category,
            starting_from: starting,
            date
        });
        alert('Travel Group created successfully!');
        loadTravelGroups();
    } catch (err) {
        alert(err.message || 'Could not create travel group.');
    }
}

// Joins an existing group
async function joinTravelGroup(groupId) {
    try {
        await apiCall('PUT', `/travel-groups/${groupId}/join`);
        alert('You have joined the travel pool! You can now travel safely together.');
        loadTravelGroups();
    } catch (err) {
        alert(err.message || 'Could not join travel group.');
    }
}

// Loads unified booking history (cabs, guides, stays) for traveler
async function loadTravelerMyBookings() {
    const container = document.getElementById('travelerMyBookings');
    if (!container) return;

    const bookingsList = [];

    // Preloaded verified sample bookings
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
        // Collect rides
        const [pendingRides, acceptedRides] = await Promise.all([
            apiCall('GET', '/rides/pending').catch(() => []),
            apiCall('GET', '/rides/my').catch(() => [])
        ]);

        const rideIds = new Set();
        [...pendingRides, ...acceptedRides].forEach(r => {
            if (!rideIds.has(r._id)) {
                rideIds.add(r._id);
                const chatTip = r.status === 'accepted' ? 'Click to open Chat with Driver' : 'Chat locked until driver accepts';
                bookingsList.push({
                    id: r._id,
                    title: `Cab Booking: ${r.driver_name}`,
                    subtitle: `Route: ${r.pickup} → ${r.drop_location}`,
                    meta: `Vehicle: ${r.vehicle || 'Cab'} (${r.vehicle_number || ''})`,
                    price: `Price: ₹${r.price} - ${r.status.toUpperCase()}`,
                    status: r.status,
                    recipient: r.driver_name,
                    date: new Date(r.created_at || Date.now()),
                    chatTip,
                    type: 'cab'
                });
            }
        });

        // Collect guide tours
        const [pendingBookings, acceptedBookings] = await Promise.all([
            apiCall('GET', '/bookings/pending').catch(() => []),
            apiCall('GET', '/bookings/my').catch(() => [])
        ]);

        const bookingIds = new Set();
        [...pendingBookings, ...acceptedBookings].forEach(b => {
            if (!bookingIds.has(b._id)) {
                bookingIds.add(b._id);
                const chatTip = b.status === 'accepted' ? 'Click to open Chat with Guide' : 'Chat locked until guide accepts';
                const formattedDate = b.booking_date ? new Date(b.booking_date).toLocaleDateString() : '';
                bookingsList.push({
                    id: b._id,
                    title: `Guide Booking: ${b.guide_name}`,
                    subtitle: `Date: ${formattedDate} • ${b.days} Day(s)`,
                    meta: `Tour: ${b.tour_type}`,
                    price: `Price: ${b.price} - ${b.status.toUpperCase()}`,
                    status: b.status,
                    recipient: b.guide_name,
                    date: new Date(b.created_at || b.booking_date || Date.now()),
                    chatTip,
                    type: 'guide',
                    tour_type: b.tour_type,
                    booking_date: formattedDate,
                    days: `${b.days} Days`,
                    priceRaw: b.price
                });
            }
        });

        // Collect stay bookings
        const stayBookings = await apiCall('GET', '/stays/bookings/my').catch(() => []);
        stayBookings.forEach(sb => {
            const chatTip = sb.status === 'confirmed' ? 'Click to open Chat with Reception' : 'Chat locked until confirmed';
            bookingsList.push({
                id: sb._id,
                title: `Stay Booking: ${sb.stay_name} (${sb.stay_type})`,
                subtitle: `Booked Date: ${new Date(sb.booking_date).toLocaleDateString()}`,
                meta: '',
                price: `Price: ${sb.price} - ${sb.status.toUpperCase()}`,
                status: sb.status,
                recipient: sb.stay_name,
                date: new Date(sb.created_at || sb.booking_date || Date.now()),
                chatTip,
                type: 'stay'
            });
        });

    } catch (e) {
        console.warn('Booking history sync notice:', e);
    }

    // Sort newest bookings first
    bookingsList.sort((a, b) => b.date - a.date);

    container.innerHTML = bookingsList.map(item => {
        const isReady = ['accepted', 'confirmed'].includes(item.status);
        const statusColor = isReady ? '#10b981' : (item.status === 'pending' ? '#f59e0b' : '#71717a');

        let reviewBtn = '';
        if (item.type === 'guide_mock') {
            reviewBtn = `<button onclick="event.stopPropagation(); viewBookingDetails('${item.mockTour}', '${item.mockRoute}', '${item.mockDate}', '${item.mockDays}', '${item.mockPrice}', '${item.mockGuide}', '${item.mockCity}')" class="booking-btn" style="margin-top:0; width:auto; padding:6px 12px; font-size:11px;">Review</button>`;
        } else if (item.type === 'guide') {
            reviewBtn = `<button onclick="event.stopPropagation(); viewBookingDetails('${item.tour_type}', 'Local Area', '${item.booking_date}', '${item.days}', '${item.priceRaw}', '${item.recipient}', '')" class="booking-btn" style="margin-top:0; width:auto; padding:6px 12px; font-size:11px;">Review</button>`;
        }

        return `
            <div class="dashboard-card completed-card" onclick="openChatFromBooking('${item.id || item.recipient}', '${item.recipient}', '${item.status}')" style="cursor:pointer; border-left: 4px solid ${statusColor};">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <div>
                        <h4>${item.title}</h4>
                        <p class="route">${item.subtitle}</p>
                        ${item.meta ? `<p class="meta">${item.meta}</p>` : ''}
                        <p class="price">${item.price}</p>
                        <p style="color:#be185d; font-size:13px; margin-top:8px; font-weight:600;">${item.chatTip}</p>
                    </div>
                    ${reviewBtn}
                </div>
            </div>
        `;
    }).join('');
}
