const API_URL = 'http://localhost:5000/api';

// Auth variables
let currentUser = null;
let authToken = null;

// Load doctors on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDoctors();
    loadDoctorSelect();
    setupEventListeners();
    checkAuth();
    setupAuthListeners();
    initFeedback();
    
    // Check for saved email for appointments
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
        document.getElementById('viewAppointmentsEmail').value = savedEmail;
        viewAppointments();
    }
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('appointmentForm').addEventListener('submit', bookAppointment);
    document.getElementById('searchDoctor').addEventListener('input', searchDoctors);
    document.getElementById('notificationIcon').addEventListener('click', toggleNotifications);
    document.getElementById('closeNotifications').addEventListener('click', toggleNotifications);
    
    // Close modal on click
    document.querySelector('.close').onclick = () => {
        document.getElementById('messageModal').style.display = 'none';
    };
}

// Load all doctors
async function loadDoctors() {
    try {
        const response = await fetch(`${API_URL}/doctors`);
        const data = await response.json();
        
        if (data.success) {
            displayDoctors(data.doctors);
        } else {
            showMessage('Error loading doctors', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error connecting to server', 'error');
    }
}

// Display doctors
function displayDoctors(doctors) {
    const doctorsList = document.getElementById('doctorsList');
    doctorsList.innerHTML = doctors.map(doctor => `
        <div class="doctor-card" onclick="selectDoctor(${doctor.id})">
            <h3>${doctor.name}</h3>
            <p class="specialization"><i class="fas fa-stethoscope"></i> ${doctor.specialization}</p>
            <p><i class="fas fa-graduation-cap"></i> ${doctor.qualification}</p>
            <p><i class="fas fa-calendar-alt"></i> Available: ${doctor.available_days}</p>
            <p><i class="fas fa-clock"></i> ${doctor.available_time}</p>
            <p class="fee"><i class="fas fa-rupee-sign"></i> Fee: Rs. ${doctor.fee}</p>
            <p><i class="fas fa-phone"></i> ${doctor.contact}</p>
        </div>
    `).join('');
}

// Search doctors
function searchDoctors() {
    const searchTerm = document.getElementById('searchDoctor').value.toLowerCase();
    const cards = document.querySelectorAll('.doctor-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// Load doctor select dropdown
async function loadDoctorSelect() {
    try {
        const response = await fetch(`${API_URL}/doctors`);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('doctorId');
            select.innerHTML = '<option value="">Select Doctor</option>' + 
                data.doctors.map(doctor => `<option value="${doctor.id}">${doctor.name} - ${doctor.specialization} (Rs. ${doctor.fee})</option>`).join('');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Select doctor from card
function selectDoctor(doctorId) {
    document.getElementById('doctorId').value = doctorId;
    document.getElementById('appointment').scrollIntoView({ behavior: 'smooth' });
}

// Book appointment - UPDATED WITH LOGIN CHECK
async function bookAppointment(e) {
    e.preventDefault();
    
    // ✅ Check if user is logged in
    if (!currentUser) {
        showMessage('Please login to book an appointment', 'error');
        openLoginModal();
        return;
    }
    
    const appointmentData = {
        patient_name: document.getElementById('patientName').value,
        patient_email: document.getElementById('patientEmail').value,
        patient_phone: document.getElementById('patientPhone').value,
        doctor_id: document.getElementById('doctorId').value,
        appointment_date: document.getElementById('appointmentDate').value,
        appointment_time: document.getElementById('appointmentTime').value,
        symptoms: document.getElementById('symptoms').value
    };
    
    // Validation
    if (!appointmentData.patient_name || !appointmentData.patient_email || 
        !appointmentData.patient_phone || !appointmentData.doctor_id || 
        !appointmentData.appointment_date || !appointmentData.appointment_time) {
        showMessage('Please fill all required fields', 'error');
        return;
    }
    
    // Validate date
    const selectedDate = new Date(appointmentData.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showMessage('Please select a future date', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(appointmentData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message, 'success');
            document.getElementById('appointmentForm').reset();
            
            localStorage.setItem('userEmail', appointmentData.patient_email);
            loadNotifications(appointmentData.patient_email);
            
            setTimeout(() => {
                if (confirm('Appointment booked successfully! Would you like to view your appointments?')) {
                    document.getElementById('viewAppointmentsEmail').value = appointmentData.patient_email;
                    viewAppointments();
                }
            }, 500);
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error booking appointment. Please try again.', 'error');
    }
}

// View appointments
async function viewAppointments() {
    const email = document.getElementById('viewAppointmentsEmail').value;
    
    if (!email) {
        showMessage('Please enter your email address', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/appointments/user/${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (data.success && data.appointments.length > 0) {
            displayAppointments(data.appointments);
            localStorage.setItem('userEmail', email);
            loadNotifications(email);
        } else {
            document.getElementById('appointmentsList').innerHTML = '<p style="text-align:center;">No appointments found for this email</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error fetching appointments', 'error');
    }
}

// Display appointments
function displayAppointments(appointments) {
    const appointmentsList = document.getElementById('appointmentsList');
    
    appointmentsList.innerHTML = appointments.map(app => `
        <div class="appointment-card">
            <h3>Dr. ${app.doctor_name}</h3>
            <p><strong>Specialization:</strong> ${app.specialization}</p>
            <p><strong>Date:</strong> ${new Date(app.appointment_date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${app.appointment_time}</p>
            <p><strong>Status:</strong> <span class="status ${app.status}">${app.status.toUpperCase()}</span></p>
            ${app.symptoms ? `<p><strong>Symptoms:</strong> ${app.symptoms}</p>` : ''}
            ${app.status !== 'cancelled' && app.status !== 'completed' ? 
                `<button class="cancel-btn" onclick="cancelAppointment(${app.id})">Cancel Appointment</button>` : ''}
        </div>
    `).join('');
}

// Cancel appointment
async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
        const response = await fetch(`${API_URL}/appointments/cancel/${appointmentId}`, {
            method: 'PUT'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message, 'success');
            viewAppointments();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error cancelling appointment', 'error');
    }
}

// Load notifications
async function loadNotifications(email) {
    if (!email) return;
    
    try {
        const response = await fetch(`${API_URL}/notifications/${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (data.success) {
            displayNotifications(data.notifications);
            
            const unreadResponse = await fetch(`${API_URL}/notifications/unread/${encodeURIComponent(email)}`);
            const unreadData = await unreadResponse.json();
            
            if (unreadData.success) {
                const badge = document.getElementById('notificationBadge');
                badge.textContent = unreadData.unread_count;
                badge.style.display = unreadData.unread_count > 0 ? 'inline-block' : 'none';
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Display notifications
function displayNotifications(notifications) {
    const notificationsList = document.getElementById('notificationsList');
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p style="text-align:center; padding:20px;">No notifications</p>';
        return;
    }
    
    notificationsList.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.is_read ? '' : 'unread'}" onclick="markNotificationRead(${notif.id})">
            <p>${notif.message}</p>
            <small>${new Date(notif.created_at).toLocaleString()}</small>
        </div>
    `).join('');
}

// Mark notification as read
async function markNotificationRead(notificationId) {
    try {
        await fetch(`${API_URL}/notifications/read/${notificationId}`, {
            method: 'PUT'
        });
        
        const email = localStorage.getItem('userEmail');
        if (email) loadNotifications(email);
    } catch (error) {
        console.error('Error marking notification:', error);
    }
}

// Toggle notification panel
function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('active');
}

// Show message modal
function showMessage(message, type) {
    const modal = document.getElementById('messageModal');
    const modalMessage = document.getElementById('modalMessage');
    
    modalMessage.textContent = message;
    modalMessage.style.color = type === 'error' ? '#d63031' : '#00b894';
    modal.style.display = 'block';
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('messageModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Load doctors for feedback dropdown
async function loadDoctorsForFeedback() {
    try {
        const response = await fetch(`${API_URL}/doctors`);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('feedbackDoctorId');
            select.innerHTML = '<option value="">Select Doctor</option>' + 
                data.doctors.map(doctor => `<option value="${doctor.id}">${doctor.name} - ${doctor.specialization}</option>`).join('');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Star rating system
function setupStarRatings() {
    const ratingStars = document.querySelectorAll('.rating-stars i');
    ratingStars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            document.getElementById('rating').value = rating;
            
            ratingStars.forEach(s => s.classList.remove('active'));
            for(let i = 0; i < rating; i++) {
                ratingStars[i].classList.add('active');
            }
        });
    });
    
    const behaviourStars = document.querySelectorAll('.behaviour-stars i');
    behaviourStars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-behaviour');
            document.getElementById('behaviourRating').value = rating;
            
            behaviourStars.forEach(s => s.classList.remove('active'));
            for(let i = 0; i < rating; i++) {
                behaviourStars[i].classList.add('active');
            }
        });
    });
}

// Submit feedback
async function submitFeedback(e) {
    e.preventDefault();
    
    const feedbackData = {
        patient_name: document.getElementById('feedbackPatientName').value,
        patient_email: document.getElementById('feedbackPatientEmail').value,
        doctor_id: document.getElementById('feedbackDoctorId').value,
        rating: document.getElementById('rating').value,
        behaviour_rating: document.getElementById('behaviourRating').value,
        treatment_experience: document.getElementById('treatmentExperience').value,
        comment: document.getElementById('feedbackComment').value,
        recommend: document.getElementById('recommend').checked
    };
    
    if (!feedbackData.patient_name || !feedbackData.patient_email || 
        !feedbackData.doctor_id || !feedbackData.rating || !feedbackData.behaviour_rating) {
        showMessage('Please fill all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message, 'success');
            document.getElementById('feedbackForm').reset();
            document.querySelectorAll('.rating-stars i, .behaviour-stars i').forEach(star => {
                star.classList.remove('active');
            });
            loadRecentFeedback();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error submitting feedback', 'error');
    }
}

// Load recent feedback
async function loadRecentFeedback() {
    try {
        const response = await fetch(`${API_URL}/feedback/all`);
        const data = await response.json();
        
        if (data.success && data.feedback.length > 0) {
            displayRecentFeedback(data.feedback);
        } else {
            document.getElementById('recentFeedbackList').innerHTML = '<p>No feedback yet. Be the first to review!</p>';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Display recent feedback
function displayRecentFeedback(feedback) {
    const feedbackList = document.getElementById('recentFeedbackList');
    
    feedbackList.innerHTML = feedback.slice(0, 5).map(fb => `
        <div class="feedback-card">
            <div class="patient-name">${fb.patient_name}</div>
            <div class="doctor-name">Dr. ${fb.doctor_name}</div>
            <div class="rating">
                ${'★'.repeat(fb.rating)}${'☆'.repeat(5-fb.rating)} (${fb.rating}/5)
            </div>
            <div class="behaviour">
                Behaviour: ${'★'.repeat(fb.behaviour_rating)}${'☆'.repeat(5-fb.behaviour_rating)}
            </div>
            ${fb.treatment_experience ? `<p class="treatment"><strong>Experience:</strong> ${fb.treatment_experience}</p>` : ''}
            ${fb.comment ? `<p class="comment">"${fb.comment}"</p>` : ''}
            <div class="date">${new Date(fb.created_at).toLocaleDateString()}</div>
        </div>
    `).join('');
}

// Load doctor ratings on doctor cards
async function loadDoctorRatings() {
    const doctors = document.querySelectorAll('.doctor-card');
    for(let doctor of doctors) {
        const doctorId = doctor.getAttribute('data-doctor-id');
        if(doctorId) {
            try {
                const response = await fetch(`${API_URL}/feedback/rating/${doctorId}`);
                const data = await response.json();
                if(data.success && data.rating.avg_rating) {
                    const ratingDiv = doctor.querySelector('.doctor-rating');
                    if(ratingDiv) {
                        ratingDiv.innerHTML = `⭐ ${data.rating.avg_rating.toFixed(1)}/5 (${data.rating.total_reviews} reviews)`;
                    }
                }
            } catch(error) {
                console.error('Error loading rating:', error);
            }
        }
    }
}

// Update doctor cards to show ratings
function updateDoctorCardsWithRatings() {
    const displayDoctorsFunction = window.displayDoctors;
    window.displayDoctors = function(doctors) {
        displayDoctorsFunction(doctors);
        doctors.forEach(doctor => {
            const card = document.querySelector(`.doctor-card[data-doctor-id="${doctor.id}"]`);
            if(card) {
                card.setAttribute('data-doctor-id', doctor.id);
                if(!card.querySelector('.doctor-rating')) {
                    const feeElement = card.querySelector('.fee');
                    const ratingSpan = document.createElement('div');
                    ratingSpan.className = 'doctor-rating';
                    ratingSpan.style.marginTop = '5px';
                    ratingSpan.style.fontSize = '0.9rem';
                    ratingSpan.style.color = '#ffc107';
                    feeElement.insertAdjacentElement('afterend', ratingSpan);
                }
            }
        });
        loadDoctorRatings();
    };
}

// Initialize feedback system
function initFeedback() {
    loadDoctorsForFeedback();
    setupStarRatings();
    loadRecentFeedback();
    updateDoctorCardsWithRatings();
    
    const feedbackForm = document.getElementById('feedbackForm');
    if(feedbackForm) {
        feedbackForm.addEventListener('submit', submitFeedback);
    }
}

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        updateUIForLoggedInUser();
    }
}

// Update UI after login
function updateUIForLoggedInUser() {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('registerBtn').style.display = 'none';
    document.getElementById('userMenu').style.display = 'flex';
    document.getElementById('userName').textContent = `Welcome, ${currentUser.name}`;
}

// Update UI after logout
function updateUIForLoggedOutUser() {
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('registerBtn').style.display = 'block';
    document.getElementById('userMenu').style.display = 'none';
    currentUser = null;
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
}

// Login function
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            closeModals();
            showMessage('Login successful! Welcome back!', 'success');
            
            document.getElementById('patientEmail').value = currentUser.email;
            document.getElementById('feedbackPatientEmail').value = currentUser.email;
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error logging in', 'error');
    }
}

// Register function
async function register(name, email, password, phone) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            closeModals();
            showMessage('Registration successful! Welcome to Medi-Care!', 'success');
            
            document.getElementById('patientEmail').value = currentUser.email;
            document.getElementById('feedbackPatientEmail').value = currentUser.email;
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error registering user', 'error');
    }
}

// Logout function
function logout() {
    updateUIForLoggedOutUser();
    showMessage('Logged out successfully', 'success');
}

// Modal functions
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function openRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function closeModals() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('registerModal').style.display = 'none';
}

// Setup auth event listeners
function setupAuthListeners() {
    document.getElementById('loginBtn').addEventListener('click', openLoginModal);
    document.getElementById('registerBtn').addEventListener('click', openRegisterModal);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        login(email, password);
    });
    
    document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const phone = document.getElementById('regPhone').value;
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        register(name, email, password, phone);
    });
    
    document.getElementById('switchToRegister').addEventListener('click', (e) => {
        e.preventDefault();
        closeModals();
        openRegisterModal();
    });
    
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        closeModals();
        openLoginModal();
    });
    
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}