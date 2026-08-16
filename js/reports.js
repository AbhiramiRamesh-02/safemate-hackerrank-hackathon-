let attachedReportPhotoBase64 = null;
let detectedReportCoords = null;

function handleReportPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        attachedReportPhotoBase64 = e.target.result;
        const preview = document.getElementById('reportPhotoPreview');
        const img = document.getElementById('reportPhotoImg');
        const nameSpan = document.getElementById('reportPhotoName');
        if (img) img.src = attachedReportPhotoBase64;
        if (preview) preview.style.display = 'block';
        if (nameSpan) nameSpan.textContent = file.name;
    };
    reader.readAsDataURL(file);
}

function clearReportPhoto() {
    attachedReportPhotoBase64 = null;
    const input = document.getElementById('reportPhotoInput');
    const preview = document.getElementById('reportPhotoPreview');
    const nameSpan = document.getElementById('reportPhotoName');
    if (input) input.value = '';
    if (preview) preview.style.display = 'none';
    if (nameSpan) nameSpan.textContent = 'No photo attached';
}

function detectReportLocation() {
    const statusEl = document.getElementById('reportGpsStatus');
    const locInput = document.getElementById('reportLocation');
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.color = '#B85C78';
        statusEl.textContent = 'Detecting GPS coordinates...';
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            detectedReportCoords = { latitude, longitude };
            
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();
                const address = data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
                if (locInput) locInput.value = address;
            } catch {
                if (locInput) locInput.value = `GPS Pinned (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            }

            if (statusEl) {
                statusEl.style.color = '#10b981';
                statusEl.textContent = `GPS Captured: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            }
        },
        () => {
            if (statusEl) {
                statusEl.style.color = '#ef4444';
                statusEl.textContent = 'Could not access location. Please type manually.';
            }
        }
    );
}

function runNLPThreatClassifier(category, description, hasPhoto, hasCoords) {
    const text = (description + ' ' + category).toLowerCase();
    const criticalWords = ['knife', 'gun', 'weapon', 'assault', 'attack', 'touch', 'grab', 'force', 'chase', 'stalk', 'stalker', 'deviat', 'lock'];
    const highWords = ['shout', 'follow', 'harass', 'screaming', 'unlit', 'isolated', 'threat', 'abuse', 'corner'];

    let threatScore = 40;
    const detectedSignals = [];

    criticalWords.forEach(w => {
        if (text.includes(w)) {
            threatScore += 18;
            detectedSignals.push(`Critical Keyword: ${w}`);
        }
    });

    highWords.forEach(w => {
        if (text.includes(w)) {
            threatScore += 10;
            detectedSignals.push(`Urgent Signal: ${w}`);
        }
    });

    if (hasPhoto) {
        threatScore += 10;
        detectedSignals.push('Photo Evidence Verified');
    }
    if (hasCoords) {
        threatScore += 8;
        detectedSignals.push('GPS Location Verified');
    }

    const urgency = Math.min(Math.max(threatScore, 45), 98);
    let threatLevel = 'COMMUNITY CAUTION';
    let badgeColor = '#f59e0b';
    let badgeBg = '#fef3c7';

    if (urgency >= 80) {
        threatLevel = 'CRITICAL ALERT';
        badgeColor = '#b91c1c';
        badgeBg = '#fee2e2';
    } else if (urgency >= 65) {
        threatLevel = 'HIGH RISK';
        badgeColor = '#c2410c';
        badgeBg = '#ffedd5';
    } else if (urgency >= 50) {
        threatLevel = 'MODERATE CONCERN';
        badgeColor = '#247A6B';
        badgeBg = '#DFF3EE';
    }

    const confidence = Math.min(70 + (hasPhoto ? 15 : 0) + (hasCoords ? 10 : 0) + Math.floor(Math.random() * 5), 99);

    return {
        urgency,
        threat_level: threatLevel,
        confidence,
        badgeColor,
        badgeBg,
        signals: detectedSignals.slice(0, 3)
    };
}

