const API_URL = "http://localhost:3000";
let token = null;
let refreshTokenStored = null;
let socket = null;

// UI Selection
const logs = document.getElementById('log-container');
const statusToken = document.getElementById('status-token');
const socketBadge = document.getElementById('socket-badge');
const pageTitle = document.getElementById('page-title');

// Page Navigation
function showPage(pageId, el) {
    const titles = {
        'auth': 'Authentication & Gateway',
        'ride': 'Ride Management Center',
        'profile': 'Account & Profile',
        'admin': 'Backend Data Explorer'
    };
    if (pageTitle) pageTitle.textContent = titles[pageId] || 'Dashboard';

    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');
}

// Role toggle logic
document.getElementById('role').addEventListener('change', (e) => {
    const isDriver = e.target.value === 'driver';
    document.getElementById('driver-fields').classList.toggle('hidden', !isDriver);
});

// Logging
function log(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-type-${type}`;
    const time = new Date().toLocaleTimeString();
    
    if (typeof message === 'object') {
        message = JSON.stringify(message, null, 2);
    }
    
    entry.innerHTML = `<span class="log-time">${time}</span><br>${message}`;
    logs.appendChild(entry);
    logs.scrollTop = logs.scrollHeight;
}

function clearLogs() { logs.innerHTML = ''; }

// Mock GPS Utility
function generateMockGPS() {
    const lat = (30.0 + Math.random() * 0.1).toFixed(6);
    const lng = (31.2 + Math.random() * 0.1).toFixed(6);
    const tr_lat = (30.0 + Math.random() * 0.1).toFixed(6);
    const tr_lng = (31.2 + Math.random() * 0.1).toFixed(6);

    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;
    document.getElementById('tr-lat').value = tr_lat;
    document.getElementById('tr-lng').value = tr_lng;
    
    log(`✨ Mock GPS generated for Cairo: ${lat}, ${lng}`, 'success');
}

// HTTP Helper
async function apiCall(endpoint, method, body, options = {}) {
    const { isMultipart = false } = options;
    try {
        let headers = { ...(token && { 'accesstoken': token }) };
        let fetchBody;

        if (body && isMultipart) {
            fetchBody = new FormData();
            for (const key in body) {
                if (body[key] instanceof FileList) fetchBody.append(key, body[key][0]);
                else fetchBody.append(key, body[key]);
            }
        } else if (body) {
            headers['Content-Type'] = 'application/json';
            fetchBody = JSON.stringify(body);
        }

        log(`${method} ${endpoint}`, 'info');
        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: method === 'GET' ? null : fetchBody
        });
        
        const data = await res.json();
        if (res.ok && data.success !== false) {
            log(`Response: ${JSON.stringify(data)}`, 'success');
            return data;
        } else {
            log(`Backend Error: ${data.Message || data.err || JSON.stringify(data)}`, 'error');
            return null;
        }
    } catch (err) {
        log(`System Error: ${err.message}`, 'error');
        return null;
    }
}

// --- Auth ---
async function register() {
    const role = document.getElementById('role').value;
    const body = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        role
    };
    if (role === 'driver') {
        body.NationalId = document.getElementById('nationalId').value;
        body.carNo = document.getElementById('carNo').value;
        await apiCall('/auth/signUpDriver', 'POST', body);
    } else {
        await apiCall('/auth/signUpUser', 'POST', body);
    }
}

async function login() {
    const body = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };
    const data = await apiCall('/auth/signIn', 'POST', body);
    if (data && data.Tokens) {
        token = data.Tokens.accessToken;
        refreshTokenStored = data.Tokens.refreshToken;
        statusToken.value = token.substring(0, 30) + "...";
        log("Access Token granted and stored.", "success");
    }
}

async function verifyEmail() {
    const body = { email: document.getElementById('email').value, otp: document.getElementById('otp').value };
    await apiCall('/auth/verifyEmail', 'PATCH', body);
}

async function resendOtp() {
    await apiCall('/auth/sendEmailVerification', 'POST', { email: document.getElementById('email').value });
}

async function logout() {
    await apiCall('/auth/logout', 'POST', {});
    token = null; statusToken.value = "";
}

async function logoutAll() {
    await apiCall('/auth/logoutAllDevices', 'PATCH', {});
}

async function refreshToken() {
    if (!refreshTokenStored) return log("No refresh token found", "error");
    const res = await fetch(`${API_URL}/auth/retakeAccessToken`, {
        method: 'POST', headers: { 'refreshtoken': refreshTokenStored }
    });
    const data = await res.json();
    if (data && data.accessToken) {
        token = data.accessToken;
        statusToken.value = token.substring(0, 30) + "...";
        log("Token refreshed successfully", "success");
    }
}

// --- Profile ---
async function getProfile() {
    const data = await apiCall('/user/profile', 'GET');
    if (data && data.data) {
        document.getElementById('upd-name').value = data.data.name || "";
        document.getElementById('upd-phone').value = data.data.phoneNumber || "";
        log("Profile data synced to form", "info");
    }
}

async function updateProfile() {
    const body = { name: document.getElementById('upd-name').value, phoneNumber: document.getElementById('upd-phone').value };
    await apiCall('/user/', 'PATCH', body);
}

async function updateProfilePic() {
    const fileInput = document.getElementById('upd-pic');
    if (!fileInput.files[0]) return log("Select a picture first", "error");
    await apiCall('/user/update-profilePic', 'PATCH', { img: fileInput.files }, { isMultipart: true });
}

async function deleteAccount() {
    if (confirm("Permanently delete account?")) await apiCall('/user/', 'DELETE');
}

// --- Admin ---
async function fetchData(endpoint) { 
    if (endpoint === '/trips/user') endpoint = '/trips/userFeedbacks'; 
    await apiCall(endpoint, 'GET'); 
}

async function submitFeedback() {
    const body = {
        trip_id: parseInt(document.getElementById('f-trip-id').value),
        uContent: document.getElementById('f-content').value,
        uRating: parseInt(document.getElementById('f-rating').value)
    };
    await apiCall('/feedbacks/addFeedBack', 'PATCH', body);
}


// ==========================================
// --- SOCKET & INTERACTIVE UX MANAGEMENT ---
// ==========================================

let appState = {
    mode: 'IDLE', // IDLE | SEARCHING | ACTIVE
    currentTripId: null,
    paymentKey: null,
    lastAlertData: null,
    autoGpsInterval: null,
    progressInterval: null
};

function connectSocket() {
    if (!token) return log("Login first!", 'error');
    if (socket) socket.disconnect();
    
    socket = io(API_URL, { auth: { accesstoken: token } });

    socket.on('connect', () => {
        socketBadge.textContent = "Socket Online 🟢";
        socketBadge.className = "badge status-online";
        log("Real-time pipeline established", "success");
    });
    
    socket.on('connect_error', (err) => {
        socketBadge.textContent = "Socket Error 🔴";
        socketBadge.className = "badge status-offline";
        log(`Handshake failed: ${err.message}`, "error");
    });

    // Incoming ride alert to driver
    socket.on('rideAlert', (data) => {
        if (appState.mode === 'ACTIVE') return; // Ignore if busy
        appState.lastAlertData = data; 
        log(`📍 INCOMING RIDE: Passenger ${data.user_id} within ${data.ETA}min`, "info");
        document.getElementById('passenger-id').value = data.user_id;

        // Make visually prominent
        const alertBox = document.getElementById('incoming-alert');
        if (alertBox) {
            alertBox.classList.remove('hidden');
            document.getElementById('incoming-meta').textContent = `Passenger ID: ${data.user_id} | ETA: ${data.ETA} min`;
        }
    });

    // Backend tells passenger driver was assigned (after driver accepts)
    socket.on('assign', (room, paymentKey, time) => { 
        log(`✅ ASSIGNED to ${room}`, "success"); 
        
        // CRITICAL FIX: The Passenger must join the room that the server emitted!
        socket.emit("assign", room);

        appState.currentTripId = parseInt(room.split(':')[1]);
        appState.paymentKey = paymentKey;
        setTripState('ACTIVE', { status: 'matched', eta: 'Syncing', paymentKey });
    });

    // Backend tells everyone the trip has actually started physically / logically in the lifecycle
    socket.on('startRide', (trip, paymentKey) => { 
        appState.currentTripId = trip.ID; 
        appState.paymentKey = paymentKey;
        log(`🚀 TRIP STARTED: #${trip.ID}`, "success");
        setTripState('ACTIVE', { status: trip.status || 'started', eta: trip.ETA || trip.rem_ETA, paymentKey });
    });

    socket.on('finishTrip', (trip) => {
        log("🏁 TRIP FINISHED", "success");
        setTripState('FEEDBACK');
    });

    socket.on('cancel_trip', () => {
        log("❌ TRIP CANCELLED BY PEER", "warning");
        setTripState('IDLE');
    });

    socket.on('updateLocationDisplay', (lat, lng, time) => {
        log(`Live Driver GPS -> Lat: ${lat}, Lng: ${lng}`, "info");
    });

    socket.on('update-payment-display', (payment) => {
        log(`💳 PAYMENT WEBHOOK: ${payment.obj.success ? 'SUCCESS' : 'FAILED'}`, payment.obj.success ? 'success' : 'error');
        updatePaymentBadge(payment.obj.success ? 'success' : 'failed');
    });
}

