// Global variables for driver details modal
var selectedDriverName = "";
var selectedDriverVehicleType = "";
var selectedDriverCity = "";
var selectedDriverRating = "";
var selectedDriverRides = "";
var selectedDriverVehicleNumber = "";
var selectedDriverVehicle = "";
var selectedDriverPhone = "";
var allDriversArray = [];

// View Driver Details - shows modal with full driver info
function viewDriverDetails(name, vehicleType, city, rating, rides, vehicleNumber, vehicle, phone) {
    selectedDriverName = name;
    selectedDriverVehicleType = vehicleType;
    selectedDriverCity = city;
    selectedDriverRating = rating;
    selectedDriverRides = rides;
    selectedDriverVehicleNumber = vehicleNumber;
    selectedDriverVehicle = vehicle;
    selectedDriverPhone = phone;
    
    document.getElementById('driverDetailName').textContent = name;
    document.getElementById('driverDetailVehicleType').textContent = vehicleType;
    document.getElementById('driverDetailVehicle').textContent = vehicle;
    document.getElementById('driverDetailVehicleNumber').textContent = vehicleNumber;
    document.getElementById('driverDetailCity').textContent = city;
    document.getElementById('driverDetailRating').textContent = "⭐ " + rating;
    document.getElementById('driverDetailRides').textContent = rides + " rides";
    document.getElementById('driverDetailPhone').textContent = phone;
    
    var modal = document.getElementById('driverDetailsModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close Driver Details Modal
function closeDriverDetails() {
    var modal = document.getElementById('driverDetailsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Request Ride from Details Modal
async function requestRideFromDetails() {
    var user = getCurrentUser();
    if (!user) { alert('Please login first!'); closeDriverDetails(); return; }

    try {
        await apiCall('POST', '/rides', {
            driver_name: selectedDriverName,
            vehicle_type: selectedDriverVehicleType,
            vehicle: selectedDriverVehicle,
            vehicle_number: selectedDriverVehicleNumber,
            city: selectedDriverCity,
            pickup: 'My Location',
            drop_location: 'Destination',
            price: Math.floor(Math.random() * 200) + 100
        });
        alert('Ride request sent to ' + selectedDriverName + '!\n\nThe driver will receive your request and can accept or decline.');
        closeDriverDetails();
    } catch (err) {
        alert(err.message);
    }
}

// Load available drivers for booking
async function loadAvailableDrivers() {
    var container = document.getElementById('availableDrivers');
    if (!container) return;
    container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Loading drivers...</p>';

    try {
        allDriversArray = await apiCall('GET', '/drivers');
        filterDrivers();
    } catch (err) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Could not load drivers. Is the server running?</p>';
    }
}

function filterDrivers() {
    var container = document.getElementById('availableDrivers');
    if (!container) return;

    var city = document.getElementById('driverCityFilter').value;
    var type = document.getElementById('driverVehicleFilter').value;

    var filtered = allDriversArray.filter(function(d) {
        var cityMatch = (city === 'All' || (d.city && d.city.toLowerCase() === city.toLowerCase()));
        var typeMatch = (type === 'All' || (d.vehicle_type && d.vehicle_type.toLowerCase() === type.toLowerCase()));
        return cityMatch && typeMatch;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">No drivers match the selected filters.</p>';
        return;
    }

    var html = '';
    filtered.forEach(function(driver) {
        var initials = driver.name.split(' ').map(function(n){return n[0]}).join('').substring(0,2).toUpperCase();
        html += '<div class="service-card">' +
            '<div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">' +
            '  <div style="width:40px; height:40px; border-radius:50%; background:#fce7f3; color:#be185d; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; border:1px solid #fbcfe8; flex-shrink:0;">' + initials + '</div>' +
            '  <div>' +
            '    <h4 style="margin:0; font-size:15px;">' + driver.name + '</h4>' +
            '    <p style="margin:0; font-size:12px; color:#71717a;">Rating: ' + (driver.rating || '4.5') + '</p>' +
            '  </div>' +
            '</div>' +
            '<p class="service-type">' + (driver.vehicle_type || 'Car') + ' • ' + (driver.city || '') + '</p>' +
            '<button class="booking-btn" onclick="viewDriverDetails(\'' + driver.name + '\', \'' + (driver.vehicle_type || 'Car') + '\', \'' + (driver.city || '') + '\', \'' + (driver.rating || '4.5') + '\', \'0\', \'' + (driver.vehicle_number || '') + '\', \'' + (driver.vehicle_brand || '') + '\', \'' + (driver.phone || '') + '\')">' +
            'View Details</button>' +
            '</div>';
    });
    container.innerHTML = html;
}

// Load ride requests for driver dashboard
async function loadDriverRideRequests() {
    var container = document.getElementById('rideRequests');
    if (!container) return;

    try {
        var requests = await apiCall('GET', '/rides/pending');

        if (requests.length === 0) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">No ride requests yet. Check back later!</p>';
            return;
        }

        var html = '';
        requests.forEach(function(r) {
            html += '<div class="dashboard-card request-card" id="ride-' + r._id + '">' +
                '<h4>' + r.traveler_name + ' - ' + (r.vehicle_type || '') + '</h4>' +
                '<p class="route">📍 ' + r.pickup + ' → ' + r.drop_location + '</p>' +
                '<p class="meta">📱 ' + r.traveler_phone + '</p>' +
                '<p class="price">💰 ₹' + r.price + '</p>' +
                '<div class="action-buttons">' +
                '<button class="accept-btn" onclick="acceptRideRequest(\'' + r._id + '\')">Accept</button>' +
                '<button class="decline-btn" onclick="declineRideRequest(\'' + r._id + '\')">Decline</button>' +
                '</div></div>';
        });
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Could not load ride requests.</p>';
    }
}

// Accept ride request
async function acceptRideRequest(id) {
    try {
        var data = await apiCall('PUT', '/rides/' + id + '/accept');
        alert('Ride accepted! Contact the traveler: ' + (data.ride ? data.ride.traveler_phone : ''));
        var el = document.getElementById('ride-' + id);
        if (el) el.remove();
        loadDriverStats();
    } catch (err) {
        alert(err.message);
    }
}

// Complete a ride
async function completeRide(id) {
    try {
        await apiCall('PUT', '/rides/' + id + '/complete');
        alert('Ride marked as completed!');
        loadDriverStats();
        location.reload();
    } catch (err) {
        alert(err.message);
    }
}

// Decline ride request
async function declineRideRequest(id) {
    try {
        await apiCall('PUT', '/rides/' + id + '/decline');
        var el = document.getElementById('ride-' + id);
        if (el) el.remove();
        alert('Ride declined.');
    } catch (err) {
        alert(err.message);
    }
}

function showDriverDashboard() {
    document.getElementById('driverDashboard').classList.remove('hidden');
    loadDriverRideRequests();
    loadDriverStats();
}

async function loadDriverStats() {
    try {
        var stats = await apiCall('GET', '/driver/stats');
        document.getElementById('driverRating').textContent = 'Rating: ' + (stats.rating || '4.8');
        document.getElementById('driverTotalRides').textContent = stats.totalRides + ' rides';
        document.getElementById('driverTodayEarnings').textContent = '₹' + stats.todayEarnings;
        document.getElementById('driverTodayRides').textContent = stats.todayRides + ' rides today';
        document.getElementById('driverTotalEarnings').textContent = '₹' + stats.totalEarnings;
        document.getElementById('driverAllTimeRides').textContent = stats.completedRides + ' completed';
    } catch (err) {
        // Silently ignore stats retrieval failures
    }
}

async function saveDriverProfile() {
    var vehicleType = document.getElementById('driverVehicleType').value;
    var vehicleBrand = document.getElementById('driverVehicleBrand').value.trim();
    var vehicleNumber = document.getElementById('driverVehicleNumber').value.trim();
    var city = document.getElementById('driverCity').value;
    var price = document.getElementById('driverPrice').value;

    if (!vehicleBrand || !vehicleNumber || !price) {
        alert('Please fill in all vehicle details!');
        return;
    }

    try {
        await apiCall('PUT', '/vehicle', {
            vehicle_type: vehicleType,
            vehicle_brand: vehicleBrand,
            vehicle_number: vehicleNumber,
            city: city,
            price_per_ride: price
        });
        alert('Vehicle details saved successfully!');
        document.getElementById('driverProfileSaved').innerHTML =
            '<div style="background:#dcfce7;padding:15px;border-radius:10px;margin-top:15px;">' +
            '<h4 style="color:#166534;margin-bottom:10px;">Saved Vehicle Details</h4>' +
            '<p style="color:#333;margin:5px 0;"><strong>Type:</strong> ' + vehicleType + '</p>' +
            '<p style="color:#333;margin:5px 0;"><strong>Vehicle:</strong> ' + vehicleBrand + '</p>' +
            '<p style="color:#333;margin:5px 0;"><strong>Number:</strong> ' + vehicleNumber + '</p>' +
            '<p style="color:#333;margin:5px 0;"><strong>City:</strong> ' + city + '</p>' +
            '<p style="color:#333;margin:5px 0;"><strong>Price:</strong> ₹' + price + '</p>' +
            '</div>';
    } catch (err) {
        alert(err.message);
    }
}
