// Real-time peer-to-peer ride and tour message exchange

let currentChatBookingId = null;
let currentChatRecipientName = "";
let chatPollInterval = null;

// Opens or minimizes floating chat window
function toggleChatWindow() {
    const box = document.getElementById('chatBoxContainer');
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

// Sends a message in the active booking channel
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text || !currentChatBookingId) return;

    input.value = '';
    try {
        await apiCall('POST', '/chat', { bookingId: currentChatBookingId, text });
        loadChatMessages();
    } catch (err) {
        console.error('Error sending message:', err);
    }
}

// Queries latest message thread for active booking
async function loadChatMessages() {
    if (!currentChatBookingId) return;
    const container = document.getElementById('chatMessages');
    if (!container) return;

    try {
        const messages = await apiCall('GET', `/chat/${currentChatBookingId}`);
        const currentUser = getCurrentUser();
        const userEmail = currentUser?.email || "";

        const html = messages.map(m => {
            const isMe = m.senderEmail === userEmail;
            const align = isMe ? 'flex-end' : 'flex-start';
            const bg = isMe ? '#DE638A' : '#f4f4f5';
            const color = isMe ? 'white' : '#18181b';
            const radius = isMe ? '12px 12px 0 12px' : '12px 12px 12px 0';
            
            // XSS sanitization
            const temp = document.createElement('div');
            temp.textContent = m.text;
            const safeText = temp.innerHTML;
            
            return `
                <div style="align-self:${align}; background:${bg}; color:${color}; padding:8px 12px; border-radius:${radius}; max-width:80%; line-height:1.4; word-break:break-word; margin-bottom:8px;">
                    <span style="font-size:10px; font-weight:700; display:block; opacity:0.85; margin-bottom:2px;">${m.senderName}</span>
                    ${safeText}
                </div>
            `;
        }).join('');
        
        const previousCount = container.children.length;
        container.innerHTML = html;
        
        // Auto scroll on new incoming message
        if (messages.length > previousCount) {
            container.scrollTop = container.scrollHeight;
        }
    } catch (err) {
        console.warn('Could not poll messages:', err);
    }
}

// Direct entry into chat channel from a ride or guide booking card
function openChatFromBooking(bookingId, recipientName, status) {
    if (status !== 'accepted' && status !== 'confirmed') {
        alert('Chat becomes available once the ride or tour booking is accepted.');
        return;
    }

    currentChatBookingId = bookingId;
    currentChatRecipientName = recipientName;
    
    localStorage.setItem('hasActiveRide', 'true');
    localStorage.setItem('chatDriverName', recipientName);
    
    const titleEl = document.getElementById('chatDriverName');
    if (titleEl) titleEl.textContent = `Chat with ${recipientName}`;
    
    document.getElementById('chatFloatingBtn')?.classList.remove('hidden');
    
    const box = document.getElementById('chatBoxContainer');
    if (box?.classList.contains('hidden')) {
        toggleChatWindow();
    } else {
        loadChatMessages();
    }
}

// Checks if the user has an ongoing ride/tour conversation session
function checkActiveRideChat() {
    const hasActiveRide = localStorage.getItem('hasActiveRide');
    const driverName = localStorage.getItem('chatDriverName');
    const chatBtn = document.getElementById('chatFloatingBtn');

    if (hasActiveRide === 'true' && driverName) {
        chatBtn?.classList.remove('hidden');
        const titleEl = document.getElementById('chatDriverName');
        if (titleEl) titleEl.textContent = `Chat with ${driverName}`;
    } else {
        chatBtn?.classList.add('hidden');
        document.getElementById('chatBoxContainer')?.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkActiveRideChat();
});