function updatePaymentBadge(status) {
    const badge = document.getElementById('payment-status-badge');
    if (!badge) return;
    if (status === 'success') {
        badge.textContent = `💳 Payment: Success ✅`;
        badge.className = `badge status-online`;
    } else if (status === 'failed') {
        badge.textContent = `💳 Payment: Failed ❌`;
        badge.className = `badge status-offline`;
    } else {
        badge.textContent = `💳 Payment: Pending ⏳`;
        badge.className = `badge status-pending`;
    }
}

// --- Dynamic State Machine ---
function setTripState(newState, meta = {}) {
    appState.mode = newState;
    
    // UI Elements
    const passengerForm = document.getElementById('passenger-form');
    const searchingOverlay = document.getElementById('passenger-searching');
    const activeCard = document.getElementById('active-trip-card');
    const driverForm = document.getElementById('driver-form');
    const driverIncoming = document.getElementById('incoming-alert');
    const feedbackCard = document.getElementById('feedback-card');

    // Clean up timers when leaving ACTIVE
    if (newState !== 'ACTIVE') {
        if (appState.progressInterval) {
            clearInterval(appState.progressInterval);
            appState.progressInterval = null;
        }
    }

    if (feedbackCard) feedbackCard.classList.add('hidden');

    if (newState === 'IDLE') {
        passengerForm.classList.remove('hidden');
        searchingOverlay.classList.add('hidden');
        activeCard.classList.add('hidden');
        driverForm.classList.remove('hidden');
        driverIncoming.classList.add('hidden');
        
        appState.currentTripId = null;
        appState.paymentKey = null;
        appState.lastAlertData = null;
        updatePaymentBadge('pending');

    } else if (newState === 'SEARCHING') {
        passengerForm.classList.add('hidden');
        searchingOverlay.classList.remove('hidden');
        
    } else if (newState === 'ACTIVE') {
        passengerForm.classList.add('hidden');
        searchingOverlay.classList.add('hidden');
        driverForm.classList.add('hidden'); // Driver hides normal controls
        driverIncoming.classList.add('hidden');
        activeCard.classList.remove('hidden'); // Show the global active card
        
        document.getElementById('stat-trip-id').textContent = appState.currentTripId;
        document.getElementById('stat-pay-key').textContent = (meta.paymentKey || appState.paymentKey || "N/A").substring(0, 15) + '...';
        document.getElementById('stat-eta').textContent = meta.eta ? `${meta.eta} min` : '-- min';
        document.getElementById('trip-status-badge').textContent = meta.status || 'inProgress';

        // Start Periodic Progress Tracking (every 30s for demo)
        if (!appState.progressInterval) {
            appState.progressInterval = setInterval(() => {
                log("⏲️ Requesting Trip Status Update...");
                socket.emit("update-trip-status", appState.currentTripId, "prog_" + Date.now(), (res) => {
                    if (res.success && res.trip) {
                        document.getElementById('trip-status-badge').textContent = res.trip.status;
                        document.getElementById('stat-eta').textContent = `${Math.ceil(res.trip.rem_ETA || res.trip.ETA || 0)} min`;
                    } else if (res.err) {
                        log(`Trip Update Failed: ${res.err.message || JSON.stringify(res.err)}`, "error");
                    }
                });
            }, 30000); // Check every 30s
        }
    } else if (newState === 'FEEDBACK') {
        passengerForm.classList.add('hidden');
        searchingOverlay.classList.add('hidden');
        driverForm.classList.add('hidden');
        activeCard.classList.add('hidden');
        
        if (feedbackCard) {
            feedbackCard.classList.remove('hidden');
            document.getElementById('fb-trip-id').textContent = appState.currentTripId;
        }
    }
}

