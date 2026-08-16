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

const TAB_TITLES = {
    planTrip: '✈️ Plan Your Trip',
    bookCab: '🚖 Book Verified Cab',
    travelGuide: '🧭 Certified Tour Guides',
    bookHotel: '🏨 Hotels & Safe PGs',
    travelPartner: '👭 Cab Pooling & Travel Partners',
    myBookings: '📅 My Bookings & Rides',
    safeRoutes: '🗺️ Safe Routes & Dark Spot Map',
    nearbyToilets: '🚻 Restroom / Toilet Finder',
    anonymousReports: '📢 Anonymous Harassment Alerts',
    emergencyContact: '⚙️ SOS & Emergency Settings'
};

function handleTripPlanSelect(tabName) {
    if (!tabName) return;
    const safetyDropdown = document.getElementById('safetyAssistanceDropdown');
    if (safetyDropdown) safetyDropdown.value = '';
    showTravelerTab(tabName);
}

function handleSafetySelect(tabName) {
    if (!tabName) return;
    const tripDropdown = document.getElementById('travelPlanDropdown');
    if (tripDropdown) tripDropdown.value = '';
    showTravelerTab(tabName);
}

function showTravelerTab(tabName) {
    const contents = document.querySelectorAll('#travelerDashboard .tab-content');
    contents.forEach(el => el.classList.add('hidden'));
    
    document.getElementById(`tab-${tabName}`)?.classList.remove('hidden');

    const badge = document.getElementById('activeTabBadge');
    if (badge) {
        badge.textContent = `Active View: ${TAB_TITLES[tabName] || tabName}`;
    }

    const tripDropdown = document.getElementById('travelPlanDropdown');
    const safetyDropdown = document.getElementById('safetyAssistanceDropdown');

    const tripTabs = ['planTrip', 'bookCab', 'travelGuide', 'bookHotel', 'travelPartner', 'myBookings'];
    const safetyTabs = ['safeRoutes', 'nearbyToilets', 'anonymousReports', 'emergencyContact'];

    if (tripTabs.includes(tabName)) {
        if (tripDropdown) tripDropdown.value = tabName;
        if (safetyDropdown) safetyDropdown.value = '';
    } else if (safetyTabs.includes(tabName)) {
        if (safetyDropdown) safetyDropdown.value = tabName;
        if (tripDropdown) tripDropdown.value = '';
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
