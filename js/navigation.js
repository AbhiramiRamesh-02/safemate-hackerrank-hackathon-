
function showHome() {
    const screens = ['loginPage', 'travelerDashboard', 'driverDashboard', 'guideDashboard', 'aboutUs'];
    screens.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    document.getElementById('home')?.classList.remove('hidden');
}

function showLogin(role) {
    currentRole = role;
    
    document.getElementById('home')?.classList.add('hidden');
    document.getElementById('loginPage')?.classList.remove('hidden');
    
    const signupRoleEl = document.getElementById('signupRole');
    if (signupRoleEl) signupRoleEl.value = role;
    
    showVerificationField();
    showLoginForm();
}

function showSignup() {
    const authTitle = document.getElementById('authTitle');
    if (authTitle) authTitle.textContent = 'Create Account';
    
    document.getElementById('loginForm')?.classList.add('hidden');
    document.getElementById('otpForm')?.classList.add('hidden');
    document.getElementById('signupForm')?.classList.remove('hidden');
}

function showLoginForm() {
    const authTitle = document.getElementById('authTitle');
    if (authTitle) authTitle.textContent = 'Welcome Back';
    
    document.getElementById('signupForm')?.classList.add('hidden');
    document.getElementById('otpForm')?.classList.add('hidden');
    document.getElementById('loginForm')?.classList.remove('hidden');
}

function showDashboard(role) {
    const views = ['travelerDashboard', 'driverDashboard', 'guideDashboard', 'home', 'loginPage', 'aboutUs'];
    views.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    
    const user = getCurrentUser();
    const fallbackName = role === 'traveler' ? 'Traveler' : (role === 'driver' ? 'Driver' : 'Guide');
    const displayName = user?.name || fallbackName;
    
    ['travelerUserName', 'driverUserName', 'guideUserName'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = displayName;
    });
    
    if (role === 'traveler') {
        document.getElementById('travelerDashboard')?.classList.remove('hidden');
        showTravelerTab('planTrip');
        if (typeof loadReviews === 'function') loadReviews();
    } else if (role === 'driver') {
        document.getElementById('driverDashboard')?.classList.remove('hidden');
        if (typeof loadDriverRideRequests === 'function') loadDriverRideRequests();
        if (typeof loadDriverStats === 'function') loadDriverStats();
        if (typeof loadDriverAcceptedRides === 'function') loadDriverAcceptedRides();
    } else if (role === 'guide') {
        document.getElementById('guideDashboard')?.classList.remove('hidden');
        if (typeof loadGuideBookings === 'function') loadGuideBookings();
    }
    
    document.getElementById('logoutBtn')?.classList.remove('hidden');
}

function showAboutUs() {
    const views = ['home', 'loginPage', 'travelerDashboard', 'driverDashboard', 'guideDashboard'];
    views.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    document.getElementById('aboutUs')?.classList.remove('hidden');
}

function goBack() {
    document.getElementById('aboutUs')?.classList.add('hidden');
    document.getElementById('home')?.classList.remove('hidden');
}

function showTravelerTab(tabName) {
    const contents = document.querySelectorAll('#travelerDashboard .tab-content');
    contents.forEach(el => el.classList.add('hidden'));
    
    const buttons = document.querySelectorAll('#travelerDashboard .tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick')?.includes(tabName)) {
            btn.classList.add('active');
        }
    });
    
    document.getElementById(`tab-${tabName}`)?.classList.remove('hidden');

    const dropdown = document.getElementById('travelerServiceDropdown');
    if (dropdown && dropdown.value !== tabName) {
        dropdown.value = tabName;
    }

    const tabActions = {
        travelPartner: loadTravelGroups,
        anonymousReports: loadAnonymousReports,
        safeRoutes: loadDarkSpots,
        myBookings: loadTravelerMyBookings,
        bookHotel: loadStays,
        bookCab: loadAvailableDrivers,
        travelGuide: loadAvailableGuides
    };

    const action = tabActions[tabName];
    if (typeof action === 'function') {
        action();
    }
}

function showDriverTab(tabName) {
    const tabs = document.querySelectorAll('#driverDashboard .tab-content');
    tabs.forEach(el => el.classList.add('hidden'));
    
    const buttons = document.querySelectorAll('#driverDashboard .tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick')?.includes(tabName)) {
            btn.classList.add('active');
        }
    });
    
    document.getElementById(`driverTab-${tabName}`)?.classList.remove('hidden');
}

function showGuideTab(tabName) {
    const tabs = document.querySelectorAll('#guideDashboard .tab-content');
    tabs.forEach(el => el.classList.add('hidden'));
    
    const buttons = document.querySelectorAll('#guideDashboard .tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick')?.includes(tabName)) {
            btn.classList.add('active');
        }
    });
    
    document.getElementById(`guideTab-${tabName}`)?.classList.remove('hidden');

    if (tabName === 'myBookings' && typeof loadGuideAcceptedBookings === 'function') {
        loadGuideAcceptedBookings();
    } else if (tabName === 'bookingRequests' && typeof loadGuideBookings === 'function') {
        loadGuideBookings();
    }
}