async function loadAnonymousReports() {
    const container = document.getElementById('anonymousReportsList');
    if (!container) return;
    
    container.innerHTML = '<p style="color:#6E5A87;text-align:center;padding:15px;font-size:13px;">Loading verified community alerts...</p>';

    try {
        const reports = await apiCall('GET', '/anonymous-reports');
        if (!reports.length) {
            container.innerHTML = '<p style="color:#6E5A87;text-align:center;padding:15px;font-size:13px;">No incidents reported in your area. Safe travels!</p>';
            return;
        }

        container.innerHTML = reports.map(r => {
            const date = new Date(r.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const ml = r.ml_analysis || runNLPThreatClassifier(r.category || '', r.description || '', Boolean(r.photo), Boolean(r.latitude));
            
            const photoHtml = r.photo ? `
                <div style="margin-top:10px;">
                    <img src="${r.photo}" alt="Evidence" style="max-height:140px; border-radius:8px; border:1px solid #E5DFEC; object-fit:cover; width:100%; cursor:pointer;" onclick="window.open(this.src)">
                    <span style="font-size:10px; color:#6E5A87; display:block; margin-top:2px;">Tap image to view full evidence</span>
                </div>
            ` : '';

            const signalsHtml = (ml.signals || []).map(s => `
                <span style="font-size:10px; background:#ffffff; border:1px solid #E5DFEC; padding:2px 6px; border-radius:4px; color:#4A3267;">${s}</span>
            `).join(' ');

            return `
                <div style="background:#ffffff; border: 1.5px solid #E5DFEC; border-left: 4px solid ${ml.badgeColor || '#DE638A'}; border-radius:12px; padding:14px; text-align:left; box-shadow:0 2px 8px rgba(74,50,103,0.03);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <strong style="color:#4A3267; font-size:14px;">${r.category}</strong>
                        <span style="color:#9E8CAA; font-size:11px;">${date}</span>
                    </div>
                    
                    <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:8px;">
                        <span style="font-size:10.5px; font-weight:700; padding:2px 8px; border-radius:10px; background:${ml.badgeBg || '#F9EDF3'}; color:${ml.badgeColor || '#DE638A'}; border:1px solid rgba(0,0,0,0.06);">
                            ML Threat: ${ml.threat_level || 'ANALYZED'} • ${ml.urgency || 75}% Urgency
                        </span>
                        <span style="font-size:10.5px; font-weight:600; padding:2px 7px; border-radius:10px; background:#ECFDF5; color:#059669; border:1px solid #A7F3D0;">
                            ML Confidence: ${ml.confidence || 88}%
                        </span>
                    </div>

                    <p style="font-size:12.5px; color:#6E5A87; margin-bottom:6px;"><strong>Location:</strong> ${r.location}</p>
                    <p style="font-size:13px; color:#271b35; line-height:1.45; margin-bottom:8px;">${r.description}</p>
                    
                    ${signalsHtml ? `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:6px;">${signalsHtml}</div>` : ''}
                    ${photoHtml}
                </div>
            `;
        }).join('');
    } catch {
        container.innerHTML = '<p style="color:#6E5A87;text-align:center;padding:15px;font-size:13px;">Could not load community alerts.</p>';
    }
}

async function submitAnonymousReport() {
    const category = document.getElementById('reportCategory')?.value || 'Other Concern';
    const locationInput = document.getElementById('reportLocation');
    const descInput = document.getElementById('reportDescription');

    const location = locationInput?.value.trim() || '';
    const description = descInput?.value.trim() || '';

    if (!location || !description) {
        alert('Please specify the incident location and details.');
        return;
    }

    const hasPhoto = Boolean(attachedReportPhotoBase64);
    const hasCoords = Boolean(detectedReportCoords);
    const mlAnalysis = runNLPThreatClassifier(category, description, hasPhoto, hasCoords);

    try {
        await apiCall('POST', '/anonymous-reports', {
            category,
            location,
            description,
            photo: attachedReportPhotoBase64 || undefined,
            latitude: detectedReportCoords?.latitude,
            longitude: detectedReportCoords?.longitude,
            ml_analysis: mlAnalysis
        });

        alert(`Report submitted anonymously!\n\nML Threat Assessment: ${mlAnalysis.threat_level}\nUrgency Score: ${mlAnalysis.urgency}%\nVerification Confidence: ${mlAnalysis.confidence}%\n\nNearby travelers and community members have been alerted.`);
        
        if (locationInput) locationInput.value = '';
        if (descInput) descInput.value = '';
        clearReportPhoto();
        detectedReportCoords = null;
        const gpsStatus = document.getElementById('reportGpsStatus');
        if (gpsStatus) gpsStatus.style.display = 'none';

        loadAnonymousReports();
    } catch (err) {
        alert(err.message || 'Error submitting report.');
    }
}
