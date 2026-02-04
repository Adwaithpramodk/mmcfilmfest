// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
// Replace with your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBNhj01ayS-nvyFTrvZ1I_Z_UMfAjIiwiU",
    authDomain: "cinebook-12.firebaseapp.com",
    projectId: "cinebook-12",
    storageBucket: "cinebook-12.firebasestorage.app",
    messagingSenderId: "38045061588",
    appId: "1:38045061588:web:9da4e03d0e1f91e3570641"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================
// STATE MANAGEMENT
// ==========================================
const state = {
    selectedSeats: [],
    occupiedSeats: [],
    currentShowtime: '4:45 PM'
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const elements = {
    heroSection: document.getElementById('heroSection'),
    bookingSection: document.getElementById('bookingSection'),
    bookNowBtn: document.getElementById('bookNowBtn'),
    backBtn: document.getElementById('backBtn'),
    seatingChart: document.getElementById('seatingChart'),
    bookingForm: document.getElementById('bookingForm'),
    selectedSeatsDisplay: document.getElementById('selectedSeatsDisplay'),
    totalSeatsCount: document.getElementById('totalSeatsCount'),
    numberOfSeatsInput: document.getElementById('numberOfSeats'),
    successModal: document.getElementById('successModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    currentDate: document.getElementById('currentDate'),
    currentTime: document.getElementById('currentTime'),
    showtimeSelect: document.getElementById('showtimeSelect'),
    bookingDetails: document.getElementById('bookingDetails'),
    movieBanner: document.getElementById('movieBanner')
};

// ==========================================
// INITIALIZATION
// ==========================================
function init() {
    setStaticTime();
    generateSeatingChart();
    loadOccupiedSeats();
    attachEventListeners();
    setDefaultBanner();
}

// ==========================================
// DATE & TIME (STATIC)
// ==========================================
function setStaticTime() {
    const now = new Date();

    // Format date
    // const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    // const formattedDate = now.toLocaleDateString('en-US', options);
    const formattedDate = 'Thursday, February 5, 2026';
    elements.currentDate.textContent = formattedDate;

    // Set static time (showtime)
    const showtime = '2:00 PM';
    elements.currentTime.textContent = showtime;
}

// ==========================================
// BANNER IMAGE
// ==========================================
function setDefaultBanner() {
    // Use the banner image defined in HTML
    // elements.movieBanner.src = '...'; 
    elements.movieBanner.alt = 'Premam';
}

// ==========================================
// SEATING CHART
// ==========================================
function generateSeatingChart() {
    // 10 Rows (A-J) to accommodate more seats
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const seatsPerRow = 13; // 13 seats per row * 10 rows = 130 seats

    elements.seatingChart.innerHTML = '';

    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'seat-row';

        // Add row label
        const label = document.createElement('div');
        label.className = 'row-label';
        label.textContent = row;
        rowDiv.appendChild(label);

        // Add seats
        for (let i = 1; i <= seatsPerRow; i++) {
            // Add aisle space in the middle (between 6 and 7, slightly off-center but functional)
            // Spacer removed for symmetrical 13-seat layout

            const seat = document.createElement('div');
            seat.className = 'seat available';
            seat.dataset.seat = `${row}${i}`;
            seat.textContent = i; // Add seat number inside for better visibility
            seat.title = `Seat ${row}${i}`;

            seat.addEventListener('click', () => handleSeatClick(seat));

            rowDiv.appendChild(seat);
        }

        elements.seatingChart.appendChild(rowDiv);
    });
}

// ==========================================
// SEAT SELECTION
// ==========================================
function handleSeatClick(seat) {
    const seatId = seat.dataset.seat;

    if (seat.classList.contains('occupied')) {
        return; // Can't select occupied seats
    }

    if (seat.classList.contains('selected')) {
        // Deselect seat
        seat.classList.remove('selected');
        seat.classList.add('available');
        state.selectedSeats = state.selectedSeats.filter(s => s !== seatId);
    } else {
        // limit check
        if (state.selectedSeats.length >= 5) {
            alert('You can only book up to 5 seats at a time.');
            return;
        }

        // Select seat
        seat.classList.remove('available');
        seat.classList.add('selected');
        state.selectedSeats.push(seatId);
    }

    updateSelectionSummary();
}