// --- Action Listeners ---
function findDriver() {
    const lat = parseFloat(document.getElementById('lat').value);
    const lng = parseFloat(document.getElementById('lng').value);
    const tLat = parseFloat(document.getElementById('tr-lat').value);
    const tLng = parseFloat(document.getElementById('tr-lng').value);
    
    setTripState('SEARCHING');
    socket.emit("findADriver", lat, lng, tLat, tLng, 3, "req_" + Date.now(), (res) => {
        log(`FindDriver Response: ${JSON.stringify(res)}`);
        if (res === "no available drivers" || res.success === false) {
            setTripState('IDLE');
        }
    });
}

function acceptRide() {
    if (!appState.lastAlertData) return log("❌ Error: No incoming ride alert to accept!", "error");
    const { user_id, lat, lng, t_lat, t_lng, ETA } = appState.lastAlertData;
    
    socket.emit("acceptRide", user_id, lat, lng, t_lat, t_lng, ETA, "req_" + Date.now(), (res) => {
        log(`AcceptRide Response: ${JSON.stringify(res)}`);
        if (!res.success) {
            log(`Accept Failed: ${res.err}`, "error");
        } else {
            // Wait for 'assign' and 'startRide' to trigger UI change
            document.getElementById('incoming-alert').classList.add('hidden');
        }
    });
}

