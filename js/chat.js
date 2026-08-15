function toggleChatWindow() {
    var box = document.getElementById('chatBoxContainer');
    if (!box) return;
    if (box.classList.contains('hidden')) {
        box.classList.remove('hidden');
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    } else {
        box.classList.add('hidden');
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    var input = document.getElementById('chatInput');
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    var chatMessages = document.getElementById('chatMessages');

    var userDiv = document.createElement('div');
    userDiv.style.alignSelf = 'flex-end';
    userDiv.style.background = '#be185d';
    userDiv.style.color = 'white';
    userDiv.style.padding = '8px 12px';
    userDiv.style.borderRadius = '12px 12px 0 12px';
    userDiv.style.maxWidth = '80%';
    userDiv.style.lineHeight = '1.4';
    userDiv.innerText = text;
    chatMessages.appendChild(userDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(function() {
        var replies = [
            "Got it! Arriving at your location in 3 minutes.",
            "Sure, I am driving on the main road now. See you shortly.",
            "Alright. Please look out for the white Sedan/SUV.",
            "Understood. Safe travels!"
        ];
        var replyText = replies[Math.floor(Math.random() * replies.length)];

        var driverDiv = document.createElement('div');
        driverDiv.style.alignSelf = 'flex-start';
        driverDiv.style.background = '#f4f4f5';
        driverDiv.style.color = '#18181b';
        driverDiv.style.padding = '8px 12px';
        driverDiv.style.borderRadius = '12px 12px 12px 0';
        driverDiv.style.maxWidth = '80%';
        driverDiv.style.lineHeight = '1.4';
        driverDiv.innerText = replyText;
        chatMessages.appendChild(driverDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1500);
}

function checkActiveRideChat() {
    var hasActiveRide = localStorage.getItem('hasActiveRide');
    var driverName = localStorage.getItem('chatDriverName');
    var chatBtn = document.getElementById('chatFloatingBtn');

    if (hasActiveRide === 'true' && driverName) {
        if (chatBtn) chatBtn.classList.remove('hidden');
        var nameEl = document.getElementById('chatDriverName');
        if (nameEl) nameEl.textContent = 'Chat with ' + driverName;
    } else {
        if (chatBtn) chatBtn.classList.add('hidden');
        var box = document.getElementById('chatBoxContainer');
        if (box) box.classList.add('hidden');
    }
}

// ─── ANONYMOUS REPORTS ALERT SYSTEM ─────────────────────────
async function loadAnonymousReports() {
    var container = document.getElementById('anonymousReportsList');
    if (!container) return;
    container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">Loading community alerts...</p>';

    try {
        var reports = await apiCall('GET', '/anonymous-reports');
        if (reports.length === 0) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">No incidents reported in the community. Stay safe!</p>';
            return;
        }

        container.innerHTML = reports.map(function(r) {
            var date = new Date(r.created_at).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'});
            return '<div style="background:#fff5f5; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius:12px; padding:15px; text-align:left;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">' +
                '<strong style="color:#dc2626; font-size:15px;">⚠️ ' + r.category + '</strong>' +
                '<span style="color:#9ca3af; font-size:12px;">' + date + '</span>' +
                '</div>' +
                '<p style="font-size:13px; color:#666; margin-bottom:8px;">📍 <strong>Location:</strong> ' + r.location + '</p>' +
                '<p style="font-size:14px; color:#333; line-height:1.4;">' + r.description + '</p>' +
                '</div>';
        }).join('');
    } catch (err) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">Could not load reports.</p>';
    }
}

async function submitAnonymousReport() {
    var category = document.getElementById('reportCategory').value;
    var location = document.getElementById('reportLocation').value.trim();
    var description = document.getElementById('reportDescription').value.trim();

    if (!location || !description) {
        alert('Please provide location and incident details!');
        return;
    }

    try {
        await apiCall('POST', '/anonymous-reports', {
            category: category,
            location: location,
            description: description
        });
        alert('Report submitted anonymously! Alerts are being broadcast.');
        document.getElementById('reportLocation').value = '';
        document.getElementById('reportDescription').value = '';
        loadAnonymousReports();
    } catch (err) {
        alert(err.message);
    }
}

// ─── REVIEWS AND RATINGS SYSTEM ─────────────────────────────
async function loadReviews() {
    var container = document.getElementById('reviewsList');
    if (!container) return;
    try {
        var reviews = await apiCall('GET', '/reviews');
        if (reviews.length === 0) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">No reviews yet.</p>';
            return;
        }
        container.innerHTML = reviews.map(function(r) {
            return '<div class="review-card"><h4>' + r.rating + '</h4><p>"' + r.text + '"</p><small>- ' + r.reviewer_name + ' (' + r.service + ')</small></div>';
        }).join('');
    } catch (err) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">Could not load reviews.</p>';
    }
}

async function submitBookingReview() {
    var rating = document.getElementById('bookingReviewRating').value;
    var text = document.getElementById('bookingReviewText').value;

    if (!text) { alert('Please write your review!'); return; }

    try {
        await apiCall('POST', '/reviews', {
            text: text,
            service: 'Travel Guide - ' + currentBookingTour,
            rating: rating
        });
        alert('Thank you for your review!');
        document.getElementById('bookingReviewText').value = '';
        closeBookingDetails();
        loadReviews();
    } catch (err) {
        alert(err.message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkActiveRideChat();
});
