
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE = isLocal ? 'http://localhost:3001/api' : '/api';

async function apiCall(method, endpoint, payload = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    
    if (token) {
        headers['Authorization'] = token;
    }

    const config = {
        method,
        headers,
        ...(payload ? { body: JSON.stringify(payload) } : {})
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(data.error || 'Server request failed');
        error.status = response.status;
        error.email = data.email;
        throw error;
    }

    return data;
}

function getCurrentUser() {
    try {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}