function updateSelectionSummary() {
    if (state.selectedSeats.length === 0) {
        elements.selectedSeatsDisplay.textContent = 'None';
        elements.totalSeatsCount.textContent = '0';
        elements.numberOfSeatsInput.value = '';
    } else {
        elements.selectedSeatsDisplay.textContent = state.selectedSeats.join(', ');
        elements.totalSeatsCount.textContent = state.selectedSeats.length;
        elements.numberOfSeatsInput.value = state.selectedSeats.length;
    }
}

// ==========================================
// LOAD OCCUPIED SEATS (REAL-TIME)
// ==========================================
// Listener for real-time updates
let unsubscribe = null;

function loadOccupiedSeats() {
    // Unsubscribe from previous listener if exists
    if (unsubscribe) {
        unsubscribe();
    }

    const showId = getShowDocId();
    const showRef = db.collection('shows').doc(showId);

    // Listen for real-time updates on the specific show document
    elements.seatingChart.classList.add('loading'); // Show loading state

    unsubscribe = showRef.onSnapshot((doc) => {
        elements.seatingChart.classList.remove('loading'); // Hide loading state
        state.occupiedSeats = []; // Reset local state

        if (doc.exists) {
            const data = doc.data();
            if (data.occupied && Array.isArray(data.occupied)) {
                state.occupiedSeats = data.occupied;
            }
        }

        // Update UI immediately
        updateSeatVisuals();
    }, (error) => {
        console.error("Error listening to seat updates:", error);
        // Fallback or retry logic could come here
    });
}

function updateSeatVisuals() {
    document.querySelectorAll('.seat').forEach(seat => {
        const seatId = seat.dataset.seat;
        // Reset classes FIRST to base state
        seat.classList.remove('occupied', 'selected');
        seat.classList.add('available');

        // Re-apply occupied status
        if (state.occupiedSeats.includes(seatId)) {
            seat.classList.remove('available');
            seat.classList.add('occupied');
        }

        // Re-apply selection status (if user had it selected)
        if (state.selectedSeats.includes(seatId)) {
            if (state.occupiedSeats.includes(seatId)) {
                // If it became occupied while selected, deselect it
                state.selectedSeats = state.selectedSeats.filter(s => s !== seatId);
                updateSelectionSummary();
            } else {
                seat.classList.remove('available');
                seat.classList.add('selected');
            }
        }
    });
}

function getShowDocId() {
    // Generate a unique ID for the show based on Date and Time
    // e.g., SHOW_Feb-05-2026_730PM
    const dateStr = 'Feb-05-2026'; // Fixed date
    // Use current value or default
    const showtime = elements.showtimeSelect ? elements.showtimeSelect.value : '7:30 PM';
    // Remove spaces and special chars
    const sanitizedTime = showtime.replace(/[^a-zA-Z0-9]/g, '');
    return `SHOW_${dateStr}_${sanitizedTime}`;
}

// ==========================================
// NAVIGATION
// ==========================================
function showBookingSection() {
    elements.heroSection.style.display = 'none';
    elements.bookingSection.classList.add('active');
    window.scrollTo(0, 0);
}

function showHeroSection() {
    elements.bookingSection.classList.remove('active');
    setTimeout(() => {
        elements.bookingSection.style.display = 'none';
        elements.heroSection.style.display = 'flex';
    }, 300);

    // Reset selections
    state.selectedSeats = [];
    document.querySelectorAll('.seat.selected').forEach(seat => {
        seat.classList.remove('selected');
        seat.classList.add('available');
    });
    updateSelectionSummary();
    elements.bookingForm.reset();
}

