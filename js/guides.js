var allGuidesArray = [];
var currentGuidePrice = 0;
var currentGuideName = "";

// Global variables for booking details (for reviews)
var currentBookingTour = "";
var currentBookingGuide = "";
var currentBookingDestination = "";

// View Guide Details
function viewGuideDetails(name, tourType, rating, age, phone, availability, description, price) {
    currentGuideName = name;
    
    document.getElementById('guideDetailName').textContent = name;
    document.getElementById('guideDetailTour').textContent = tourType;
    document.getElementById('guideDetailRating').textContent = "⭐ " + rating;
    document.getElementById('guideDetailAge').textContent = age;
    document.getElementById('guideDetailPhone').textContent = phone;
    
    var availabilityText = document.getElementById('guideDetailAvailability');
    availabilityText.textContent = availability;
    availabilityText.style.color = availability === "Available" ? "#10b981" : "#ef4444";
    
    document.getElementById('guideDetailDesc').textContent = description;
    document.getElementById('guideDetailPrice').textContent = price;
    
    currentGuidePrice = parseInt(price.replace(/[^0-9]/g, '')) || 2000;
    document.getElementById('bookingDays').value = "1";
    updateBookingTotal();
    
    var bookingSection = document.getElementById('bookingSection');
    if (availability === "Unavailable") {
        bookingSection.style.display = "none";
    } else {
        bookingSection.style.display = "block";
    }
    
    var modal = document.getElementById('guideDetailsModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function updateBookingTotal() {
    var days = parseInt(document.getElementById('bookingDays').value) || 1;
    var total = days * currentGuidePrice;
    document.getElementById('bookingTotal').textContent = "₹" + total.toLocaleString('en-IN');
}

function closeGuideDetails() {
    var modal = document.getElementById('guideDetailsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function bookGuide() {
    var days = document.getElementById('bookingDays').value;
    var date = document.getElementById('bookingDate').value;
    
    if (!date) {
        alert("Please select a date for your booking!");
        return;
    }
    
    var total = document.getElementById('bookingTotal').textContent;
    var user = getCurrentUser();
    if (!user) { alert('Please login first!'); return; }

    try {
        await apiCall('POST', '/bookings', {
            guide_name: currentGuideName,
            tour_type: document.getElementById('guideDetailTour').textContent,
            booking_date: date,
            days: days,
            price: total
        });
        alert("Booking Confirmed!\n\nGuide: " + currentGuideName + "\nDuration: " + days + " day(s)\nDate: " + date + "\nTotal: " + total + "\n\nThe guide will contact you soon!");
        closeGuideDetails();
        if (typeof loadTravelerMyBookings === 'function') loadTravelerMyBookings();
    } catch (err) {
        alert(err.message);
    }
}

// Load available guides
async function loadAvailableGuides() {
    var container = document.getElementById('availableGuides');
    if (!container) return;
    container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Loading guides...</p>';

    try {
        allGuidesArray = await apiCall('GET', '/guides');
        filterGuides();
    } catch (err) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Could not load guides. Is the server running?</p>';
    }
}

function filterGuides() {
    var container = document.getElementById('availableGuides');
    if (!container) return;

    var city = document.getElementById('guideCityFilter').value;
    var ageGroup = document.getElementById('guideAgeFilter').value;

    var filtered = allGuidesArray.filter(function(g) {
        var cityMatch = (city === 'All' || (g.city && g.city.toLowerCase() === city.toLowerCase()));
        var ageMatch = true;
        if (ageGroup === 'Under30') {
            ageMatch = (g.age && g.age < 30);
        } else if (ageGroup === '30to40') {
            ageMatch = (g.age && g.age >= 30 && g.age <= 40);
        } else if (ageGroup === 'Over40') {
            ageMatch = (g.age && g.age > 40);
        }
        return cityMatch && ageMatch;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">No guides match the selected filters.</p>';
        return;
    }

    var html = '';
    filtered.forEach(function(guide) {
        var serviceName = guide.services && guide.services.length > 0 ? guide.services[0].service_name : 'Local Guide';
        var priceStr = guide.services && guide.services.length > 0 ? guide.services[0].price : '₹2,500';
        var descStr = guide.services && guide.services.length > 0 ? guide.services[0].description : 'Local city tour and assistance';
        var initials = guide.name.split(' ').map(function(n){return n[0]}).join('').substring(0,2).toUpperCase();

        html += '<div class="service-card">' +
            '<div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">' +
            '  <div style="width:40px; height:40px; border-radius:50%; background:#fef3c7; color:#b45309; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; border:1px solid #fde68a; flex-shrink:0;">' + initials + '</div>' +
            '  <div>' +
            '    <h4 style="margin:0; font-size:15px;">' + guide.name + '</h4>' +
            '    <p style="margin:0; font-size:12px; color:#71717a;">⭐ ' + (guide.rating || '4.8') + '</p>' +
            '  </div>' +
            '</div>' +
            '<p class="service-type">' + serviceName + ' • ' + (guide.city || '') + ' (Age: ' + (guide.age || 'N/A') + ')</p>' +
            '<p style="color:#10b981;font-size:13px;margin-top:5px;">✓ Available</p>' +
            '<button class="booking-btn" onclick="viewGuideDetails(\'' + guide.name + '\', \'' + serviceName + '\', \'' + (guide.rating || '4.8') + '\', \'' + (guide.age || 'N/A') + '\', \'' + (guide.phone || '') + '\', \'Available\', \'' + descStr + '\', \'' + priceStr + '\')">' +
            'View Details</button>' +
            '</div>';
    });
    container.innerHTML = html;
}

// Load guide bookings for guide dashboard
async function loadGuideBookings() {
    var container = document.getElementById('bookingRequests');
    if (!container) return;

    try {
        var bookings = await apiCall('GET', '/bookings/pending');

        if (bookings.length === 0) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">No booking requests yet. Check back later!</p>';
            return;
        }

        var html = '';
        bookings.forEach(function(b) {
            html += '<div class="dashboard-card request-card" id="booking-' + b._id + '">' +
                '<h4>' + b.tour_type + '</h4>' +
                '<p class="route">📍 Date: ' + b.booking_date + '</p>' +
                '<p class="meta">👤 ' + b.traveler_name + ' • 📱 ' + b.traveler_phone + '</p>' +
                '<p class="meta">🕐 ' + b.days + ' Day(s)</p>' +
                '<p class="price">💰 ' + b.price + '</p>' +
                '<div class="action-buttons">' +
                '<button class="accept-btn" onclick="acceptGuideBooking(\'' + b._id + '\')">Accept</button>' +
                '<button class="decline-btn" onclick="declineGuideBooking(\'' + b._id + '\')">Decline</button>' +
                '</div></div>';
        });
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Could not load bookings.</p>';
    }
}

async function acceptGuideBooking(id) {
    try {
        var data = await apiCall('PUT', '/bookings/' + id + '/accept');
        alert('Booking accepted! Contact the traveler: ' + (data.booking ? data.booking.traveler_phone : ''));
        var el = document.getElementById('booking-' + id);
        if (el) el.remove();
    } catch (err) {
        alert(err.message);
    }
}

async function declineGuideBooking(id) {
    try {
        await apiCall('PUT', '/bookings/' + id + '/decline');
        var el = document.getElementById('booking-' + id);
        if (el) el.remove();
        alert('Booking declined.');
    } catch (err) {
        alert(err.message);
    }
}

function showGuideDashboard() {
    document.getElementById('guideDashboard').classList.remove('hidden');
    loadGuideBookings();
}

function viewBookingDetails(tour, locations, date, duration, price, guide, destination) {
    currentBookingTour = tour;
    currentBookingGuide = guide;
    currentBookingDestination = destination;
    
    document.getElementById('bookingDetailTitle').textContent = tour;
    document.getElementById('bookingDetailTour').textContent = tour;
    document.getElementById('bookingDetailLocations').textContent = locations;
    document.getElementById('bookingDetailDate').textContent = date;
    document.getElementById('bookingDetailDuration').textContent = duration;
    document.getElementById('bookingDetailPrice').textContent = price;
    document.getElementById('bookingDetailGuide').textContent = guide;
    
    document.getElementById('bookingReviewRating').value = "⭐⭐⭐⭐⭐ Excellent";
    document.getElementById('bookingReviewText').value = "";
    
    var modal = document.getElementById('bookingDetailsModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeBookingDetails() {
    var modal = document.getElementById('bookingDetailsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}
