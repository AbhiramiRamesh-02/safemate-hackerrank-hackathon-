// Asynchronously mounts HTML partials into designated layout placeholders

const VIEW_PARTIALS = [
    { containerId: 'app-header', url: 'views/header.html' },
    { containerId: 'app-about', url: 'views/about.html' },
    { containerId: 'app-auth', url: 'views/auth.html' },
    { containerId: 'app-traveler', url: 'views/traveler.html' },
    { containerId: 'app-traveler-safety', url: 'views/travelerSafety.html' },
    { containerId: 'app-driver', url: 'views/driver.html' },
    { containerId: 'app-guide', url: 'views/guide.html' },
    { containerId: 'app-modals', url: 'views/modals.html' }
];

async function loadViewPartials() {
    try {
        const loadTasks = VIEW_PARTIALS.map(async ({ containerId, url }) => {
            const container = document.getElementById(containerId);
            if (!container) return;

            try {
                const response = await fetch(url);
                if (response.ok) {
                    container.innerHTML = await response.text();
                }
            } catch (err) {
                console.warn(`Could not load partial "${url}":`, err);
            }
        });

        await Promise.all(loadTasks);

        // Initialize state after mounting templates
        if (typeof checkLoginStatus === 'function') checkLoginStatus();
        if (typeof checkActiveRideChat === 'function') checkActiveRideChat();
        if (typeof displaySavedContacts === 'function') displaySavedContacts();

    } catch (err) {
        console.error('Failed to initialize view partials:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadViewPartials);