// ==========================================
// FORM SUBMISSION (WITH TRANSACTION)
// ==========================================
async function handleBookingSubmit(e) {
    e.preventDefault();

    // Validation
    if (state.selectedSeats.length === 0) {
        alert('Please select at least one seat');
        return;
    }

    const formData = new FormData(elements.bookingForm);
    const bookingData = {
        name: formData.get('customerName'),
        department: formData.get('department'),
        numberOfSeats: parseInt(formData.get('numberOfSeats')),
        email: formData.get('email') || 'N/A',
        phone: formData.get('phone') || 'N/A',
        seats: [...state.selectedSeats],
        showtime: elements.showtimeSelect ? elements.showtimeSelect.value : '7:30 PM',
        bookedTime: new Date().toLocaleTimeString('en-US'),
        date: 'February 5, 2026',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        bookingId: generateBookingId()
    };

    if (bookingData.numberOfSeats !== state.selectedSeats.length) {
        alert('Number of seats must match your selection');
        return;
    }

    elements.loadingOverlay.classList.add('active');

    const showId = getShowDocId();
    const showRef = db.collection('shows').doc(showId);
    const newBookingRef = db.collection('bookings').doc();

    try {
        // Run a Transaction to ensure atomic booking and conflict resolution
        await db.runTransaction(async (transaction) => {
            const showDoc = await transaction.get(showRef);
            let currentOccupied = [];

            if (showDoc.exists) {
                currentOccupied = showDoc.data().occupied || [];
            }

            // check for conflicts
            const conflicts = state.selectedSeats.filter(seat => currentOccupied.includes(seat));
            if (conflicts.length > 0) {
                throw new Error(`Optimistic Error: Seats ${conflicts.join(', ')} were just taken!`);
            }

            // No conflict: Create new occupied list
            const newOccupiedList = [...currentOccupied, ...state.selectedSeats];

            // Update Show Document (Seat Map)
            transaction.set(showRef, { occupied: newOccupiedList }, { merge: true });

            // Create Booking Record
            transaction.set(newBookingRef, bookingData);
        });

        // Transaction Success
        elements.loadingOverlay.classList.remove('active');
        showSuccessModal(bookingData);

        // Reset form
        state.selectedSeats = [];
        updateSelectionSummary();
        elements.bookingForm.reset();

    } catch (error) {
        console.error('Booking failed:', error);
        elements.loadingOverlay.classList.remove('active');

        if (error.message.includes("Optimistic Error")) {
            alert('Sorry! One or more of your selected seats were just booked by someone else. Please select different seats.');
        } else {
            alert('Failed to complete booking. Please try again.');
        }
    }
}

// ==========================================
// SUCCESS MODAL
// ==========================================
function showSuccessModal(bookingData) {
    elements.bookingDetails.innerHTML = `
        <div class="detail-row" style="text-align: center; margin-bottom: 1rem; color: var(--accent-color); font-weight: bold;">
            Please take a screenshot of this pass to enter the film fest! 📸
        </div>
        <div class="detail-row">
            <span class="detail-label">Booking ID:</span>
            <span class="detail-value">${bookingData.bookingId}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Booking Time:</span>
            <span class="detail-value">${bookingData.bookedTime}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${bookingData.name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Department:</span>
            <span class="detail-value">${bookingData.department}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Seats:</span>
            <span class="detail-value">${bookingData.seats.join(', ')}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${bookingData.date}</span>
        </div>
    `;

    elements.successModal.classList.add('active');
}

function hideSuccessModal() {
    elements.successModal.classList.remove('active');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function generateBookingId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `BK-${timestamp}-${random}`.toUpperCase();
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function attachEventListeners() {
    elements.bookNowBtn.addEventListener('click', showBookingSection);
    elements.backBtn.addEventListener('click', showHeroSection);
    elements.bookingForm.addEventListener('submit', handleBookingSubmit);
    elements.closeModalBtn.addEventListener('click', () => {
        hideSuccessModal();
        showHeroSection();
    });

    // Reload occupied seats when showtime changes (if selector exists)
    if (elements.showtimeSelect) {
        elements.showtimeSelect.addEventListener('change', (e) => {
            state.currentShowtime = e.target.value;
            loadOccupiedSeats();
        });
    }

    // Close modal on overlay click
    elements.successModal.addEventListener('click', (e) => {
        if (e.target === elements.successModal) {
            hideSuccessModal();
            showHeroSection();
        }
    });
}

// ==========================================
// START APPLICATION
// ==========================================
document.addEventListener('DOMContentLoaded', init);
