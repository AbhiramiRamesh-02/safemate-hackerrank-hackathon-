// ─── API CONFIG & HELPERS ───────────────────────────────────
var API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : '/api';

async function apiCall(method, url, body) {
    var options = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
    };
    var token = localStorage.getItem('token');
    if (token) options.headers['Authorization'] = token;
    if (body) options.body = JSON.stringify(body);

    var res = await fetch(API + url, options);
    var data = await res.json();
    if (!res.ok) {
        var err = new Error(data.error || 'Something went wrong');
        err.status = res.status;
        err.email = data.email;
        throw err;
    }
    return data;
}

function getCurrentUser() {
    var user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

var currentRole = "";
var globalVerifyEmail = "";

// ─── NAVIGATION & FORMS TOGGLES ──────────────────────────────
function showHome() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('home').classList.remove('hidden');
}

function showLogin(role) {
    currentRole = role;
    document.getElementById('home').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('signupRole').value = role;
    showVerificationField();
    showLoginForm();
}

function showSignup() {
    document.getElementById('authTitle').textContent = "Create Account";
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('otpForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}

function showLoginForm() {
    document.getElementById('authTitle').textContent = "Welcome Back";
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('otpForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

function showVerificationField() {
    var role = document.getElementById('signupRole').value;
    var travelerField = document.getElementById('travelerVerification');
    var driverField = document.getElementById('driverVerification');
    var guideField = document.getElementById('guideVerification');
    
    travelerField.classList.add('hidden');
    driverField.classList.add('hidden');
    guideField.classList.add('hidden');
    
    if (role === 'traveler') {
        travelerField.classList.remove('hidden');
    } else if (role === 'driver') {
        driverField.classList.remove('hidden');
    } else if (role === 'guide') {
        guideField.classList.remove('hidden');
    }
}

// ─── LOGIN & SIGNUP HANDLERS ─────────────────────────────────
async function login() {
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Please fill in all fields!');
        return;
    }

    try {
        var data = await apiCall('POST', '/login', { email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        document.getElementById('loginPage').classList.add('hidden');
        showDashboard(data.user.role);
    } catch (err) {
        if (err.status === 403 && err.message === 'UNVERIFIED') {
            alert('Your account is not verified yet. We have sent a verification code to your email.');
            globalVerifyEmail = err.email;
            showOTPForm();
        } else {
            alert(err.message);
        }
    }
}

async function signup() {
    var name = document.getElementById('signupName').value.trim();
    var email = document.getElementById('signupEmail').value.trim();
    var phone = document.getElementById('signupPhone').value.trim();
    var password = document.getElementById('signupPassword').value;
    var confirmPassword = document.getElementById('signupConfirmPassword').value;
    var role = document.getElementById('signupRole').value;

    if (!name || !email || !phone || !password || password !== confirmPassword) {
        alert('Please fill in all fields correctly!');
        return;
    }

    if (role === 'traveler') {
        var travelerId = document.getElementById('signupTravelerId').value.trim();
        if (!travelerId) { alert('Please enter your ID number for verification!'); return; }
    }
    if (role === 'driver') {
        var drivingLicense = document.getElementById('signupDrivingLicense').value.trim();
        if (!drivingLicense) { alert('Please enter your Driving License number!'); return; }
    }
    if (role === 'guide') {
        var aadhar = document.getElementById('signupAadhar').value.trim();
        if (!aadhar) { alert('Please enter your Aadhar Card number!'); return; }
        var age = document.getElementById('signupAge').value;
        if (!age || age < 18) { alert('Please enter a valid age (18 or older)!'); return; }
    }
    if (password.length < 6) { alert('Password must be at least 6 characters!'); return; }

    try {
        var payload = {
            name, email, phone, password, role,
            traveler_id: document.getElementById('signupTravelerId') ? document.getElementById('signupTravelerId').value.trim() : '',
            traveler_id_type: document.getElementById('travelerIdType') ? document.getElementById('travelerIdType').value : '',
            driving_license: document.getElementById('signupDrivingLicense') ? document.getElementById('signupDrivingLicense').value.trim() : '',
            aadhar: document.getElementById('signupAadhar') ? document.getElementById('signupAadhar').value.trim() : '',
            age: document.getElementById('signupAge') ? document.getElementById('signupAge').value : '',
            emergency_contact: document.getElementById('signupEmergencyContact') ? document.getElementById('signupEmergencyContact').value.trim() : ''
        };

        var data = await apiCall('POST', '/signup', payload);
        alert('Account created successfully! An OTP has been sent to your email.');
        globalVerifyEmail = payload.email;
        showOTPForm();
    } catch (err) {
        alert(err.message);
    }
}

// ─── DASHBOARD & LOGOUT CONTROL ─────────────────────────────
function showDashboard(role) {
    var dashboards = ['travelerDashboard', 'driverDashboard', 'guideDashboard'];
    dashboards.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    
    if (role === 'traveler') {
        var travDash = document.getElementById('travelerDashboard');
        if (travDash) travDash.classList.remove('hidden');
        showTravelerTab('planTrip');
        if (typeof loadReviews === 'function') loadReviews();
    } else if (role === 'driver') {
        var drivDash = document.getElementById('driverDashboard');
        if (drivDash) drivDash.classList.remove('hidden');
        if (typeof loadDriverRideRequests === 'function') loadDriverRideRequests();
        if (typeof loadDriverStats === 'function') loadDriverStats();
    } else if (role === 'guide') {
        var guidDash = document.getElementById('guideDashboard');
        if (guidDash) guidDash.classList.remove('hidden');
    } else {
        var guidDash = document.getElementById('guideDashboard');
        if (guidDash) guidDash.classList.remove('hidden');
    }
    
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
}

// Show About Us page
function showAboutUs() {
    var pages = ['home', 'loginPage', 'travelerDashboard', 'driverDashboard', 'guideDashboard'];
    pages.forEach(function(id) {
        var element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
    var aboutEl = document.getElementById('aboutUs');
    if (aboutEl) aboutEl.classList.remove('hidden');
}

// Go back to home from About Us
function goBack() {
    var aboutEl = document.getElementById('aboutUs');
    if (aboutEl) aboutEl.classList.add('hidden');
    var homeEl = document.getElementById('home');
    if (homeEl) homeEl.classList.remove('hidden');
}

// Tab Navigation for Traveler Dashboard
function showTravelerTab(tabName) {
    var tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(function(content) {
        content.classList.add('hidden');
    });
    
    var tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    var activeContent = document.getElementById('tab-' + tabName);
    if (activeContent) activeContent.classList.remove('hidden');
    
    var buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(function(btn) {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
        }
    });

    if (tabName === 'travelPartner' && typeof loadTravelGroups === 'function') {
        loadTravelGroups();
    } else if (tabName === 'anonymousReports' && typeof loadAnonymousReports === 'function') {
        loadAnonymousReports();
    } else if (tabName === 'safeRoutes' && typeof loadDarkSpots === 'function') {
        loadDarkSpots();
    } else if (tabName === 'myBookings' && typeof loadTravelerMyBookings === 'function') {
        loadTravelerMyBookings();
    } else if (tabName === 'bookHotel' && typeof loadStays === 'function') {
        loadStays();
    } else if (tabName === 'bookCab' && typeof loadDrivers === 'function') {
        loadDrivers();
    } else if (tabName === 'travelGuide' && typeof loadGuides === 'function') {
        loadGuides();
    }
}

// Tab Navigation for Driver Dashboard
function showDriverTab(tabName) {
    var driverTabs = document.querySelectorAll('#driverDashboard .tab-content');
    driverTabs.forEach(function(content) {
        content.classList.add('hidden');
    });
    
    var driverButtons = document.querySelectorAll('#driverDashboard .tab-btn');
    driverButtons.forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    var activeContent = document.getElementById('driverTab-' + tabName);
    if (activeContent) activeContent.classList.remove('hidden');
    
    var buttons = document.querySelectorAll('#driverDashboard .tab-btn');
    buttons.forEach(function(btn) {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
        }
    });
}

// Tab Navigation for Guide Dashboard
function showGuideTab(tabName) {
    var guideTabs = document.querySelectorAll('#guideDashboard .tab-content');
    guideTabs.forEach(function(content) {
        content.classList.add('hidden');
    });
    
    var guideButtons = document.querySelectorAll('#guideDashboard .tab-btn');
    guideButtons.forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    var activeContent = document.getElementById('guideTab-' + tabName);
    if (activeContent) activeContent.classList.remove('hidden');
    
    var buttons = document.querySelectorAll('#guideDashboard .tab-btn');
    buttons.forEach(function(btn) {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('hasActiveRide');
    localStorage.removeItem('chatDriverName');
    if (typeof checkActiveRideChat === 'function') checkActiveRideChat();
    var dashboards = ['travelerDashboard', 'driverDashboard', 'guideDashboard', 'loginPage', 'home', 'aboutUs'];
    dashboards.forEach(function(id) {
        var element = document.getElementById(id);
        if (element) element.classList.add('hidden');
    });
    document.getElementById('home').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
}

function clearAllData() {
    if (confirm("Are you sure you want to clear all data? This will delete all accounts and reset the app.")) {
        localStorage.clear();
        alert("All data cleared! Please refresh the page.");
        location.reload();
    }
}

// ─── OTP FLOWS ──────────────────────────────────────────────
function showOTPForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('otpForm').classList.remove('hidden');
    document.getElementById('authTitle').textContent = 'Verify Your Email';
}

async function verifyOTP() {
    var otp = document.getElementById('otpCodeInput').value.trim();
    if (!otp || otp.length !== 6) {
        alert('Please enter a valid 6-digit code!');
        return;
    }

    try {
        var data = await apiCall('POST', '/verify-otp', {
            email: globalVerifyEmail,
            otp: otp
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        alert('Email verified successfully! Logging you in...');
        
        document.getElementById('otpCodeInput').value = '';
        document.getElementById('loginPage').classList.add('hidden');
        showDashboard(data.user.role);
    } catch (err) {
        alert('Verification failed: ' + err.message);
    }
}

async function resendOTP() {
    if (!globalVerifyEmail) {
        alert('No email session active. Please register or login.');
        return;
    }
    try {
        alert('Generating fresh verification OTP...');
        var res = await apiCall('POST', '/resend-otp', { email: globalVerifyEmail });
        alert(res.message);
    } catch (err) {
        alert('Failed to resend code: ' + err.message);
    }
}
