const API_URL = "http://localhost:3000";
let token = null;
let refreshTokenStored = null;
let socket = null;

// UI State
let appState = {
    mode: 'IDLE', // IDLE | SEARCHING | ACTIVE | FEEDBACK
    currentTripId: null,
    paymentKey: null,
    lastAlertData: null,
    autoGpsInterval: null,
    progressInterval: null
};

// --- Navigation ---
function nav(pageId, el) {
    const titles = {
        'auth': 'Identity Gateway',
        'ride': 'Ride Telemetry',
        'profile': 'Profile & Config',
        'admin': 'Admin Explorer'
    };
    document.getElementById('page-title').textContent = titles[pageId] || 'System Terminal';

    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');
}

function toggleDriverFields() {
    const isDriver = document.getElementById('role').value === 'driver';
    document.getElementById('driver-fields').classList.toggle('hidden', !isDriver);
}

// --- Logging ---
const logs = document.getElementById('log-container');
function log(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    const time = new Date().toLocaleTimeString();
    
    if (typeof message === 'object') {
        message = JSON.stringify(message, null, 2);
    }
    
    entry.innerHTML = `<span class="log-time">${time}</span>${message}`;
    logs.appendChild(entry);
    logs.scrollTop = logs.scrollHeight;
}
function clearLogs() { logs.innerHTML = ''; }

// --- Helpers ---
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

        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: method === 'GET' ? null : fetchBody
        });
        
        const data = await res.json();
        if (res.ok && data.success !== false) {
            log(`Success: ${data.Message || "Operation completed"}`, 'success');
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

// --- Auth Actions ---
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
        document.getElementById('token-display').textContent = token.substring(0, 15) + "...";
        log("Authenticated successfully.", "success");
    }
}

async function verifyEmail() {
    const body = { email: document.getElementById('email').value, otp: document.getElementById('otp').value };
    await apiCall('/auth/verifyEmail', 'PATCH', body);
}

async function resendOtp() {
    await apiCall('/auth/sendEmailVerification', 'POST', { email: document.getElementById('email').value });
}

async function forgetPassword() {
    const email = document.getElementById('email').value;
    if (!email) return log("Email required for reset", "error");
    await apiCall('/auth/forgetPassword', 'POST', { email });
}

async function changePassword() {
    const body = {
        email: document.getElementById('email').value,
        otp: document.getElementById('reset-otp').value,
        password: document.getElementById('new-password').value
    };
    await apiCall('/auth/changePassword', 'POST', body);
}

async function logout() {
    await apiCall('/auth/logout', 'POST', {});
    token = null;
    document.getElementById('token-display').textContent = "No Token";
    if (socket) socket.disconnect();
}

async function refreshToken() {
    if (!refreshTokenStored) return log("No sync token found", "error");
    const res = await fetch(`${API_URL}/auth/retakeAccessToken`, {
        method: 'POST', headers: { 'refreshtoken': refreshTokenStored }
    });
    const data = await res.json();
    if (data && data.accessToken) {
        token = data.accessToken;
        document.getElementById('token-display').textContent = token.substring(0, 15) + "...";
        log("Identity token refreshed", "success");
    }
}

// --- Profile ---
async function updateProfile() {
    const body = { 
        name: document.getElementById('upd-name').value, 
        phoneNumber: document.getElementById('upd-phone').value 
    };
    await apiCall('/user/', 'PATCH', body);
}

async function updateProfilePic() {
    const fileInput = document.getElementById('upd-pic');
    if (!fileInput.files[0]) return log("Select asset first", "error");
    await apiCall('/user/update-profilePic', 'PATCH', { img: fileInput.files }, { isMultipart: true });
}

async function deleteAccount() {
    if (confirm("Execute account purge? This cannot be undone.")) {
        await apiCall('/user/', 'DELETE');
    }
}

