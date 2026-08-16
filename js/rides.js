
let selectedDriver = {
    name: "",
    vehicleType: "",
    city: "",
    rating: "",
    rides: "",
    vehicleNumber: "",
    vehicle: "",
    phone: ""
};

let allDriversArray = [];

function viewDriverDetails(name, vehicleType, city, rating, rides, vehicleNumber, vehicle, phone) {
    selectedDriver = { name, vehicleType, city, rating, rides, vehicleNumber, vehicle, phone };
    
    document.getElementById('driverDetailName').textContent = name;
    document.getElementById('driverDetailVehicleType').textContent = vehicleType;
    document.getElementById('driverDetailVehicle').textContent = vehicle;
    document.getElementById('driverDetailVehicleNumber').textContent = vehicleNumber;
    document.getElementById('driverDetailCity').textContent = city;
    document.getElementById('driverDetailRating').textContent = `⭐ ${rating}`;
    document.getElementById('driverDetailRides').textContent = `${rides} rides`;
    document.getElementById('driverDetailPhone').textContent = phone;
    
    const modal = document.getElementById('driverDetailsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeDriverDetails() {
    const modal = document.getElementById('driverDetailsModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function requestRideFromDetails() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please login to request a cab.');
        closeDriverDetails();
        return;
    }

    try {
        await apiCall('POST', '/rides', {
            driver_name: selectedDriver.name,
            vehicle_type: selectedDriver.vehicleType,
            vehicle: selectedDriver.vehicle,
            vehicle_number: selectedDriver.vehicleNumber,
            city: selectedDriver.city,
            pickup: 'My Current Location',
            drop_location: 'Selected Destination',
            price: Math.floor(Math.random() * 150) + 120
        });

        alert(`Ride request sent to ${selectedDriver.name}!\nYou will be notified as soon as they accept.`);
        closeDriverDetails();
    } catch (err) {
        alert(err.message || 'Could not send ride request.');
    }
}

async function loadAvailableDrivers() {
    const container = document.getElementById('availableDrivers');
    if (!container) return;
    
    container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Finding nearby verified drivers...</p>';

    try {
        allDriversArray = await apiCall('GET', '/drivers');
        filterDrivers();
    } catch {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Could not load drivers. Please try again shortly.</p>';
    }
}

function filterDrivers() {
    const container = document.getElementById('availableDrivers');
    if (!container) return;

    const city = document.getElementById('driverCityFilter')?.value || 'All';
    const type = document.getElementById('driverVehicleFilter')?.value || 'All';

    const filtered = allDriversArray.filter(d => {
        const matchesCity = city === 'All' || (d.city && d.city.toLowerCase() === city.toLowerCase());
        const matchesType = type === 'All' || (d.vehicle_type && d.vehicle_type.toLowerCase() === type.toLowerCase());
        return matchesCity && matchesType;
    });

    if (!filtered.length) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">No drivers available with these filters.</p>';
        return;
    }

    container.innerHTML = filtered.map(driver => {
        const initials = driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        return `
            <div class="service-card">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                    <div style="width:40px; height:40px; border-radius:50%; background:#fce7f3; color:#be185d; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; border:1px solid #fbcfe8; flex-shrink:0;">
                        ${initials}
                    </div>
                    <div>
                        <h4 style="margin:0; font-size:15px;">${driver.name}</h4>
                        <p style="margin:0; font-size:12px; color:#71717a;">Rating: ${driver.rating || '4.8'}</p>
                    </div>
                </div>
                <p class="service-type">${driver.vehicle_type || 'Cab'} • ${driver.city || ''}</p>
                <button class="booking-btn" onclick="viewDriverDetails('${driver.name}', '${driver.vehicle_type || 'Cab'}', '${driver.city || ''}', '${driver.rating || '4.8'}', '0', '${driver.vehicle_number || ''}', '${driver.vehicle_brand || ''}', '${driver.phone || ''}')">
                    View Details
                </button>
            </div>
        `;
    }).join('');
}

async function loadDriverRideRequests() {
    const container = document.getElementById('rideRequests');
    if (!container) return;

    try {
        const requests = await apiCall('GET', '/rides/pending');
        if (!requests.length) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">No pending ride requests right now.</p>';
            return;
        }

        container.innerHTML = requests.map(r => `
            <div class="dashboard-card request-card" id="ride-${r._id}">
                <h4>${r.traveler_name} - ${r.vehicle_type || 'Cab'}</h4>
                <p class="route">📍 ${r.pickup} → ${r.drop_location}</p>
                <p class="meta">📱 ${r.traveler_phone}</p>
                <p class="price">💰 ₹${r.price}</p>
                <div class="action-buttons">
                    <button class="accept-btn" onclick="acceptRideRequest('${r._id}')">Accept</button>
                    <button class="decline-btn" onclick="declineRideRequest('${r._id}')">Decline</button>
                </div>
            </div>
        `).join('');
    } catch {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Could not load ride requests.</p>';
    }
}

