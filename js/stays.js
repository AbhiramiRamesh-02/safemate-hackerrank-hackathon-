async function createTrip() {
    const destination = document.getElementById('tripDestination')?.value || 'Pondicherry';
    const interest = document.getElementById('tripInterest')?.value || 'Nature';
    const selectedService = document.getElementById('tripServiceType')?.value || 'all';
    const fromDate = document.getElementById('tripFromDate')?.value;
    const toDate = document.getElementById('tripToDate')?.value;
    
    if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
        alert("The return date must be on or after the departure date.");
        return;
    }
    
    let daysText = "";
    if (fromDate && toDate) {
        const diffDays = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1;
        daysText = ` (${diffDays} day${diffDays > 1 ? 's' : ''})`;
    }
    
    const places = (placesData[destination] && placesData[destination][interest]) || [];
    let dateRange = "";
    if (fromDate && toDate) {
        dateRange = `<p style="color:#ec4899;font-weight:600;margin-bottom:15px;">Date: ${fromDate} to ${toDate}${daysText}</p>`;
    } else if (fromDate) {
        dateRange = `<p style="color:#ec4899;font-weight:600;margin-bottom:15px;">Starting from: ${fromDate}</p>`;
    }
    
    let html = `<h3 style="color:#333;margin-bottom:15px">Recommended Safe Spots in ${destination}</h3>${dateRange}`;
    
    places.forEach(place => {
        html += `
            <div class="place-card">
                <h4>${place.name}</h4>
                <p><span class="rating">Rating: ${place.rating}</span> <span class="reviews-count">(${place.count} reviews)</span></p>
                <p class="comment">"${place.comment}"</p>
                <span class="safe-badge">Safe for women</span>
            </div>
        `;
    });

    let serviceWidgetsHtml = '<div style="margin-top:25px; padding-top:20px; border-top: 2px solid #e5e7eb;">';

    if (['all', 'cabs'].includes(selectedService)) {
        serviceWidgetsHtml += `
            <div style="background:#faf5ff; border:1px solid #e9d5ff; border-radius:12px; padding:14px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4 style="margin:0; color:#6b21a8; font-size:14px;">🚖 Verified Cabs for ${destination}</h4>
                    <p style="margin:2px 0 0 0; font-size:12px; color:#6b7280;">Pre-screened women drivers in ${destination}.</p>
                </div>
                <button class="booking-btn" style="margin:0; width:auto; padding:6px 12px; font-size:12px;" onclick="showTravelerTab('bookCab')">Book Cab</button>
            </div>
        `;
    }

    if (['all', 'guides'].includes(selectedService)) {
        serviceWidgetsHtml += `
            <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:14px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4 style="margin:0; color:#92400e; font-size:14px;">🧭 Certified Lady Guides in ${destination}</h4>
                    <p style="margin:2px 0 0 0; font-size:12px; color:#6b7280;">Expert local guides for tours.</p>
                </div>
                <button class="booking-btn" style="margin:0; width:auto; padding:6px 12px; font-size:12px; background:#d97706;" onclick="showTravelerTab('travelGuide')">Find Guide</button>
            </div>
        `;
    }

    if (['all', 'hotels'].includes(selectedService)) {
        serviceWidgetsHtml += `
            <div style="background:#fff5f7; border:1px solid #fbcfe8; border-radius:12px; padding:14px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4 style="margin:0; color:#be185d; font-size:14px;">🏨 Safe PGs & Stays in ${destination}</h4>
                    <p style="margin:2px 0 0 0; font-size:12px; color:#6b7280;">Secure accommodation with verified locks.</p>
                </div>
                <button class="booking-btn" style="margin:0; width:auto; padding:6px 12px; font-size:12px;" onclick="showTravelerTab('bookHotel')">View Stays</button>
            </div>
        `;
    }

    if (['all', 'safety'].includes(selectedService)) {
        serviceWidgetsHtml += `
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:14px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4 style="margin:0; color:#166534; font-size:14px;">🗺️ Safe Routes & Dark Spot Scanner</h4>
                    <p style="margin:2px 0 0 0; font-size:12px; color:#6b7280;">Evaluate street lighting & hazard detours.</p>
                </div>
                <button class="booking-btn" style="margin:0; width:auto; padding:6px 12px; font-size:12px; background:#16a34a;" onclick="showTravelerTab('safeRoutes')">Scan Route</button>
            </div>
        `;
    }

    serviceWidgetsHtml += '</div>';
    html += serviceWidgetsHtml;

    // Co-Travelers & Groups Section (Always included for destination)
    let groupsHtml = `
        <div style="margin-top:20px; padding-top:20px; border-top: 2px solid #e5e7eb;">
            <h3 style="color:#333; margin-bottom:10px;">👭 Co-Travelers & Groups for ${destination}</h3>
            <p style="color:#555; font-size:13px; margin-bottom:15px;">Traveling solo? Join fellow verified women travelers heading to ${destination} or create your own group below.</p>
    `;
        
    try {
        const groups = await apiCall('GET', '/travel-groups');
        const destLower = destination.toLowerCase();
        const matching = groups.filter(g => 
            (g.title && g.title.toLowerCase().includes(destLower)) || 
            (g.starting_from && g.starting_from.toLowerCase().includes(destLower)) ||
            (g.category && g.category.toLowerCase().includes(destLower))
        );
        
        if (!matching.length) {
            groupsHtml += `<p style="color:#666; font-style:italic; padding:10px 0;">No travel groups created for ${destination} yet. Start one below!</p>`;
        } else {
            groupsHtml += '<div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">';
            matching.forEach(g => {
                const formattedDate = new Date(g.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                groupsHtml += `
                    <div class="dashboard-card" style="padding:15px; border:1px solid #e4e4e7; border-radius:10px; background:#fffbfd; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="margin:0;color:#db2777;">${g.title}</h4>
                            <p style="margin:4px 0 0 0; font-size:12px; color:#71717a;">Category: ${g.category} • Starting: ${g.starting_from}</p>
                            <p style="margin:4px 0 0 0; font-size:12px; color:#71717a;">Date: ${formattedDate} • Members: ${g.members_count}</p>
                        </div>
                        <button class="booking-btn" style="margin-top:0; width:auto; padding:6px 12px; font-size:12px;" onclick="joinTripPlannerGroup('${g._id}')">Join Group</button>
                    </div>
                `;
            });
            groupsHtml += '</div>';
        }
    } catch {
        groupsHtml += '<p style="color:#ef4444; font-size:12px;">Could not retrieve active groups.</p>';
    }

    groupsHtml += `
        <div class="planner-form" style="background:#fdf2f8; border: 1px dashed #fbcfe8; padding:18px; border-radius:12px; margin-top:15px;">
            <h4 style="margin-top:0; color:#be185d; font-size:16px;">Create a Travel Group for ${destination}</h4>
            <div class="form-group" style="margin-bottom:10px;">
                <label style="font-size:12px; font-weight:600;">Trip Title / Route</label>
                <input type="text" id="plannerGroupTitle" placeholder="e.g. Weekend Retreat to ${destination}" style="font-size:14px; padding:10px;">
            </div>
            <div class="form-group" style="margin-bottom:10px;">
                <label style="font-size:12px; font-weight:600;">Trip Category</label>
                <select id="plannerGroupCategory" style="font-size:14px; padding:10px;">
                    <option>Group Vacation</option>
                    <option>Cab Pooling</option>
                    <option>Weekend Trek</option>
                </select>
            </div>
            <div class="form-group" style="margin-bottom:10px;">
                <label style="font-size:12px; font-weight:600;">Starting Location</label>
                <input type="text" id="plannerGroupStarting" placeholder="e.g. Bangalore" style="font-size:14px; padding:10px;">
            </div>
            <div class="form-group" style="margin-bottom:15px;">
                <label style="font-size:12px; font-weight:600;">Trip Date</label>
                <input type="date" id="plannerGroupDate" style="font-size:14px; padding:10px;">
            </div>
            <button class="submit-btn" style="padding:12px; font-size:14px; font-weight:700;" onclick="submitPlannerGroup('${destination}')">Create & Join Group</button>
        </div>
    </div>`;

    html += groupsHtml;

    const recommendations = document.getElementById('recommendations');
    if (recommendations) {
        recommendations.innerHTML = html;
        recommendations.classList.remove('hidden');
    }
}