function updateLocation() {
    const lat = parseFloat(document.getElementById('lat').value);
    const lng = parseFloat(document.getElementById('lng').value);
    const locs = [{ lat, lng }]; 
    
    // Can send location even if not on a trip (for discovery)
    socket.emit("update-location", locs, appState.currentTripId, (res) => {
        log(`UpdateLocation Response: ${JSON.stringify(res)}`);
    });
}

function toggleAutoGPS() {
    const btn = document.getElementById('auto-gps-btn');
    if (appState.autoGpsInterval) {
        clearInterval(appState.autoGpsInterval);
        appState.autoGpsInterval = null;
        btn.textContent = "📡 Start Auto-GPS";
        btn.classList.replace('btn-danger', 'btn-ghost');
        log("Auto-GPS Offline", "info");
    } else {
        log("Auto-GPS Active (Every 5s)", "success");
        btn.textContent = "🛑 Stop Auto-GPS";
        btn.classList.replace('btn-ghost', 'btn-danger');
        
        appState.autoGpsInterval = setInterval(() => {
            const latInput = document.getElementById('lat');
            const lngInput = document.getElementById('lng');
            latInput.value = (parseFloat(latInput.value) + (Math.random() - 0.5) * 0.0001).toFixed(6);
            lngInput.value = (parseFloat(lngInput.value) + (Math.random() - 0.5) * 0.0001).toFixed(6);
            updateLocation();
        }, 5000);
    }
}

function finishTrip() {
    if (!appState.currentTripId) return log("❌ Error: No active trip.", "error");
    socket.emit("update-trip-status", appState.currentTripId, "req_" + Date.now(), (res) => {
        log(`FinishTrip manual request: ${JSON.stringify(res)}`);
    });
}

function cancelRide() {
    if (!appState.currentTripId) {
        // Just cancel the search
        setTripState('IDLE');
        return;
    }
    socket.emit("cancel", appState.currentTripId, "req_" + Date.now(), (res) => {
        log(`Cancel Response: ${JSON.stringify(res)}`);
        if (res.success) setTripState('IDLE');
    });
}

// Fallbacks requested by user
function fetchCurrentTrip() {
    socket.emit("get-trip", (res) => {
        log(`Fetch Trip explicitly: ${JSON.stringify(res)}`);
        if (res.success && res.trip) {
            document.getElementById('trip-status-badge').textContent = res.trip.status;
            document.getElementById('stat-eta').textContent = `${Math.ceil(res.trip.rem_ETA || res.trip.ETA)} min`;
        }
    });
}

function fetchCurrentPayment() {
    if (!appState.currentTripId) return;
    socket.emit("get-payment", appState.currentTripId, (res) => {
        log(`Fetch Payment explicitly: ${JSON.stringify(res)}`);
        if (res.success && res.payment) {
            updatePaymentBadge(res.payment.status);
        }
    });
}

function retryPayment() {
    if (!appState.currentTripId) return;
    socket.emit("retry_payment", appState.currentTripId, "req_" + Date.now(), (res) => {
        log(`RetryPayment: ${JSON.stringify(res)}`);
        if (res.success && res.payment) appState.paymentKey = res.paymentKey;
    });
}

async function submitRideFeedback() {
    const body = {
        trip_id: parseInt(appState.currentTripId),
        uContent: document.getElementById('fb-comment').value,
        uRating: parseInt(document.getElementById('fb-rating').value)
    };
    await apiCall('/feedbacks/addFeedBack', 'PATCH', body);
    log("Feedback submitted successfully", "success");
    setTripState('IDLE');
}

function closeFeedback() {
    setTripState('IDLE');
}
