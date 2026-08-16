// Guide dashboard controllers, incoming tour management, and service publishing

// Fetches pending traveler bookings for this guide
async function loadGuideBookings() {
    const container = document.getElementById('bookingRequests');
    if (!container) return;

    try {
        const bookings = await apiCall('GET', '/bookings/pending');

        if (!bookings.length) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">No pending booking requests right now.</p>';
            return;
        }

        container.innerHTML = bookings.map(b => `
            <div class="dashboard-card request-card" id="booking-${b._id}">
                <h4>${b.tour_type}</h4>
                <p class="route">📍 Date: ${b.booking_date}</p>
                <p class="meta">👤 ${b.traveler_name} • 📱 ${b.traveler_phone}</p>
                <p class="meta">🕐 ${b.days} Day(s)</p>
                <p class="price">💰 ${b.price}</p>
                <div class="action-buttons">
                    <button class="accept-btn" onclick="acceptGuideBooking('${b._id}')">Accept</button>
                    <button class="decline-btn" onclick="declineGuideBooking('${b._id}')">Decline</button>
                </div>
            </div>
        `).join('');
    } catch {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Could not load booking requests.</p>';
    }
}

// Accepts incoming tour booking
async function acceptGuideBooking(id) {
    try {
        const data = await apiCall('PUT', `/bookings/${id}/accept`);
        const travelerPhone = data.booking ? data.booking.traveler_phone : '';
        alert(`Booking accepted! You can now contact the traveler: ${travelerPhone}`);
        
        document.getElementById(`booking-${id}`)?.remove();
        if (typeof loadGuideAcceptedBookings === 'function') {
            loadGuideAcceptedBookings();
        }
    } catch (err) {
        alert(err.message || 'Could not accept booking.');
    }
}

// Declines booking request
async function declineGuideBooking(id) {
    try {
        await apiCall('PUT', `/bookings/${id}/decline`);
        document.getElementById(`booking-${id}`)?.remove();
        alert('Booking request declined.');
    } catch (err) {
        alert(err.message || 'Error declining booking.');
    }
}

function showGuideDashboard() {
    document.getElementById('guideDashboard')?.classList.remove('hidden');
    loadGuideBookings();
}

// Adds a new custom tour package/service offering
async function saveGuideServices() {
    const serviceName = document.getElementById('guideServiceName')?.value.trim();
    const city = document.getElementById('guideServiceCity')?.value || 'Jaipur';
    const serviceType = document.getElementById('guideServiceType')?.value || 'Heritage Tour';
    const description = document.getElementById('guideServiceDesc')?.value.trim();
    const price = document.getElementById('guideServicePrice')?.value;

    if (!serviceName || !description || !price) {
        alert('Please fill in all service details.');
        return;
    }

    try {
        await apiCall('POST', '/guide-services', {
            service_name: serviceName,
            city,
            service_type: serviceType,
            description,
            price
        });

        alert('Tour service listed successfully!');
        document.getElementById('guideServiceName').value = '';
        document.getElementById('guideServiceDesc').value = '';
        document.getElementById('guideServicePrice').value = '';

        const services = await apiCall('GET', '/guide-services/my');
        const container = document.getElementById('guideServicesSaved');
        
        if (container && services.length) {
            container.innerHTML = `
                <div style="background:#dcfce7;padding:15px;border-radius:10px;margin-top:15px;">
                    <h4 style="color:#166534;margin-bottom:10px;">Your Active Services</h4>
                    ${services.map(s => `
                        <div style="background:white;padding:12px;border-radius:8px;margin-bottom:10px;">
                            <p style="color:#333;margin:5px 0;font-weight:600;">${s.service_name}</p>
                            <p style="color:#666;font-size:13px;margin:5px 0;">Location: ${s.city} • ${s.service_type}</p>
                            <p style="color:#555;font-size:13px;margin:5px 0;">${s.description}</p>
                            <p style="color:#ec4899;font-weight:600;margin:5px 0;">₹${s.price}/person</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (err) {
        alert(err.message || 'Could not save tour service.');
    }
}

// Displays confirmed / ongoing tours for this guide
async function loadGuideAcceptedBookings() {
    const container = document.getElementById('myBookings');
    if (!container) return;
    
    container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Loading accepted tours...</p>';

    try {
        const bookings = await apiCall('GET', '/bookings/my');
        if (!bookings.length) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">No active tours currently scheduled.</p>';
            return;
        }

        container.innerHTML = bookings.map(b => `
            <div class="dashboard-card" style="border-left:4px solid #10b981;margin-bottom:15px;padding:15px;background:white;border:1px solid #e4e4e7;border-radius:10px;">
                <h4>${b.tour_type}</h4>
                <p style="margin:5px 0;font-size:13px;color:#555;">Traveler: ${b.traveler_name}</p>
                <p style="margin:5px 0;font-size:13px;color:#555;">Date: ${b.booking_date} • ${b.days} day(s)</p>
                <p style="margin:5px 0;font-size:13px;color:#555;">Phone: ${b.traveler_phone}</p>
                <p style="margin:5px 0;font-size:13px;color:#be185d;font-weight:600;">Status: ${b.status.toUpperCase()}</p>
                <div style="margin-top:10px;">
                    <button class="booking-btn" style="margin-top:0;width:auto;" onclick="openChatFromBooking('${b._id}', '${b.traveler_name}', 'accepted')">
                        Chat with Traveler
                    </button>
                </div>
            </div>
        `).join('');
    } catch {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Could not load active bookings.</p>';
    }
}
