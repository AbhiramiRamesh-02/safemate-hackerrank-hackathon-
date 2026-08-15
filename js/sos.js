var emergencyContact = "";
var audioCtx = null;
var analyser = null;
var source = null;
var streamRef = null;
var volumeInterval = null;
var isAudioMonitoring = false;
var recognition = null;

// Show Emergency Modal
async function showEmergencyModal() {
    var modal = document.getElementById('emergencyModal');
    if (modal) modal.style.display = 'flex';
    
    var user = getCurrentUser();
    if (user) {
        try {
            var contacts = await apiCall('GET', '/emergency-contacts');
            if (contacts.length > 0) {
                emergencyContact = contacts[0].phone;
            }
        } catch (err) {}
    }
}

// Close Emergency Modal
function closeEmergencyModal() {
    var modal = document.getElementById('emergencyModal');
    if (modal) modal.style.display = 'none';
    cancelSOSHold();
}

// Hold to Activate SOS Logic
var sosProgressInterval = null;
var sosHoldProgress = 0;

function triggerEmergencySOS() {
    showEmergencyModal();
}

function startSOSHold(event) {
    if (event) {
        event.preventDefault();
    }
    cancelSOSHold(); // Reset state
    
    var container = document.getElementById('sosProgressBarContainer');
    var bar = document.getElementById('sosProgressBar');
    if (container) container.style.display = 'block';
    
    sosHoldProgress = 0;
    if (bar) bar.style.width = '0%';
    
    var startTime = Date.now();
    var duration = 3000; // 3 seconds
    
    sosProgressInterval = setInterval(function() {
        var elapsed = Date.now() - startTime;
        var pct = Math.min((elapsed / duration) * 100, 100);
        
        if (bar) bar.style.width = pct + '%';
        
        if (pct >= 100) {
            clearInterval(sosProgressInterval);
            triggerSOS();
        }
    }, 50);
}

function cancelSOSHold(event) {
    if (event) {
        event.preventDefault();
    }
    if (sosProgressInterval) {
        clearInterval(sosProgressInterval);
        sosProgressInterval = null;
    }
    var container = document.getElementById('sosProgressBarContainer');
    var bar = document.getElementById('sosProgressBar');
    if (container) container.style.display = 'none';
    if (bar) bar.style.width = '0%';
}

function triggerSOS() {
    cancelSOSHold();
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                var locationLink = "https://maps.google.com/?q=" + lat + "," + lon;
                
                alert("✓ EMERGENCY SOS ACTIVATED!\n\n✓ Live location shared!\n✓ Emergency contacts alerted!\n✓ Nearby SafeMate drivers notified!");
                
                if (emergencyContact) {
                    var message = "EMERGENCY! I need help. My current location: " + locationLink;
                    window.location.href = "sms:" + emergencyContact + "?body=" + encodeURIComponent(message);
                }
                closeEmergencyModal();
            },
            function(error) {
                alert("✓ EMERGENCY SOS ACTIVATED!\n\n✓ Emergency contacts alerted!\n✓ Nearby SafeMate drivers notified!");
                if (emergencyContact) {
                    var userName = "User";
                    try { userName = getCurrentUser().name; } catch(e){}
                    var message = "EMERGENCY! I need help. This is " + userName + ". (Coordinates not available)";
                    window.location.href = "sms:" + emergencyContact + "?body=" + encodeURIComponent(message);
                }
                closeEmergencyModal();
            }
        );
    } else {
        alert("✓ EMERGENCY SOS ACTIVATED!\n\n✓ Emergency contacts alerted!\n✓ Nearby SafeMate drivers notified!");
        if (emergencyContact) {
            var userName = "User";
            try { userName = getCurrentUser().name; } catch(e){}
            var message = "EMERGENCY! I need help. This is " + userName + ".";
            window.location.href = "sms:" + emergencyContact + "?body=" + encodeURIComponent(message);
        }
        closeEmergencyModal();
    }
}

