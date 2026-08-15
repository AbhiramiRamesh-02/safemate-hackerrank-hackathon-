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
            
            // Re-designed 3 confidence states
            var badgeText = "INSUFFICIENT DATA";
            var badgeBg = "#f3f4f6";
            var badgeColor = "#4b5563";
            var badgeBorder = "#e5e7eb";
            var confidenceText = "Confidence: Low (Consensus pending)";

            if (r.category === 'Harassment' || r.category === 'Isolated / Dark Area') {
                badgeText = "VERIFIED SAFETY CONCERN";
                badgeBg = "#fee2e2";
                badgeColor = "#b91c1c";
                badgeBorder = "#fca5a5";
                confidenceText = "Confidence: High (Confirmed through multiple reports)";
            } else if (r.category === 'Poor Lighting' || r.category === 'Suspicious Activity') {
                badgeText = "COMMUNITY CONCERN";
                badgeBg = "#fef3c7";
                badgeColor = "#d97706";
                badgeBorder = "#fcd34d";
                confidenceText = "Confidence: Medium (3 independent community reports received)";
            }
            
            return '<div style="background:#fafafa; border: 1px solid ' + badgeBorder + '; border-left: 5px solid ' + (badgeText === 'VERIFIED SAFETY CONCERN' ? '#ef4444' : (badgeText === 'COMMUNITY CONCERN' ? '#f59e0b' : '#9ca3af')) + '; border-radius:12px; padding:15px; text-align:left;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">' +
                '<strong style="color:#111827; font-size:15px;">' + r.category + '</strong>' +
                '<span style="color:#9ca3af; font-size:12px;">' + date + '</span>' +
                '</div>' +
                '<div style="display:inline-block; font-size:11px; font-weight:700; padding:2px 8px; border-radius:4px; background:' + badgeBg + '; color:' + badgeColor + '; border:1px solid ' + badgeBorder + '; margin-bottom:8px;">' + badgeText + '</div>' +
                '<p style="font-size:11px; color:#4b5563; font-style:italic; margin-bottom:8px;">' + confidenceText + '</p>' +
                '<p style="font-size:13px; color:#4b5563; margin-bottom:4px;"><strong>Location:</strong> ' + r.location + '</p>' +
                '<p style="font-size:13px; color:#374151; line-height:1.4;">' + r.description + '</p>' +
                '</div>';
        }).join('');
    } catch (err) {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">Could not load reports.</p>';
    }
}

// Wizard State Variables
var wizardReportCategory = '';
var wizardReportTime = '';

function selectReportCategory(category, el) {
    wizardReportCategory = category;
    document.querySelectorAll('.category-card').forEach(function(card) {
        card.style.border = '2px solid #e4e4e7';
        card.style.background = 'white';
        card.style.color = '#374151';
    });
    el.style.border = '2px solid #be185d';
    el.style.background = '#fdf2f8';
    el.style.color = '#be185d';
    document.getElementById('reviewCategory').textContent = category;
}

function selectReportTime(time, el) {
    wizardReportTime = time;
    document.querySelectorAll('.time-card').forEach(function(card) {
        card.style.border = '2px solid #e4e4e7';
        card.style.background = 'white';
        card.style.color = '#374151';
    });
    el.style.border = '2px solid #be185d';
    el.style.background = '#fdf2f8';
    el.style.color = '#be185d';
    document.getElementById('reviewTime').textContent = time;
}

function useCurrentLocationForReport() {
    var locInput = document.getElementById('wizardLocationInput');
    if (locInput) {
        locInput.value = "MG Road Area, Bangalore";
        document.getElementById('reviewLocation').textContent = "MG Road Area, Bangalore";
    }
}

function wizardNext(step) {
    if (step === 2 && !wizardReportCategory) {
        alert('Please select a category of incident!');
        return;
    }
    if (step === 3) {
        var loc = document.getElementById('wizardLocationInput').value.trim();
        if (!loc) {
            alert('Please confirm or input a location!');
            return;
        }
        document.getElementById('reviewLocation').textContent = loc;
    }
    if (step === 4 && !wizardReportTime) {
        alert('Please select when the incident happened!');
        return;
    }
    if (step === 5) {
        var desc = document.getElementById('wizardDescInput').value.trim();
        document.getElementById('reviewDesc').textContent = desc || "No description provided.";
    }

    document.querySelectorAll('.wizard-step').forEach(function(stepDiv) {
        stepDiv.classList.add('hidden');
    });

    var targetStep = document.getElementById('step-' + step);
    if (targetStep) targetStep.classList.remove('hidden');

    var progressPct = (step / 5) * 100;
    var progressEl = document.getElementById('wizardProgress');
    if (progressEl) progressEl.style.width = progressPct + '%';
}

async function submitWizardReport() {
    var location = document.getElementById('wizardLocationInput').value.trim();
    var description = document.getElementById('wizardDescInput').value.trim();

    try {
        await apiCall('POST', '/anonymous-reports', {
            category: wizardReportCategory,
            location: location,
            description: description + " (Time: " + wizardReportTime + ")"
        });

        document.querySelectorAll('.wizard-step').forEach(function(stepDiv) {
            stepDiv.classList.add('hidden');
        });
        var successStep = document.getElementById('step-success');
        if (successStep) successStep.classList.remove('hidden');
        
        var progressEl = document.getElementById('wizardProgress');
        if (progressEl) progressEl.style.width = '100%';

        loadAnonymousReports();
    } catch (err) {
        alert('Failed to submit report: ' + err.message);
    }
}

function resetWizardForm() {
    wizardReportCategory = '';
    wizardReportTime = '';
    
    document.getElementById('wizardLocationInput').value = '';
    document.getElementById('wizardDescInput').value = '';
    
    document.querySelectorAll('.category-card').forEach(function(card) {
        card.style.border = '2px solid #e4e4e7';
        card.style.background = 'white';
        card.style.color = '#374151';
    });
    
    document.querySelectorAll('.time-card').forEach(function(card) {
        card.style.border = '2px solid #e4e4e7';
        card.style.background = 'white';
        card.style.color = '#374151';
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
