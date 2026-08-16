// Verified reviews and traveler feedback controller

let currentBookingTour = "";
let currentBookingGuide = "";
let currentBookingDestination = "";

// Loads community reviews for travel guides and stays
async function loadReviews() {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    try {
        const reviews = await apiCall('GET', '/reviews');
        if (!reviews.length) {
            container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">No reviews yet. Be the first to share your experience!</p>';
            return;
        }

        container.innerHTML = reviews.map(r => `
            <div class="review-card">
                <h4>Rating: ${r.rating}</h4>
                <p>"${r.text}"</p>
                <small>- ${r.reviewer_name} (${r.service})</small>
            </div>
        `).join('');
    } catch {
        container.innerHTML = '<p style="color:#666;text-align:center;padding:15px;">Could not load reviews.</p>';
    }
}

// Submits a review linked to a completed booking
async function submitBookingReview() {
    const rating = document.getElementById('bookingReviewRating')?.value || '5/5';
    const textInput = document.getElementById('bookingReviewText');
    const text = textInput?.value.trim();

    if (!text) {
        alert('Please share your thoughts before submitting.');
        return;
    }

    try {
        await apiCall('POST', '/reviews', {
            text,
            service: `Travel Guide - ${currentBookingTour || 'General Tour'}`,
            rating
        });

        alert('Thank you! Your verified review has been published.');
        if (textInput) textInput.value = '';
        closeBookingDetails();
        loadReviews();
    } catch (err) {
        alert(err.message || 'Could not submit review.');
    }
}

// Displays modal for a specific booking and allows writing a review
function viewBookingDetails(tour, locations, date, duration, price, guide, destination) {
    currentBookingTour = tour;
    currentBookingGuide = guide;
    currentBookingDestination = destination;
    
    document.getElementById('bookingDetailTitle').textContent = tour;
    document.getElementById('bookingDetailTour').textContent = tour;
    document.getElementById('bookingDetailLocations').textContent = locations;
    document.getElementById('bookingDetailDate').textContent = date;
    document.getElementById('bookingDetailDuration').textContent = duration;
    document.getElementById('bookingDetailPrice').textContent = price;
    document.getElementById('bookingDetailGuide').textContent = guide;
    
    const ratingEl = document.getElementById('bookingReviewRating');
    if (ratingEl) ratingEl.value = '⭐⭐⭐⭐⭐ Excellent';
    
    const textEl = document.getElementById('bookingReviewText');
    if (textEl) textEl.value = '';
    
    const modal = document.getElementById('bookingDetailsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeBookingDetails() {
    const modal = document.getElementById('bookingDetailsModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}