async function joinTripPlannerGroup(groupId) {
    try {
        await apiCall('PUT', `/travel-groups/${groupId}/join`);
        alert('Joined group! You are now connected with co-travelers.');
        createTrip();
    } catch (err) {
        alert(err.message || 'Could not join group.');
    }
}

async function submitPlannerGroup(destination) {
    const title = document.getElementById('plannerGroupTitle')?.value.trim();
    const category = document.getElementById('plannerGroupCategory')?.value;
    const starting = document.getElementById('plannerGroupStarting')?.value.trim();
    const date = document.getElementById('plannerGroupDate')?.value;
    
    if (!title || !starting || !date) {
        alert('Please complete all group trip details.');
        return;
    }
    
    try {
        await apiCall('POST', '/travel-groups', { title, category, starting_from: starting, date });
        alert('Travel group created successfully! Co-travelers can now join.');
        createTrip();
    } catch (err) {
        alert(err.message || 'Error creating group.');
    }
}

function toggleStayRegistrationForm() {
    document.getElementById('stayRegistrationForm')?.classList.toggle('hidden');
}

async function registerStay() {
    const name = document.getElementById('stayNameInput')?.value.trim();
    const type = document.getElementById('stayTypeInput')?.value;
    const city = document.getElementById('stayCityInput')?.value.trim();
    const address = document.getElementById('stayAddressInput')?.value.trim();
    const price = document.getElementById('stayPriceInput')?.value.trim();
    const phone = document.getElementById('stayPhoneInput')?.value.trim();
    const description = document.getElementById('stayDescInput')?.value.trim();
    const safety = document.getElementById('staySafetyInput')?.value.trim();

    if (!name || !city || !address || !price || !phone) {
        alert('Please fill out all required fields: Name, City, Address, Price, and Phone.');
        return;
    }

    try {
        await apiCall('POST', '/stays', {
            name, type, city, address, price_per_month: price, phone,
            description: description || undefined,
            safety_measures: safety || undefined
        });

        alert('Property registered! Your female-safe accommodation is now listed.');
        ['stayNameInput', 'stayCityInput', 'stayAddressInput', 'stayPriceInput', 'stayPhoneInput', 'stayDescInput', 'staySafetyInput']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        toggleStayRegistrationForm();
        loadStays();
    } catch (err) {
        alert(`Registration failed: ${err.message}`);
    }
}