// --- Sockets ---
function connectSocket() {
    if (!token) return log("No token found. Sign in first.", 'warning');
    if (socket) socket.disconnect();
    
    socket = io(API_URL, { auth: { accesstoken: token } });

    socket.on('connect', () => {
        const dot = document.getElementById('socket-dot');
        const text = document.getElementById('socket-text');
        dot.style.background = 'var(--success)';
        text.textContent = 'Operational';
        text.style.color = 'var(--success)';
        log("Real-time telemetry established", "success");
        recoverState();
    });
    
    socket.on('connect_error', (err) => {
        const dot = document.getElementById('socket-dot');
        const text = document.getElementById('socket-text');
        dot.style.background = 'var(--danger)';
        text.textContent = 'Sync Failure';
        text.style.color = 'var(--danger)';
        log(`Link error: ${err.message}`, "error");
    });

    socket.on('rideAlert', (data) => {
        if (appState.mode === 'ACTIVE') return; 
        appState.lastAlertData = data; 
        log(`📍 RADAR: Ride Alert from Passenger ${data.user_id} (${data.ETA}min away)`, "warning");
        
        document.getElementById('d-incoming').classList.remove('hidden');
        document.getElementById('incoming-desc').textContent = `Passenger ${data.user_id} | Dist: ${data.ETA}m`;
    });

    socket.on('assign', (room, paymentKey) => { 
        log(`🔗 LINKED to session ${room}`, "success"); 
        socket.emit("assign", room);
        appState.currentTripId = parseInt(room.split(':')[1]);
        appState.paymentKey = paymentKey;
        setTripState('ACTIVE', { status: 'Assigned', eta: 'Syncing', paymentKey });
    });

    socket.on('startRide', (trip, paymentKey) => { 
        appState.currentTripId = trip.ID; 
        appState.paymentKey = paymentKey;
        log(`🚀 IGNITION: Trip #${trip.ID} started`, "success");
        setTripState('ACTIVE', { status: trip.status, eta: trip.ETA || trip.rem_ETA, paymentKey });
    });

    socket.on('finishTrip', (trip) => {
        log("🎌 MISSION COMPLETE: Trip finished", "success");
        setTripState('FEEDBACK');
    });

    socket.on('cancel_trip', () => {
        log("⚠️ ABORTED: Trip cancelled by peer", "error");
        setTripState('CANCELLED', { status: 'Cancelled by Peer', eta: '--' });
    });

    socket.on('updateLocationDisplay', (lat, lng) => {
        log(`📡 NODE SYNC: Driver moving to ${lat}, ${lng}`, "info");
    });

    socket.on('update-payment-display', (payment) => {
        const success = payment.obj ? payment.obj.success : (payment.status === 'paid');
        log(`💳 LEDGER: Payment ${success ? 'CONFIRMED' : 'REJECTED'}`, success ? 'success' : 'error');
        updatePaymentStatus(success ? 'Paid' : 'Failed');
        if (!success) setTripState('FAILED', { status: 'Payment Failed', eta: '--' });
    });
}

// --- Ride Actions ---
function setTripState(newState, meta = {}) {
    appState.mode = newState;
    
    // UI Groups
    const pIdle = document.getElementById('p-idle');
    const pSearch = document.getElementById('p-searching');
    const dIdle = document.getElementById('d-idle');
    const rActive = document.getElementById('r-active');
    const rFeedback = document.getElementById('r-feedback');

    // Reset visibility
    [pIdle, pSearch, dIdle, rActive, rFeedback].forEach(el => el.classList.add('hidden'));

    if (newState === 'IDLE') {
        pIdle.classList.remove('hidden');
        dIdle.classList.remove('hidden');
        document.getElementById('d-incoming').classList.add('hidden');
        appState.currentTripId = null;
        if (appState.progressInterval) clearInterval(appState.progressInterval);
    } else if (newState === 'SEARCHING') {
        pSearch.classList.remove('hidden');
    } else if (newState === 'ACTIVE' || newState === 'FAILED' || newState === 'CANCELLED') {
        rActive.classList.remove('hidden');
        document.getElementById('act-trip-id').textContent = appState.currentTripId || '--';
        document.getElementById('act-eta').textContent = `${meta.eta || '--'} min`;
        document.getElementById('act-pay-key').textContent = meta.paymentKey || 'N/A';
        
        const badge = document.getElementById('act-stat-badge');
        badge.textContent = meta.status || newState;
        
        if (newState === 'FAILED') {
            badge.style.background = 'var(--danger-glow)';
            badge.style.color = '#f28b82';
        } else if (newState === 'CANCELLED') {
            badge.style.background = 'rgba(255, 255, 255, 0.1)';
            badge.style.color = 'var(--text-muted)';
        } else {
            badge.style.background = 'var(--accent-glow)';
            badge.style.color = '#8ab4f8';
        }

        // Periodic Status Updates (Each Minute as requested)
        if (appState.progressInterval) clearInterval(appState.progressInterval);
        if (newState === 'ACTIVE') {
            appState.progressInterval = setInterval(() => {
                refreshTripStatus();
            }, 60000); 
        }
    } else if (newState === 'FEEDBACK') {
        rFeedback.classList.remove('hidden');
        document.getElementById('fb-trip-id').textContent = appState.currentTripId;
    }
}

function refreshTripStatus() {
    if (!appState.currentTripId) return;
    log("🔄 Syncing trip status...", "info");
    socket.emit("update-trip-status", appState.currentTripId, "poll_" + Date.now(), (res) => {
        if (res.success && res.trip) {
            document.getElementById('act-stat-badge').textContent = res.trip.status;
            document.getElementById('act-eta').textContent = `${Math.ceil(res.trip.rem_ETA || res.trip.ETA || 0)} min`;
            log(`Status: ${res.trip.status}`, "success");
        } else {
            log("Sync failed or trip not found", "error");
        }
    });
}

async function refreshPaymentStatus() {
    if (!appState.currentTripId) return;
    log("💳 Syncing payment status...", "info");
    socket.emit("get-payment", appState.currentTripId, (res) => {
        if (res.success && res.payment) {
            updatePaymentStatus(res.payment.status === 'success' || res.payment.status === 'paid' ? 'Paid' : 'Pending');
            log(`Payment: ${res.payment.status}`, "success");
        } else {
            log("Failed to fetch payment status", "error");
        }
    });
}

