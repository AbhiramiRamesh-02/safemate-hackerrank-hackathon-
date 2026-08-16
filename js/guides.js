
let allGuidesArray = [];
let currentGuidePrice = 0;
let currentGuideName = "";

function viewGuideDetails(name, tourType, rating, age, phone, availability, description, price) {
    currentGuideName = name;
    
    document.getElementById('guideDetailName').textContent = name;
    document.getElementById('guideDetailTour').textContent = tourType;
    document.getElementById('guideDetailRating').textContent = `Rating: ${rating}`;
    document.getElementById('guideDetailAge').textContent = age;
    document.getElementById('guideDetailPhone').textContent = phone;
    
    const availabilityText = document.getElementById('guideDetailAvailability');
    if (availabilityText) {
        availabilityText.textContent = availability;
        availabilityText.style.color = availability === 'Available' ? '#10b981' : '#ef4444';
    }
    
    document.getElementById('guideDetailDesc').textContent = description;
    document.getElementById('guideDetailPrice').textContent = price;
    
    currentGuidePrice = parseInt(price.replace(/[^0-9]/g, ''), 10) || 2000;
    
    const daysInput = document.getElementById('bookingDays');
    if (daysInput) daysInput.value = "1";
    updateBookingTotal();
    
    const bookingSection = document.getElementById('bookingSection');
    if (bookingSection) {
        bookingSection.style.display = availability === 'Unavailable' ? 'none' : 'block';
    }
    
    const modal = document.getElementById('guideDetailsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function updateBookingTotal() {
    const days = parseInt(document.getElementById('bookingDays')?.value, 10) || 1;
    const total = days * currentGuidePrice;
    
    const totalEl = document.getElementById('bookingTotal');
    if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
}

function closeGuideDetails() {
    const modal = document.getElementById('guideDetailsModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function bookGuide() {
    const days = document.getElementById('bookingDays')?.value || '1';
    const date = document.getElementById('bookingDate')?.value;
    
    if (!date) {
        alert("Please pick a starting date for your tour.");
        return;
    }
    
    const total = document.getElementById('bookingTotal')?.textContent || '₹0';
    const user = getCurrentUser();
    if (!user) {
        alert('Please login to book a travel guide.');
        return;
    }

    try {
        await apiCall('POST', '/bookings', {
            guide_name: currentGuideName,
            tour_type: document.getElementById('guideDetailTour')?.textContent || 'Local Tour',
            booking_date: date,
            days,
            price: total
        });

        alert(`Booking Request Sent!\n\nGuide: ${currentGuideName}\nDate: ${date} (${days} days)\nTotal: ${total}\n\nThe guide will contact you shortly.`);
        closeGuideDetails();
        
        if (typeof loadTravelerMyBookings === 'function') {
            loadTravelerMyBookings();
        }
    } catch (err) {
        alert(err.message || 'Could not place booking.');
    }
}

async function loadAvailableGuides() {
    const container = document.getElementById('availableGuides');
    if (!container) return;
    
    container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Finding verified local guides...</p>';

    try {
        allGuidesArray = await apiCall('GET', '/guides');
        filterGuides();
    } catch {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">Could not load guides. Please check your network connection.</p>';
    }
}

function filterGuides() {
    const container = document.getElementById('availableGuides');
    if (!container) return;

    const city = document.getElementById('guideCityFilter')?.value || 'All';
    const ageGroup = document.getElementById('guideAgeFilter')?.value || 'All';

    const filtered = allGuidesArray.filter(g => {
        const matchesCity = city === 'All' || (g.city && g.city.toLowerCase() === city.toLowerCase());
        let matchesAge = true;
        
        if (ageGroup === 'Under30') matchesAge = g.age && g.age < 30;
        else if (ageGroup === '30to40') matchesAge = g.age && g.age >= 30 && g.age <= 40;
        else if (ageGroup === 'Over40') matchesAge = g.age && g.age > 40;
        
        return matchesCity && matchesAge;
    });

    if (!filtered.length) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">No guides found matching these filters.</p>';
        return;
    }

    container.innerHTML = filtered.map(guide => {
        const service = guide.services?.[0] || {};
        const serviceName = service.service_name || 'Local Tour Guide';
        const priceStr = service.price ? `₹${service.price}` : '₹2,500';
        const descStr = service.description || 'Local destination exploration and assistance';
        const initials = guide.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        return `
            <div class="service-card">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                    <div style="width:40px; height:40px; border-radius:50%; background:#fef3c7; color:#b45309; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; border:1px solid #fde68a; flex-shrink:0;">${initials}</div>
                    <div>
                        <h4 style="margin:0; font-size:15px;">${guide.name}</h4>
                        <p style="margin:0; font-size:12px; color:#71717a;">Rating: ${guide.rating || '4.9'}</p>
                    </div>
                </div>
                <p class="service-type">${serviceName} • ${guide.city || ''} (Age: ${guide.age || 'N/A'})</p>
                <p style="color:#10b981;font-size:13px;margin-top:5px;">Available</p>
                <button class="booking-btn" onclick="viewGuideDetails('${guide.name}', '${serviceName}', '${guide.rating || '4.9'}', '${guide.age || 'N/A'}', '${guide.phone || ''}', 'Available', '${descStr}', '${priceStr}')">
                    View Details
                </button>
            </div>
        `;
    }).join('');
}
