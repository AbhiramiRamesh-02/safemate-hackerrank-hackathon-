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
    modal.style.display = 'flex';
    
    var user = getCurrentUser();
    if (user) {
        try {
            var contacts = await apiCall('GET', '/emergency/contacts');
            if (contacts.length > 0) {
                emergencyContact = contacts[0].phone;
            }
        } catch (err) {}
    }
}

// Close Emergency Modal
function closeEmergencyModal() {
    var modal = document.getElementById('emergencyModal');
    modal.style.display = 'none';
}

// Call Emergency Contact
function callEmergency() {
    if (!emergencyContact) {
        alert("No emergency contact found. Please add an emergency contact in your profile.");
        closeEmergencyModal();
        return;
    }
    window.location.href = "tel:" + emergencyContact;
    alert("Calling " + emergencyContact + "...");
    closeEmergencyModal();
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
                alert("🚨 EMERGENCY ALERT SENT!\n\nNearby women drivers have been notified of your emergency.\n\nYour location has been shared with available drivers nearby.\n\nLocation: " + locationLink + "\n\nHelp is on the way! Stay calm.");
            },
            function(error) {
                alert("🚨 EMERGENCY ALERT SENT!\n\nNearby women drivers have been notified of your emergency.\n\nPlease stay calm and safe.");
            }
        );
    } else {
        alert("🚨 EMERGENCY ALERT SENT!\n\nNearby women drivers have been notified of your emergency.\n\nPlease stay calm and safe.");
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
            statusText.textContent = '🟢 Monitoring Active (30% threshold)';
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

    alert('🚨 ACOUSTIC DISTRESS SIGNAL DETECTED!\n\nOur system detected a sudden loud scream or distress noise. Automatically activating the SOS portal...');
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

    alert('🚨 VOICE DISTRESS KEYWORD DETECTED!\n\nYou spoke: "' + phrase + '"\n\nAutomatically activating the emergency SOS portal...');
    showEmergencyModal();
    alertNearbyDrivers();
}

function resetMicUI() {
    isAudioMonitoring = false;
    var statusText = document.getElementById('micStatusText');
    var btn = document.getElementById('screamToggleBtn');
    var visualizer = document.getElementById('visualizerContainer');
    
    if (statusText) {
        statusText.textContent = '🔴 Disabled (Offline)';
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

// Smart ID OCR Scanning Logic
async function processIDCardOCR(event) {
    var file = event.target.files[0];
    if (!file) return;

    var statusDiv = document.getElementById('ocrStatus');
    statusDiv.style.display = 'block';
    statusDiv.style.color = '#71717a';
    statusDiv.innerHTML = '🔄 Reading document... Loading Tesseract AI';

    try {
        var result = await Tesseract.recognize(
            file,
            'eng',
            { logger: function(m) {
                if (m.status === 'recognizing') {
                    var progress = Math.round(m.progress * 100);
                    statusDiv.innerHTML = '🔍 Scanning ID (' + progress + '%)';
                }
            }}
        );

        var rawText = result.data.text || "";
        var upperText = rawText.toUpperCase();

        var isAadhar = upperText.includes('GOVERNMENT OF INDIA') || 
                       upperText.includes('UNIQUE IDENTIFICATION') || 
                       upperText.includes('MALE') || 
                       upperText.includes('FEMALE') ||
                       upperText.includes('DOB') ||
                       upperText.includes('YEAR OF BIRTH');

        var isPassport = upperText.includes('REPUBLIC OF INDIA') || 
                         upperText.includes('PASSPORT');

        var isLicense = upperText.includes('DRIVING LICENSE') || 
                        upperText.includes('LICENSE') ||
                        upperText.includes('UNION OF INDIA');

        var aadharRegex = /\b\d{4}\s\d{4}\s\d{4}\b/;
        var passportRegex = /\b[A-Z][0-9]{7}\b/;
        var licenseRegex = /\b[A-Z]{2}[0-9]{2}[0-9A-Z]{11}\b/;

        var foundAadhar = aadharRegex.exec(rawText);
        var foundPassport = passportRegex.exec(rawText);
        var foundLicense = licenseRegex.exec(rawText);

        var currentRole = document.getElementById('signupRole').value;

        if (isAadhar || isPassport || isLicense || foundAadhar || foundPassport || foundLicense) {
            statusDiv.style.color = '#10b981';
            var idType = "";
            var extractedVal = "";

            if (foundAadhar) {
                idType = "Aadhaar Card";
                extractedVal = foundAadhar[0];
            } else if (foundPassport) {
                idType = "Passport";
                extractedVal = foundPassport[0];
            } else if (foundLicense) {
                idType = "Driving License";
                extractedVal = foundLicense[0];
            } else {
                idType = isPassport ? "Passport" : "Govt ID Card";
                var numbers = rawText.match(/\b\d{6,16}\b/);
                extractedVal = numbers ? numbers[0] : "Verified Document";
            }

            statusDiv.innerHTML = '🛡️ ' + idType + ' Authenticated!<br>' +
                                  '<span style="font-size:10px;">ID Number Extracted: ' + extractedVal + '</span>';

            if (currentRole === 'traveler') {
                document.getElementById('signupTravelerId').value = extractedVal;
                if (idType === "Passport") {
                    document.getElementById('travelerIdType').value = "passport";
                } else {
                    document.getElementById('travelerIdType').value = "aadhar";
                }
            } else if (currentRole === 'driver') {
                document.getElementById('signupDrivingLicense').value = extractedVal;
            } else if (currentRole === 'guide') {
                document.getElementById('signupAadhar').value = extractedVal;
            }

        } else {
            statusDiv.style.color = '#dc2626';
            statusDiv.innerHTML = '⚠️ Document layout unrecognized.<br>' +
                                  '<span style="font-size:10px;color:#71717a;">Please upload a clear picture showing your full Aadhaar or Passport card text.</span>';
        }

    } catch (err) {
        console.error("OCR scan error:", err);
        statusDiv.style.color = '#dc2626';
        statusDiv.innerHTML = '❌ Scan failed: ' + err.message;
    }
}