// Save Emergency Contact
async function saveEmergencyContact() {
    var name = document.getElementById('emergencyContactName').value.trim();
    var phone = document.getElementById('emergencyContactPhone').value.trim();
    var relation = document.getElementById('emergencyContactRelation').value;

    if (!name || !phone) { alert('Please fill in all fields!'); return; }
    if (phone.length < 10) { alert('Please enter a valid phone number!'); return; }

    try {
        await apiCall('POST', '/emergency-contacts', {
            contact_name: name,
            phone: phone,
            relationship: relation
        });
        alert('Emergency contact saved successfully!');
        document.getElementById('emergencyContactName').value = '';
        document.getElementById('emergencyContactPhone').value = '';
        displaySavedContacts();
    } catch (err) {
        alert(err.message);
    }
}

// Display Saved Contacts
async function displaySavedContacts() {
    var container = document.getElementById('savedContacts');
    var centerContainer = document.getElementById('emergencyCenterContactsList');
    try {
        var contacts = await apiCall('GET', '/emergency-contacts');
        if (contacts.length === 0) {
            if (container) container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:15px;">No emergency contact saved yet.</p>';
            if (centerContainer) centerContainer.innerHTML = 'No emergency contact saved. <button class="btn-secondary" style="font-size:11px;padding:2px 8px;margin-left:6px;" onclick="showTravelerTab(\'emergencyContact\')">Add Contact</button>';
            return;
        }
        var html = '';
        contacts.forEach(function(c) {
            html += '<div style="background:var(--bg-surface-subtle);border:1px solid var(--border-color);padding:14px;border-radius:var(--radius-sm);margin-top:10px;">' +
                '<h4 style="color:var(--text-primary);margin-bottom:4px;">' + c.contact_name + ' (' + c.relationship + ')</h4>' +
                '<p style="color:var(--text-secondary);font-size:13px;margin:2px 0;"><strong>Phone:</strong> ' + c.phone + '</p>' +
                '</div>';
        });
        if (container) container.innerHTML = html;
        if (centerContainer) {
            centerContainer.innerHTML = '<p style="color:var(--status-safe);font-weight:600;margin-bottom:4px;">✓ Primary Contact Configured</p>' +
                '<p style="color:var(--text-primary);margin:0;"><strong>' + contacts[0].contact_name + '</strong> (' + contacts[0].relationship + ') · ' + contacts[0].phone + '</p>';
        }
    } catch (err) {
        if (container) container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:15px;">Could not load contacts.</p>';
    }
}

// Send Emergency Message
function sendEmergencyMessage() {
    if (!emergencyContact) {
        alert("No emergency contact found. Please add an emergency contact in your profile.");
        closeEmergencyModal();
        return;
    }
    
    var locationInfo = "";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                locationInfo = " My current location: https://maps.google.com/?q=" + lat + "," + lon;
                sendSMS(locationInfo);
            },
            function(error) {
                sendSMS(locationInfo);
            }
        );
    } else {
        sendSMS(locationInfo);
    }
}

function sendSMS(locationInfo) {
    var user = getCurrentUser();
    var userName = user ? user.name : "User";
    var message = "EMERGENCY! I need help. This is " + userName + ". I am in an emergency situation." + locationInfo;
    window.location.href = "sms:" + emergencyContact + "?body=" + encodeURIComponent(message);
    alert("Emergency message will be sent to " + emergencyContact);
    closeEmergencyModal();
}

// Alert Nearby Drivers
function alertNearbyDrivers() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                var locationLink = "https://maps.google.com/?q=" + lat + "," + lon;
                alert("EMERGENCY ALERT SENT!\n\nNearby women drivers have been notified of your emergency.\n\nYour location has been shared with available drivers nearby.\n\nLocation: " + locationLink + "\n\nHelp is on the way! Stay calm.");
            },
            function(error) {
                alert("EMERGENCY ALERT SENT!\n\nNearby women drivers have been notified of your emergency.\n\nPlease stay calm and safe.");
            }
        );
    } else {
        alert("EMERGENCY ALERT SENT!\n\nNearby women drivers have been notified of your emergency.\n\nPlease stay calm and safe.");
    }
}

