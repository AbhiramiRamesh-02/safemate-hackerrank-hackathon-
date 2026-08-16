// Microphone acoustic scream detection & voice distress keyword trigger

let audioCtx = null;
let analyser = null;
let source = null;
let streamRef = null;
let volumeInterval = null;
let isAudioMonitoring = false;
let recognition = null;

// Display emergency action modal
async function showEmergencyModal() {
    const modal = document.getElementById('emergencyModal');
    if (modal) modal.style.display = 'flex';
    
    if (typeof loadActiveEmergencyContact === 'function') {
        loadActiveEmergencyContact();
    }
}

function closeEmergencyModal() {
    const modal = document.getElementById('emergencyModal');
    if (modal) modal.style.display = 'none';
}

// Toggle microphone audio monitoring for screams / sudden sound spikes
async function toggleScreamDetection() {
    const statusText = document.getElementById('micStatusText');
    const btn = document.getElementById('screamToggleBtn');
    const visualizer = document.getElementById('visualizerContainer');

    if (isAudioMonitoring) {
        stopAudioMonitoring();
        resetMicUI();
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
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
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Volume analysis loop
        volumeInterval = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            const sum = dataArray.reduce((acc, val) => acc + val, 0);
            const average = sum / bufferLength;
            const volumePercent = Math.min(100, Math.round((average / 128) * 100));
            
            const volBar = document.getElementById('volumeBar');
            if (volBar) volBar.style.width = `${volumePercent}%`;
            
            if (volumePercent >= 30) {
                clearInterval(volumeInterval);
                triggerScreamSOS();
            }
        }, 100);

        // Speech recognition for distress keywords
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            const distressWords = ['help', 'save me', 'emergency', 'police', 'bachao', 'stop it', 'assault'];

            recognition.onresult = event => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const text = event.results[i][0].transcript.toLowerCase();
                    if (distressWords.some(word => text.includes(word))) {
                        triggerSpeechSOS(text);
                        break;
                    }
                }
            };

            recognition.onerror = e => console.warn('Speech recognition notice:', e.error);
            recognition.onend = () => {
                if (isAudioMonitoring) {
                    try { recognition.start(); } catch {}
                }
            };

            recognition.start();
        }

    } catch {
        alert('Microphone access was denied or is not supported. Please grant permissions to enable scream detection.');
    }
}

function stopAudioMonitoring() {
    if (volumeInterval) clearInterval(volumeInterval);
    if (streamRef) streamRef.getTracks().forEach(track => track.stop());
    if (audioCtx) audioCtx.close().catch(() => {});
    if (recognition) {
        recognition.onend = null;
        recognition.stop();
    }
}

function triggerScreamSOS() {
    stopAudioMonitoring();
    resetMicUI();
    
    alert('ACOUSTIC DISTRESS SIGNAL DETECTED!\n\nA sudden sound spike was detected. Opening SOS portal...');
    showEmergencyModal();
    if (typeof alertNearbyDrivers === 'function') alertNearbyDrivers();
}

function triggerSpeechSOS(phrase) {
    stopAudioMonitoring();
    resetMicUI();
    
    alert(`VOICE DISTRESS PHRASE DETECTED: "${phrase}"\n\nOpening emergency SOS portal...`);
    showEmergencyModal();
    if (typeof alertNearbyDrivers === 'function') alertNearbyDrivers();
}

function resetMicUI() {
    isAudioMonitoring = false;
    const statusText = document.getElementById('micStatusText');
    const btn = document.getElementById('screamToggleBtn');
    const visualizer = document.getElementById('visualizerContainer');
    
    if (statusText) {
        statusText.textContent = 'Disabled (Offline)';
        statusText.style.color = '#ef4444';
    }
    if (btn) {
        btn.textContent = 'Enable Mic';
        btn.style.background = '#10b981';
    }
    if (visualizer) visualizer.classList.add('hidden');
    
    const volBar = document.getElementById('volumeBar');
    if (volBar) volBar.style.width = '0%';
}

// Test trigger for demo/pitch presentations
function simulateScreamDetection() {
    triggerScreamSOS();
}