async function acceptRideRequest(id) {
    try {
        const data = await apiCall('PUT', `/rides/${id}/accept`);
        const phone = data.ride ? data.ride.traveler_phone : '';
        alert(`Ride accepted! You can now contact the rider at: ${phone}`);
        
        document.getElementById(`ride-${id}`)?.remove();
        loadDriverStats();
        loadDriverAcceptedRides();
    } catch (err) {
        alert(err.message || 'Could not accept ride.');
    }
}

async function declineRideRequest(id) {
    try {
        await apiCall('PUT', `/rides/${id}/decline`);
        document.getElementById(`ride-${id}`)?.remove();
        alert('Ride request declined.');
    } catch (err) {
        alert(err.message || 'Could not decline ride.');
    }
}

async function loadDriverStats() {
    try {
        const stats = await apiCall('GET', '/driver/stats');
        
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setVal('driverRating', `Rating: ${stats.rating || '4.8'}`);
        setVal('driverTotalRides', `${stats.totalRides || 0} rides`);
        setVal('driverTodayEarnings', `₹${stats.todayEarnings || 0}`);
        setVal('driverTodayRides', `${stats.todayRides || 0} rides today`);
        setVal('driverTotalEarnings', `₹${stats.totalEarnings || 0}`);
        setVal('driverAllTimeRides', `${stats.completedRides || 0} completed`);
    } catch {}
}

async function saveDriverProfile() {
    const vehicleType = document.getElementById('driverVehicleType')?.value;
    const vehicleBrand = document.getElementById('driverVehicleBrand')?.value.trim();
    const vehicleNumber = document.getElementById('driverVehicleNumber')?.value.trim();
    const city = document.getElementById('driverCity')?.value;
    const price = document.getElementById('driverPrice')?.value;

    if (!vehicleBrand || !vehicleNumber || !price) {
        alert('Please complete all vehicle fields.');
        return;
    }

    try {
        await apiCall('PUT', '/vehicle', {
            vehicle_type: vehicleType,
            vehicle_brand: vehicleBrand,
            vehicle_number: vehicleNumber,
            city,
            price_per_ride: price
        });

        alert('Vehicle registration updated.');
        const container = document.getElementById('driverProfileSaved');
        if (container) {
            container.innerHTML = `
                <div style="background:#dcfce7;padding:15px;border-radius:10px;margin-top:15px;">
                    <h4 style="color:#166534;margin-bottom:10px;">Saved Vehicle Profile</h4>
                    <p style="color:#333;margin:5px 0;"><strong>Type:</strong> ${vehicleType}</p>
                    <p style="color:#333;margin:5px 0;"><strong>Model:</strong> ${vehicleBrand}</p>
                    <p style="color:#333;margin:5px 0;"><strong>Plate:</strong> ${vehicleNumber}</p>
                    <p style="color:#333;margin:5px 0;"><strong>City:</strong> ${city}</p>
                    <p style="color:#333;margin:5px 0;"><strong>Base Rate:</strong> ₹${price}</p>
                </div>
            `;
        }
    } catch (err) {
        alert(err.message || 'Error saving vehicle details.');
    }
}

async function loadDriverAcceptedRides() {
    const container = document.getElementById('myRides');
    if (!container) return;
    
    container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Loading active trips...</p>';

    try {
        const rides = await apiCall('GET', '/rides/my');
        if (!rides.length) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">No active rides currently scheduled.</p>';
            return;
        }

        container.innerHTML = rides.map(r => `
            <div class="dashboard-card" style="border-left:4px solid #10b981;margin-bottom:15px;padding:15px;background:white;border:1px solid #e4e4e7;border-radius:10px;">
                <h4>Ride with ${r.traveler_name}</h4>
                <p style="margin:5px 0;font-size:13px;color:#555;">From: ${r.pickup} → ${r.drop_location}</p>
                <p style="margin:5px 0;font-size:13px;color:#555;">Phone: ${r.traveler_phone}</p>
                <p style="margin:5px 0;font-size:13px;color:#be185d;font-weight:600;">Status: ${r.status.toUpperCase()}</p>
                <div style="margin-top:10px;display:flex;gap:10px;">
                    <button class="booking-btn" style="margin-top:0;width:auto;" onclick="openChatFromBooking('${r._id}', '${r.traveler_name}', 'accepted')">
                        Chat with Traveler
                    </button>
                </div>
            </div>
        `).join('');
    } catch {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Could not load rides.</p>';
    }
}