async function loadStays() {
    const container = document.getElementById('verifiedStaysList');
    if (!container) return;

    try {
        const stays = await apiCall('GET', '/stays');
        if (!stays.length) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;grid-column:1/-1;">No stays listed yet. Register your PG or hotel above!</p>';
            return;
        }

        container.innerHTML = stays.map(s => {
            const measuresList = (s.safety_measures || []).map(m => `<li>✓ ${m}</li>`).join('');
            return `
                <div class="service-card">
                    <h4>${s.name} <span style="font-size:11px; background:#fdf2f8; color:#be185d; padding:2px 6px; border-radius:4px; border:1px solid #fbcfe8; float:right;">${s.type}</span></h4>
                    <p class="service-type">Location: ${s.city} • ${s.address}</p>
                    <p style="font-weight:600; color:#18181b; margin-top:8px;">Price: ${s.price_per_month}</p>
                    <p style="font-size:12px; color:#71717a; margin-top:6px; font-style:italic;">${s.description || ''}</p>
                    <div style="margin-top:10px; padding-top:10px; border-top:1px dashed #f3f4f6;">
                        <span style="font-size:11px; font-weight:700; color:#db2777;">Verified Safety Features:</span>
                        <ul style="font-size:11px; color:#10b981; list-style:none; padding:0; margin:4px 0 0 0; display:flex; flex-direction:column; gap:2px;">${measuresList}</ul>
                    </div>
                    <button class="booking-btn" onclick="bookStay('${s.name}', '${s.type}', '${s.price_per_month}')">Book Stay</button>
                </div>
            `;
        }).join('');
    } catch {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;grid-column:1/-1;">Could not load stays directory.</p>';
    }
}

async function bookStay(name, type, price) {
    const user = getCurrentUser();
    if (!user) {
        alert('Please login to reserve a stay.');
        return;
    }

    try {
        await apiCall('POST', '/stays/book', { stay_name: name, stay_type: type, price });
        alert(`Booking Requested!\n\nYour inquiry for "${name}" has been placed. Check "My Bookings" to view status and chat.`);
        if (typeof loadTravelerMyBookings === 'function') loadTravelerMyBookings();
    } catch (err) {
        alert(`Booking failed: ${err.message}`);
    }
}
