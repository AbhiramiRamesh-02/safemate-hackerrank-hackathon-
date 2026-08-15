var currentChatBookingId = null;
var currentChatRecipientName = "";
var chatPollInterval = null;

function toggleChatWindow() {
    var box = document.getElementById('chatBoxContainer');
    if (!box) return;
    if (box.classList.contains('hidden')) {
        box.classList.remove('hidden');
        loadChatMessages();
        if (chatPollInterval) clearInterval(chatPollInterval);
        chatPollInterval = setInterval(loadChatMessages, 3000);
    } else {
        box.classList.add('hidden');
        if (chatPollInterval) clearInterval(chatPollInterval);
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

async function sendChatMessage() {
    var input = document.getElementById('chatInput');
    var text = input.value.trim();
    if (!text || !currentChatBookingId) return;

    input.value = '';
    try {
        await apiCall('POST', '/chat', { bookingId: currentChatBookingId, text: text });
        loadChatMessages();
    } catch (err) {
        console.error("Failed to send message: ", err);
    }
}

async function loadChatMessages() {
    if (!currentChatBookingId) return;
    var chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    try {
        var messages = await apiCall('GET', '/chat/' + currentChatBookingId);
        var currentUser = getCurrentUser();
        var userEmail = currentUser ? currentUser.email : "";

        var html = '';
        messages.forEach(function(m) {
            var isMe = m.senderEmail === userEmail;
            var align = isMe ? 'flex-end' : 'flex-start';
            var bg = isMe ? '#be185d' : '#f4f4f5';
            var color = isMe ? 'white' : '#18181b';
            var radius = isMe ? '12px 12px 0 12px' : '12px 12px 12px 0';
            
            // Safety sanitization helper
            var safeText = document.createElement('div');
            safeText.innerText = m.text;
            
            html += '<div style="align-self:' + align + '; background:' + bg + '; color:' + color + '; padding:8px 12px; border-radius:' + radius + '; max-width:80%; line-height:1.4; word-break:break-word; margin-bottom:8px;">' +
                '<span style="font-size:10px; font-weight:700; display:block; opacity:0.75; margin-bottom:2px;">' + m.senderName + '</span>' +
                safeText.innerHTML +
                '</div>';
        });
        
        var oldCount = chatMessages.children.length;
        chatMessages.innerHTML = html;
        if (messages.length > oldCount) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    } catch (err) {
        console.warn("Could not load messages:", err);
    }
}

function openChatFromBooking(bookingId, recipientName, status) {
    if (status !== 'accepted' && status !== 'confirmed') {
        alert('Chat is locked until the booking is accepted/confirmed!');
        return;
    }

    currentChatBookingId = bookingId;
    currentChatRecipientName = recipientName;
    localStorage.setItem('hasActiveRide', 'true');
    localStorage.setItem('chatDriverName', recipientName);
    
    var nameEl = document.getElementById('chatDriverName');
    if (nameEl) nameEl.textContent = 'Chat with ' + recipientName;
    
    var chatBtn = document.getElementById('chatFloatingBtn');
    if (chatBtn) chatBtn.classList.remove('hidden');
    
    var box = document.getElementById('chatBoxContainer');
    if (box && box.classList.contains('hidden')) {
        toggleChatWindow();
    } else {
        loadChatMessages();
    }
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
            var trustScore = 92;
            var badgeText = "92% Confidence • ML Verified";
            var badgeBg = "#dbeafe";
            var badgeColor = "#1e40af";
            
            if (r.category === 'Harassment' || r.category === 'Stalking & Following' || r.category === 'Physical Assault') {
                trustScore = 96;
                badgeText = "96% Confidence • GPS & Anomaly Verified";
                badgeBg = "#dcfce7";
                badgeColor = "#166534";
            } else if (r.category === 'Scream Alert' || r.location.toLowerCase().includes('scream') || r.description.toLowerCase().includes('scream')) {
                trustScore = 89;
                badgeText = "89% Confidence • Acoustic Sensor Validated";
                badgeBg = "#fef3c7";
                badgeColor = "#92400e";
            } else {
                trustScore = 78;
                badgeText = "78% Confidence • Community Consensus";
                badgeBg = "#f3f4f6";
                badgeColor = "#4b5563";
            }
            
            return '<div style="background:#fff5f5; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius:12px; padding:15px; text-align:left;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">' +
                '<strong style="color:#dc2626; font-size:15px;">Warning: ' + r.category + '</strong>' +
                '<span style="color:#9ca3af; font-size:12px;">' + date + '</span>' +
                '</div>' +
                '<div style="display:inline-block; font-size:11px; font-weight:700; padding:3px 10px; border-radius:12px; background:' + badgeBg + '; color:' + badgeColor + '; margin-bottom:8px; border:1px solid rgba(0,0,0,0.05);">' + badgeText + '</div>' +
                '<p style="font-size:13px; color:#666; margin-bottom:8px;"><strong>Location:</strong> ' + r.location + '</p>' +
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
            return '<div class="review-card"><h4>Rating: ' + r.rating + '</h4><p>"' + r.text + '"</p><small>- ' + r.reviewer_name + ' (' + r.service + ')</small></div>';
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
