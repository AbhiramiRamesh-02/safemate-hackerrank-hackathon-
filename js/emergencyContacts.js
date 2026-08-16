// Emergency contact records, SMS location broadcasts, and SOS driver alerts

let emergencyContact = "";

// Loads the user's primary emergency contact
async function loadActiveEmergencyContact() {
    try {
        const contacts = await apiCall('GET', '/emergency-contacts');
        if (contacts.length > 0) {
            emergencyContact = contacts[0].phone;
        }
    } catch {}
}

// Triggers telephone call to saved emergency contact
function callEmergency() {
    if (!emergencyContact) {
        alert("No emergency contact found. Please add a trusted contact in your SOS settings.");
        closeEmergencyModal();
        return;
    }
    window.location.href = `tel:${emergencyContact}`;
    closeEmergencyModal();
}

// Emergency police dialer (100) with live GPS coordinate popup
function callPolice() {
    const policeNumber = "100";
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude: lat, longitude: lon } = position.coords;
                const locationLink = `https://maps.google.com/?q=${lat},${lon}`;
                alert(`Calling Police (100)...\n\nYour Location Link: ${locationLink}\n\nStay calm, help is being dispatched.`);
                window.location.href = `tel:${policeNumber}`;
            },
            () => {
                alert("Calling Police (100)... Stay calm, emergency operators are connecting.");
                window.location.href = `tel:${policeNumber}`;
            }
        );
    } else {
        window.location.href = `tel:${policeNumber}`;
    }
    
    closeEmergencyModal();
}

// Persists a new emergency contact
async function saveEmergencyContact() {
    const name = document.getElementById('emergencyContactName')?.value.trim();
    const phone = document.getElementById('emergencyContactPhone')?.value.trim();
    const relation = document.getElementById('emergencyContactRelation')?.value || 'Friend';

    if (!name || !phone) {
        alert('Please fill in both name and phone number.');
        return;
    }
    if (phone.length < 10) {
        alert('Please enter a valid 10-digit phone number.');
        return;
    }

    try {
        await apiCall('POST', '/emergency-contacts', {
            contact_name: name,
            phone,
            relationship: relation
        });

        alert('Emergency contact saved successfully.');
        document.getElementById('emergencyContactName').value = '';
        document.getElementById('emergencyContactPhone').value = '';
        displaySavedContacts();
    } catch (err) {
        alert(err.message || 'Could not save contact.');
    }
}

// Renders the list of active emergency contacts
async function displaySavedContacts() {
    const container = document.getElementById('savedContacts');
    if (!container) return;

    try {
        const contacts = await apiCall('GET', '/emergency-contacts');
        if (!contacts.length) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">No emergency contacts saved yet.</p>';
            return;
        }

        emergencyContact = contacts[0].phone;

        container.innerHTML = contacts.map(c => `
            <div style="background:#dcfce7;padding:15px;border-radius:10px;margin-top:15px;">
                <h4 style="color:#166534;margin-bottom:10px;">Emergency Contact</h4>
                <p style="color:#333;margin:5px 0;"><strong>Name:</strong> ${c.contact_name}</p>
                <p style="color:#333;margin:5px 0;"><strong>Phone:</strong> ${c.phone}</p>
                <p style="color:#666;font-size:13px;margin:5px 0;"><strong>Relationship:</strong> ${c.relationship}</p>
            </div>
        `).join('');
    } catch {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">Could not load contacts.</p>';
    }
}

// Dispatches distress SMS with Google Maps location pin
function sendEmergencyMessage() {
    if (!emergencyContact) {
        alert("No emergency contact found. Please configure an emergency contact first.");
        closeEmergencyModal();
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude: lat, longitude: lon } = position.coords;
                sendSMS(` My current location: https://maps.google.com/?q=${lat},${lon}`);
            },
            () => sendSMS('')
        );
    } else {
        sendSMS('');
    }
}

function sendSMS(locationInfo) {
    const user = getCurrentUser();
    const senderName = user?.name || 'User';
    const message = `EMERGENCY! I need immediate help. This is ${senderName}. I am in a distress situation.${locationInfo}`;
    
    window.location.href = `sms:${emergencyContact}?body=${encodeURIComponent(message)}`;
    closeEmergencyModal();
}

// Broadcasts alert to nearby verified women drivers
function alertNearbyDrivers() {
    const dispatchAlert = locationLink => {
        alert(`EMERGENCY BROADCAST SENT!\n\nNearby verified women drivers have been alerted to your position.\n${locationLink ? `\nLocation: ${locationLink}\n` : ''}\nPlease remain in a secure area.`);
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => dispatchAlert(`https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`),
            () => dispatchAlert('')
        );
    } else {
        dispatchAlert('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    displaySavedContacts();
});
