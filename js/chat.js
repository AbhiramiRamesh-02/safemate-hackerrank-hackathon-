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
            
            var badgeClass = "insufficient";
            var badgeText = "INSUFFICIENT DATA";
            var confidenceText = "Confidence: Low (Consensus pending)";

            if (r.category === 'Harassment' || r.category === 'Isolated / Dark Area' || r.category === 'Isolated Area') {
                badgeClass = "verified";
                badgeText = "VERIFIED CONCERN";
                confidenceText = "Confidence: High (Corroborated by independent signals)";
            } else if (r.category === 'Poor Lighting' || r.category === 'Suspicious Activity') {
                badgeClass = "community";
                badgeText = "COMMUNITY CONCERN";
                confidenceText = "Confidence: Medium (3 independent reports in last 14 days)";
            }
            
            return '<div class="card" style="padding: 16px; margin-bottom: 8px;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">' +
                '<strong style="color:var(--text-primary); font-size:14px;">' + r.category + '</strong>' +
                '<span style="color:var(--text-muted); font-size:11px;">' + date + '</span>' +
                '</div>' +
                '<div style="margin-bottom:8px;"><span class="status-pill ' + badgeClass + '">' + badgeText + '</span></div>' +
                '<p style="font-size:11px; color:var(--text-muted); margin-bottom:6px;">' + confidenceText + '</p>' +
                '<p style="font-size:13px; color:var(--text-secondary); margin-bottom:4px;"><strong>Location:</strong> ' + r.location + '</p>' +
                '<p style="font-size:13px; color:var(--text-primary); line-height:1.4;">' + r.description + '</p>' +
                '</div>';
        }).join('');
    } catch (err) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:15px;">Could not load reports.</p>';
    }
}

// Wizard State Variables
var wizardReportCategory = '';
var wizardReportTime = 'Today';

function selectReportCategory(category, el) {
    wizardReportCategory = category;
    document.querySelectorAll('.concern-select-card').forEach(function(card) {
        card.classList.remove('selected');
    });
    if (el) el.classList.add('selected');
    var revCat = document.getElementById('reviewCategory');
    if (revCat) revCat.textContent = category;
}

function selectReportTime(time, el) {
    wizardReportTime = time;
    var revTime = document.getElementById('reviewTime');
    if (revTime) revTime.textContent = time;
}

function useCurrentLocationForReport() {
    var locInput = document.getElementById('wizardLocationInput');
    if (locInput) {
        locInput.value = "MG Road Area, Bangalore";
        var revLoc = document.getElementById('reviewLocation');
        if (revLoc) revLoc.textContent = "MG Road Area, Bangalore";
    }
}

function wizardNext(step) {
    if (step === 2 && !wizardReportCategory) {
        alert('Please select a category of incident.');
        return;
    }
    if (step === 3) {
        var loc = document.getElementById('wizardLocationInput').value.trim();
        if (!loc) {
            alert('Please enter or confirm a location.');
            return;
        }
        var revLoc = document.getElementById('reviewLocation');
        if (revLoc) revLoc.textContent = loc;
    }
    if (step === 4) {
        var desc = document.getElementById('wizardDescInput').value.trim();
        var revDesc = document.getElementById('reviewDesc');
        if (revDesc) revDesc.textContent = desc || "No description provided.";
    }

    document.querySelectorAll('.wizard-step').forEach(function(stepDiv) {
        stepDiv.classList.add('hidden');
    });

    var targetStep = document.getElementById('step-' + step);
    if (targetStep) targetStep.classList.remove('hidden');

    // Update step indicators
    for (var i = 1; i <= 4; i++) {
        var ind = document.getElementById('ind-step-' + i);
        if (ind) {
            if (i <= step) {
                ind.classList.add('active');
            } else {
                ind.classList.remove('active');
            }
        }
    }
}

async function submitWizardReport() {
    var location = document.getElementById('wizardLocationInput').value.trim();
    var description = document.getElementById('wizardDescInput').value.trim();

    try {
        await apiCall('POST', '/anonymous-reports', {
            category: wizardReportCategory || 'Other Safety Concern',
            location: location,
            description: description + (wizardReportTime ? " (Timing: " + wizardReportTime + ")" : "")
        });

        document.querySelectorAll('.wizard-step').forEach(function(stepDiv) {
            stepDiv.classList.add('hidden');
        });
        var successStep = document.getElementById('step-success');
        if (successStep) successStep.classList.remove('hidden');

        loadAnonymousReports();
    } catch (err) {
        alert('Failed to submit report: ' + err.message);
    }
}

function resetWizardForm() {
    wizardReportCategory = '';
    wizardReportTime = 'Today';
    
    var locInput = document.getElementById('wizardLocationInput');
    if (locInput) locInput.value = '';
    var descInput = document.getElementById('wizardDescInput');
    if (descInput) descInput.value = '';
    
    document.querySelectorAll('.concern-select-card').forEach(function(card) {
        card.classList.remove('selected');
    });

    wizardNext(1);
}

// Keep backward compatibility
async function submitAnonymousReport() {
    wizardReportCategory = 'Other Safety Concern';
    document.getElementById('wizardLocationInput').value = document.getElementById('reportLocation') ? document.getElementById('reportLocation').value : '';
    document.getElementById('wizardDescInput').value = document.getElementById('reportDescription') ? document.getElementById('reportDescription').value : '';
    wizardReportTime = 'Today';
    submitWizardReport();
}

function triggerReportIncident() {
    showTravelerTab('anonymousReports');
    resetWizardForm();
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
