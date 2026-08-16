
async function processIDCardOCR(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const statusDiv = document.getElementById('ocrStatus');
    if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.style.color = '#71717a';
        statusDiv.innerHTML = 'Reading document... Initializing OCR engine';
    }

    try {
        const result = await Tesseract.recognize(
            file,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing' && statusDiv) {
                        const progress = Math.round(m.progress * 100);
                        statusDiv.innerHTML = `Scanning document (${progress}%)`;
                    }
                }
            }
        );

        const rawText = result.data.text || "";
        const upperText = rawText.toUpperCase();

        const isAadhar = upperText.includes('GOVERNMENT OF INDIA') || 
                         upperText.includes('UNIQUE IDENTIFICATION') || 
                         upperText.includes('DOB') ||
                         upperText.includes('YEAR OF BIRTH');

        const isPassport = upperText.includes('REPUBLIC OF INDIA') || upperText.includes('PASSPORT');
        const isLicense = upperText.includes('DRIVING LICENSE') || upperText.includes('UNION OF INDIA');

        const aadharRegex = /\b\d{4}\s\d{4}\s\d{4}\b/;
        const passportRegex = /\b[A-Z][0-9]{7}\b/;
        const licenseRegex = /\b[A-Z]{2}[0-9]{2}[0-9A-Z]{11}\b/;

        const foundAadhar = aadharRegex.exec(rawText);
        const foundPassport = passportRegex.exec(rawText);
        const foundLicense = licenseRegex.exec(rawText);

        const currentRole = document.getElementById('signupRole')?.value || 'traveler';

        if (isAadhar || isPassport || isLicense || foundAadhar || foundPassport || foundLicense) {
            let idType = "Govt ID Card";
            let extractedVal = "";

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
                const numbers = rawText.match(/\b\d{6,16}\b/);
                extractedVal = numbers ? numbers[0] : "Verified Document";
            }

            if (statusDiv) {
                statusDiv.style.color = '#10b981';
                statusDiv.innerHTML = `${idType} Authenticated!<br><span style="font-size:10px;">Document Number: ${extractedVal}</span>`;
            }

            if (currentRole === 'traveler') {
                const travelerInput = document.getElementById('signupTravelerId');
                const typeInput = document.getElementById('travelerIdType');
                if (travelerInput) travelerInput.value = extractedVal;
                if (typeInput) typeInput.value = idType === "Passport" ? "passport" : "aadhar";
            } else if (currentRole === 'driver') {
                const licenseInput = document.getElementById('signupDrivingLicense');
                if (licenseInput) licenseInput.value = extractedVal;
            } else if (currentRole === 'guide') {
                const aadharInput = document.getElementById('signupAadhar');
                if (aadharInput) aadharInput.value = extractedVal;
            }

        } else if (statusDiv) {
            statusDiv.style.color = '#dc2626';
            statusDiv.innerHTML = 'Document layout not recognized.<br><span style="font-size:10px;color:#71717a;">Please upload a clear, legible picture showing your Aadhaar or Passport card text.</span>';
        }

    } catch (err) {
        console.error('OCR scanning error:', err);
        if (statusDiv) {
            statusDiv.style.color = '#dc2626';
            statusDiv.innerHTML = `Scanning failed: ${err.message}`;
        }
    }
}
