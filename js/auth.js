// User authentication, signup validation, and OTP flow handlers
let currentRole = "";
let globalVerifyEmail = "";

// Dynamic form display based on selected account type
function showVerificationField() {
    const roleEl = document.getElementById('signupRole');
    if (!roleEl) return;

    const role = roleEl.value;
    const travelerField = document.getElementById('travelerVerification');
    const driverField = document.getElementById('driverVerification');
    const guideField = document.getElementById('guideVerification');
    
    [travelerField, driverField, guideField].forEach(field => field && field.classList.add('hidden'));
    
    if (role === 'traveler' && travelerField) travelerField.classList.remove('hidden');
    if (role === 'driver' && driverField) driverField.classList.remove('hidden');
    if (role === 'guide' && guideField) guideField.classList.remove('hidden');
}

// Handles user sign in
async function login() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    try {
        const { token, user } = await apiCall('POST', '/login', { email, password });
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        document.getElementById('loginPage')?.classList.add('hidden');
        showDashboard(user.role);
    } catch (err) {
        if (err.status === 403 && err.message === 'UNVERIFIED') {
            alert('Your email is not verified yet. We have sent an OTP code to your inbox.');
            globalVerifyEmail = err.email;
            showOTPForm();
        } else {
            alert(err.message || 'Login failed. Please check your credentials.');
        }
    }
}

// Handles new account registration
async function signup() {
    const name = document.getElementById('signupName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const phone = document.getElementById('signupPhone')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
    const role = document.getElementById('signupRole')?.value || 'traveler';

    if (!name || !email || !phone || !password) {
        alert('Please complete all required fields.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match. Please re-enter.');
        return;
    }

    if (password.length < 6) {
        alert('Password should be at least 6 characters long.');
        return;
    }

    // Role-specific field validation
    if (role === 'traveler') {
        const travelerId = document.getElementById('signupTravelerId')?.value.trim();
        if (!travelerId) {
            alert('Please enter your government ID / Passport number.');
            return;
        }
    } else if (role === 'driver') {
        const drivingLicense = document.getElementById('signupDrivingLicense')?.value.trim();
        if (!drivingLicense) {
            alert('Please enter your valid Driving License number.');
            return;
        }
    } else if (role === 'guide') {
        const aadhar = document.getElementById('signupAadhar')?.value.trim();
        const age = document.getElementById('signupAge')?.value;
        if (!aadhar) {
            alert('Please enter your Aadhaar card number.');
            return;
        }
        if (!age || age < 18) {
            alert('Guides must be at least 18 years of age.');
            return;
        }
    }

    try {
        const payload = {
            name,
            email,
            phone,
            password,
            role,
            traveler_id: document.getElementById('signupTravelerId')?.value.trim() || '',
            traveler_id_type: document.getElementById('travelerIdType')?.value || 'aadhar',
            driving_license: document.getElementById('signupDrivingLicense')?.value.trim() || '',
            aadhar: document.getElementById('signupAadhar')?.value.trim() || '',
            age: document.getElementById('signupAge')?.value || '',
            emergency_contact: document.getElementById('signupEmergencyContact')?.value.trim() || ''
        };

        await apiCall('POST', '/signup', payload);
        alert('Account created! A verification code has been dispatched to your email.');
        globalVerifyEmail = payload.email;
        showOTPForm();
    } catch (err) {
        alert(err.message || 'Signup failed. Please try again.');
    }
}

// Switches form view to OTP confirmation
function showOTPForm() {
    document.getElementById('loginForm')?.classList.add('hidden');
    document.getElementById('signupForm')?.classList.add('hidden');
    document.getElementById('otpForm')?.classList.remove('hidden');
    
    const authTitle = document.getElementById('authTitle');
    if (authTitle) authTitle.textContent = 'Verify Your Email';
}

// Verifies 6-digit OTP code
async function verifyOTP() {
    const otpInput = document.getElementById('otpCodeInput');
    const otp = otpInput?.value.trim();
    
    if (!otp || otp.length !== 6) {
        alert('Please enter the full 6-digit verification code.');
        return;
    }

    try {
        const { token, user } = await apiCall('POST', '/verify-otp', {
            email: globalVerifyEmail,
            otp
        });

        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        alert('Email verified successfully! Logging you into SafeMate...');
        
        if (otpInput) otpInput.value = '';
        document.getElementById('loginPage')?.classList.add('hidden');
        showDashboard(user.role);
    } catch (err) {
        alert(`Verification failed: ${err.message}`);
    }
}

// Dispatches a new OTP code if previous expired
async function resendOTP() {
    if (!globalVerifyEmail) {
        alert('No active session found. Please register or login.');
        return;
    }

    try {
        const res = await apiCall('POST', '/resend-otp', { email: globalVerifyEmail });
        alert(res.message || 'A fresh code has been sent to your email.');
    } catch (err) {
        alert(`Could not resend code: ${err.message}`);
    }
}

// Clears user authentication session and returns to Home
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('hasActiveRide');
    localStorage.removeItem('chatDriverName');
    
    if (typeof checkActiveRideChat === 'function') checkActiveRideChat();
    
    const views = ['travelerDashboard', 'driverDashboard', 'guideDashboard', 'loginPage', 'home', 'aboutUs'];
    views.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    
    document.getElementById('home')?.classList.remove('hidden');
    document.getElementById('logoutBtn')?.classList.add('hidden');
}

// Developer debugging helper to reset localStorage
function clearAllData() {
    if (confirm('Clear all stored sessions and cached data? This will log you out.')) {
        localStorage.clear();
        location.reload();
    }
}

// Verifies if the user is already authenticated on page load
function checkLoginStatus() {
    const user = getCurrentUser();
    if (user && user.role) {
        showDashboard(user.role);
    }
}