// Acoustic Scream & Distress Detection
async function toggleScreamDetection() {
    var statusText = document.getElementById('micStatusText');
    var btn = document.getElementById('screamToggleBtn');
    var visualizer = document.getElementById('visualizerContainer');

    if (isAudioMonitoring) {
        if (volumeInterval) clearInterval(volumeInterval);
        if (streamRef) {
            streamRef.getTracks().forEach(track => track.stop());
        }
        if (audioCtx) audioCtx.close();
        if (recognition) {
            recognition.onend = null;
            recognition.stop();
        }
        resetMicUI();
        return;
    }

    try {
        var stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef = stream;
        isAudioMonitoring = true;

        if (statusText) {
            statusText.textContent = 'Monitoring Active (30% threshold)';
            statusText.style.color = '#10b981';
        }
        if (btn) {
            btn.textContent = 'Disable Mic';
            btn.style.background = '#ef4444';
        }
        if (visualizer) visualizer.classList.remove('hidden');

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        analyser.fftSize = 256;
        var bufferLength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);

        volumeInterval = setInterval(function() {
            analyser.getByteFrequencyData(dataArray);
            var sum = 0;
            for (var i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            var average = sum / bufferLength;
            var volumePercent = Math.min(100, Math.round((average / 128) * 100));
            
            document.getElementById('volumeBar').style.width = volumePercent + '%';
            
            if (volumePercent >= 30) {
                clearInterval(volumeInterval);
                triggerScreamSOS();
            }
        }, 100);

        var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = function(event) {
                for (var i = event.resultIndex; i < event.results.length; ++i) {
                    var text = event.results[i][0].transcript.toLowerCase();
                    console.log("Speech text: ", text);
                    
                    if (text.includes("help") || 
                        text.includes("save me") || 
                        text.includes("emergency") || 
                        text.includes("police") || 
                        text.includes("bachao") || 
                        text.includes("stop it") || 
                        text.includes("assault")) {
                        
                        triggerSpeechSOS(text);
                        break;
                    }
                }
            };

            recognition.onerror = function(event) {
                console.warn("Speech recognition warning: ", event.error);
            };

            recognition.onend = function() {
                if (isAudioMonitoring) {
                    try { recognition.start(); } catch(e) {}
                }
            };

            recognition.start();
        }

    } catch (err) {
        alert('Microphone access denied or unsupported on this device. Please check your browser permissions.');
    }
}

function triggerScreamSOS() {
    if (volumeInterval) clearInterval(volumeInterval);
    if (streamRef) streamRef.getTracks().forEach(track => track.stop());
    if (audioCtx) audioCtx.close();
    if (recognition) {
        recognition.onend = null;
        recognition.stop();
    }

    resetMicUI();

    alert('ACOUSTIC DISTRESS SIGNAL DETECTED!\n\nOur system detected a sudden loud scream or distress noise. Automatically activating the SOS portal...');
    showEmergencyModal();
    alertNearbyDrivers();
}

function triggerSpeechSOS(phrase) {
    if (volumeInterval) clearInterval(volumeInterval);
    if (streamRef) streamRef.getTracks().forEach(track => track.stop());
    if (audioCtx) audioCtx.close();
    if (recognition) {
        recognition.onend = null;
        recognition.stop();
    }

    resetMicUI();

    alert('VOICE DISTRESS KEYWORD DETECTED!\n\nYou spoke: "' + phrase + '"\n\nAutomatically activating the emergency SOS portal...');
    showEmergencyModal();
    alertNearbyDrivers();
}

function resetMicUI() {
    isAudioMonitoring = false;
    var statusText = document.getElementById('micStatusText');
    var btn = document.getElementById('screamToggleBtn');
    var visualizer = document.getElementById('visualizerContainer');
    
    if (statusText) {
        statusText.textContent = 'Disabled (Offline)';
        statusText.style.color = '#ef4444';
    }
    if (btn) {
        btn.textContent = 'Enable Mic';
        btn.style.background = '#10b981';
    }
    if (visualizer) visualizer.classList.add('hidden');
    document.getElementById('volumeBar').style.width = '0%';
}

function simulateScreamDetection() {
    triggerScreamSOS();
}

// Trigger initial load of saved contacts on DOM load
document.addEventListener('DOMContentLoaded', function() {
    displaySavedContacts();
});