function recoverState() {
    if (!socket) return;
    log("🔍 Probing for active sessions...", "info");
    socket.emit("get-trip", (res) => {
        if (res.success && res.trip) {
            log(`✅ Session recovered: Trip #${res.trip.ID}`, "success");
            appState.currentTripId = res.trip.ID;
            
            // Map status to UI state
            let uiState = 'ACTIVE';
            if (res.trip.status === 'cancelled') uiState = 'CANCELLED';
            if (res.trip.status === 'finished') uiState = 'FEEDBACK';
            
            setTripState(uiState, { 
                status: res.trip.status, 
                eta: res.trip.rem_ETA || res.trip.ETA 
            });
            
            if (uiState === 'ACTIVE') refreshPaymentStatus();
        } else {
            log("No active sessions detected.", "info");
        }
    });
}

function findDriver() {
    const coords = {
        lat: parseFloat(document.getElementById('p-lat').value),
        lng: parseFloat(document.getElementById('p-lng').value),
        tLat: parseFloat(document.getElementById('p-tr-lat').value),
        tLng: parseFloat(document.getElementById('p-tr-lng').value)
    };
    setTripState('SEARCHING');
    socket.emit("findADriver", coords.lat, coords.lng, coords.tLat, coords.tLng, 3, "req_" + Date.now(), (res) => {
        if (!res.success) {
            log(`Find Failed: ${res.err}`, "error");
            setTripState('IDLE');
        }
    });
}

function cancelSearch() {
    socket.emit("cancel_search", (res) => {
        log("Search aborted manually");
        setTripState('IDLE');
    });
}

function acceptRide() {
    if (!appState.lastAlertData) return;
    const { user_id, lat, lng, t_lat, t_lng, ETA } = appState.lastAlertData;
    socket.emit("acceptRide", user_id, lat, lng, t_lat, t_lng, ETA, "ack_" + Date.now(), (res) => {
        if (res.success) {
            document.getElementById('d-incoming').classList.add('hidden');
        } else {
            log(`Accept Failed: ${res.err}`, "error");
        }
    });
}

function syncLocation() {
    const lat = parseFloat(document.getElementById('d-lat').value);
    const lng = parseFloat(document.getElementById('d-lng').value);
    socket.emit("update-location", [{ lat, lng }], appState.currentTripId, (res) => {
        log("Node pushed to server cluster");
    });
}

function toggleAutoGPS() {
    const btn = document.getElementById('auto-gps-btn');
    if (appState.autoGpsInterval) {
        clearInterval(appState.autoGpsInterval);
        appState.autoGpsInterval = null;
        btn.textContent = "Start Auto-GPS";
        btn.style.background = "rgba(5, 163, 87, 0.2)";
        log("Telemetry stream paused");
    } else {
        log("Telemetry stream active (5s pulse)");
        btn.textContent = "Stop Auto-GPS";
        btn.style.background = "var(--danger)";
        appState.autoGpsInterval = setInterval(() => {
            const lat = document.getElementById('d-lat');
            const lng = document.getElementById('d-lng');
            lat.value = (parseFloat(lat.value) + (Math.random() - 0.5) * 0.0002).toFixed(6);
            lng.value = (parseFloat(lng.value) + (Math.random() - 0.5) * 0.0002).toFixed(6);
            syncLocation();
        }, 5000);
    }
}

function finishTrip() {
    socket.emit("update-trip-status", appState.currentTripId, "fin_"+Date.now(), (res) => {
        log("Completion signal sent");
    });
}

function cancelActiveRide() {
    const refund = document.getElementById('need-refund-chk').checked ? 1 : 0;
    socket.emit("cancel", appState.currentTripId, "can_"+Date.now(), refund, (res) => {
        if (res.success) setTripState('IDLE');
    });
}

function retryPayment() {
    socket.emit("retry_payment", appState.currentTripId, "ret_"+Date.now(), (res) => {
        log(`Retry Request sent: ${res.success ? 'ACCEPTED' : 'REJECTED'}`);
    });
}

// --- Feedback ---
async function submitTripFeedback() {
    const body = {
        trip_id: appState.currentTripId,
        uRating: parseInt(document.getElementById('fb-rating').value),
        uContent: document.getElementById('fb-comment').value
    };
    await apiCall('/feedbacks/addFeedBack', 'PATCH', body);
    setTripState('IDLE');
}

function skipFeedback() { setTripState('IDLE'); }

// --- Admin ---
async function fetchData(endpoint) {
    await apiCall(endpoint, 'GET');
}

async function submitAdminFeedback() {
    const body = {
        trip_id: parseInt(document.getElementById('admin-t-id').value),
        uRating: parseInt(document.getElementById('admin-rating').value),
        uContent: document.getElementById('admin-comment').value
    };
    await apiCall('/feedbacks/addFeedBack', 'PATCH', body);
}

function updatePaymentStatus(stat) {
    const el = document.getElementById('act-pay-stat');
    el.textContent = stat;
    el.style.color = stat === 'Paid' ? 'var(--success)' : 'var(--warning)';
}
