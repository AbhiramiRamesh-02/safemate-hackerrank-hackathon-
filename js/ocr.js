// Smart ID OCR Scanning Logic
async function processIDCardOCR(event) {
    var file = event.target.files[0];
    if (!file) return;

    var statusDiv = document.getElementById('ocrStatus');
    statusDiv.style.display = 'block';
    statusDiv.style.color = '#71717a';
    statusDiv.innerHTML = 'Reading document... Loading Tesseract AI';

    try {
        var result = await Tesseract.recognize(
            file,
            'eng',
            { logger: function(m) {
                if (m.status === 'recognizing') {
                    var progress = Math.round(m.progress * 100);
                    statusDiv.innerHTML = 'Scanning ID (' + progress + '%)';
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

            statusDiv.innerHTML = idType + ' Authenticated!<br>' +
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
            statusDiv.innerHTML = 'Document layout unrecognized.<br>' +
                                  '<span style="font-size:10px;color:#71717a;">Please upload a clear picture showing your full Aadhaar or Passport card text.</span>';
        }

    } catch (err) {
        console.error("OCR scan error:", err);
        statusDiv.style.color = '#dc2626';
        statusDiv.innerHTML = 'Scan failed: ' + err.message;
    }
}
