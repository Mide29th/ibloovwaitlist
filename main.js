// ===== IBLOOV AURA WAITLIST — MAIN APPLICATION =====
import { createClient } from '@supabase/supabase-js';

// --- Supabase Config ---
const SUPABASE_URL = 'https://afqbslwwpyphrjxmweuj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcWJzbHd3cHlwaHJqeG13ZXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTU0ODMsImV4cCI6MjA4Njk5MTQ4M30._q-u97tZChx6UVCbagt97wnm1yzWASD6IHAQjjrEzF4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Temp email domain blocklist ---
const TEMP_EMAIL_DOMAINS = [
    'tempmail.com', 'guerrillamail.com', 'mailinator.com', 'throwaway.email',
    'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
    'discard.email', 'trashmail.com', 'temp-mail.org', 'fakeinbox.com',
    'tempinbox.com', 'getnada.com', 'mailnesia.com', 'burnermail.io',
    'disposableemailaddresses.emailmiser.com', '10minutemail.com',
];

// --- State ---
let userData = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    createParticles('particles');
    createParticles('particles-dash');
    loadTotalCount();
    checkReferralCode();
    setupForm();
    setupPropCards();
    checkReturningUser();
});

// --- Check if user has already signed up (stored in localStorage) ---
function checkReturningUser() {
    const stored = localStorage.getItem('ibloov_waitlist_user');
    if (stored) {
        try {
            const cached = JSON.parse(stored);
            // Refresh stats from server
            refreshUserStats(cached.referral_code);
        } catch {
            localStorage.removeItem('ibloov_waitlist_user');
        }
    }
}

async function refreshUserStats(referralCode) {
    try {
        const { data, error } = await supabase.rpc('get_user_stats', {
            p_referral_code: referralCode
        });
        if (data && !error) {
            userData = data;
            showDashboard(userData);
        }
    } catch {
        // If fetch fails, just show landing page
    }
}

// --- Check if arrived via referral link ---
function checkReferralCode() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
        sessionStorage.setItem('ibloov_referrer', ref);
    }
}

// --- Load total waitlist count for nav ---
async function loadTotalCount() {
    try {
        const { data } = await supabase.rpc('get_waitlist_count');
        if (data !== null) {
            animateCounter(document.getElementById('total-joined'), data);
        }
    } catch { }
}

// --- Floating Particles ---
function createParticles(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (6 + Math.random() * 10) + 's';
        p.style.animationDelay = Math.random() * 8 + 's';
        p.style.width = (2 + Math.random() * 3) + 'px';
        p.style.height = p.style.width;
        const colors = ['#6c3ce9', '#a855f7', '#3b82f6', '#ec4899'];
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(p);
    }
}

// --- Prop Card Click = Select Radio ---
function setupPropCards() {
    document.querySelectorAll('.prop-card').forEach(card => {
        card.addEventListener('click', () => {
            const interest = card.dataset.interest;
            const radio = document.querySelector(`input[name="interest"][value="${interest}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
                // Scroll to form
                document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ===== FORM HANDLING =====
function setupForm() {
    const form = document.getElementById('waitlist-form');
    form.addEventListener('submit', handleSubmit);
}

// --- Validation ---
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return 'Please enter a valid email address.';
    const domain = email.split('@')[1].toLowerCase();
    if (TEMP_EMAIL_DOMAINS.includes(domain)) return 'Temporary email addresses are not allowed.';
    return null;
}

function validateWhatsApp(phone) {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) return 'Please enter a valid WhatsApp number.';
    if (!/^\+?\d+$/.test(cleaned)) return 'Phone number can only contain digits, spaces, and +.';
    return null;
}

function validateName(name) {
    if (!name || name.trim().length < 2) return 'Please enter your full name.';
    return null;
}

function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-group input').forEach(el => el.classList.remove('error'));
}

function showFieldError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field) field.classList.add('error');
    if (error) error.textContent = message;
}

async function handleSubmit(e) {
    e.preventDefault();
    clearErrors();

    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const interest = document.querySelector('input[name="interest"]:checked');

    let hasError = false;

    const nameErr = validateName(fullName);
    if (nameErr) { showFieldError('full-name', 'name-error', nameErr); hasError = true; }

    const emailErr = validateEmail(email);
    if (emailErr) { showFieldError('email', 'email-error', emailErr); hasError = true; }

    const phoneErr = validateWhatsApp(whatsapp);
    if (phoneErr) { showFieldError('whatsapp', 'whatsapp-error', phoneErr); hasError = true; }

    if (!interest) {
        document.getElementById('interest-error').textContent = 'Please select your primary goal.';
        hasError = true;
    }

    if (hasError) return;

    // Disable button + loading state
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.classList.add('loading');

    try {
        const referrer = sessionStorage.getItem('ibloov_referrer') || null;

        const { data, error } = await supabase.rpc('join_waitlist', {
            p_full_name: fullName,
            p_email: email,
            p_whatsapp: whatsapp,
            p_interest: interest.value,
            p_referral_code: referrer,
        });

        if (error) {
            if (error.message.includes('Email already registered')) {
                showFieldError('email', 'email-error', 'This email is already on the waitlist!');
            } else {
                showToast(error.message || 'Something went wrong. Please try again.', 'error');
            }
            btn.disabled = false;
            btn.classList.remove('loading');
            return;
        }

        // Save user data
        userData = data;
        localStorage.setItem('ibloov_waitlist_user', JSON.stringify(data));

        // Switch to dashboard
        showDashboard(data);

    } catch (err) {
        showToast('Network error. Please check your connection and try again.', 'error');
        btn.disabled = false;
        btn.classList.remove('loading');
    }
}

// ===== DASHBOARD =====
function showDashboard(data) {
    // Hide landing, show dashboard
    document.getElementById('landing-page').classList.remove('active');
    document.getElementById('dashboard-page').classList.add('active');
    window.scrollTo(0, 0);

    // Populate data
    document.getElementById('dash-name').textContent = data.full_name.split(' ')[0];

    // Animate queue number
    const queueEl = document.getElementById('queue-number');
    const position = data.queue_position;
    animateQueueNumber(queueEl, position);

    document.getElementById('dash-total').textContent = data.total_users.toLocaleString();

    // Progress bar
    const barPct = Math.max(5, Math.min(95, ((data.total_users - position) / data.total_users) * 100));
    setTimeout(() => {
        document.getElementById('queue-bar').style.width = barPct + '%';
    }, 500);

    // Referral link
    const baseUrl = window.location.origin + window.location.pathname;
    const refLink = `${baseUrl}?ref=${data.referral_code}`;
    document.getElementById('referral-link').value = refLink;

    // Stats
    document.getElementById('stat-referrals').textContent = data.referral_count || 0;
    const spotsJumped = data.original_position ? data.original_position - data.queue_position : 0;
    document.getElementById('stat-jumped').textContent = Math.max(0, spotsJumped).toLocaleString();

    // Setup share buttons
    setupShareButtons(data, refLink);

    // Load leaderboard
    loadLeaderboard();

    // Confetti!
    if (!localStorage.getItem('ibloov_confetti_shown')) {
        launchConfetti();
        localStorage.setItem('ibloov_confetti_shown', '1');
    }
}

function animateQueueNumber(el, target) {
    let current = 0;
    const duration = 1500;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        current = Math.round(eased * target);
        el.textContent = '#' + current.toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function animateCounter(el, target) {
    if (!el) return;
    let current = 0;
    const duration = 1000;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        current = Math.round(eased * target);
        el.textContent = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// --- Share ---
function setupShareButtons(data, refLink) {
    // Copy button
    const copyBtn = document.getElementById('copy-btn');
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(refLink).then(() => {
            copyBtn.classList.add('copied');
            showToast('Link copied! Share it with your friends.');
            setTimeout(() => copyBtn.classList.remove('copied'), 2000);
        });
    });

    // WhatsApp
    const waText = encodeURIComponent(
        `I just joined the Ibloov Aura waitlist — the future of Work, Play & Ownership in Africa is loading.\n\nUse my link to get early access: ${refLink}`
    );
    document.getElementById('whatsapp-share').addEventListener('click', () => {
        window.open(`https://wa.me/?text=${waText}`, '_blank');
    });

    // Twitter/X
    const tweetText = encodeURIComponent(
        `I just joined the @ibloov Aura waitlist.\n\nThe Life & Leisure OS for Africa is loading.\n\nJoin me: ${refLink}\n\n#Ibloov #Aura`
    );
    document.getElementById('twitter-share').addEventListener('click', () => {
        window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
    });

    // Download ticket
    document.getElementById('download-ticket').addEventListener('click', () => {
        generateTicket(data);
    });
}

// --- Leaderboard ---
async function loadLeaderboard() {
    try {
        const { data } = await supabase.rpc('get_leaderboard');
        const list = document.getElementById('leaderboard-list');

        if (!data || data.length === 0) {
            list.innerHTML = '<p class="leaderboard-empty">Be the first on the leaderboard!</p>';
            return;
        }

        const medals = ['1st', '2nd', '3rd', '4th', '5th'];
        list.innerHTML = data.map((item, i) => `
      <div class="leaderboard-item">
        <span class="leader-rank">${medals[i] || i + 1}</span>
        <span class="leader-name">${item.display_name}</span>
        <span class="leader-refs">${item.referral_count} referrals</span>
      </div>
    `).join('');
    } catch { }
}

// ===== TICKET GENERATOR (Canvas API) =====
function generateTicket(data) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, '#060611');
    bgGrad.addColorStop(0.5, '#0d0d24');
    bgGrad.addColorStop(1, '#060611');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative circles
    const orbGrad = ctx.createRadialGradient(540, 600, 0, 540, 600, 300);
    orbGrad.addColorStop(0, 'rgba(108, 60, 233, 0.3)');
    orbGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.1)');
    orbGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(540, 600, 300, 0, Math.PI * 2);
    ctx.fill();

    // Ring decorations
    ctx.strokeStyle = 'rgba(108, 60, 233, 0.2)';
    ctx.lineWidth = 2;
    [200, 260, 320].forEach(r => {
        ctx.beginPath();
        ctx.arc(540, 600, r, 0, Math.PI * 2);
        ctx.stroke();
    });

    // "BOARDING PASS" label
    ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.font = '600 18px "Inter", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.textAlign = 'center';
    ctx.fillText('B O A R D I N G   P A S S', 540, 180);

    // Divider line
    ctx.strokeStyle = 'rgba(108, 60, 233, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(100, 220);
    ctx.lineTo(980, 220);
    ctx.stroke();
    ctx.setLineDash([]);

    // Brand
    ctx.fillStyle = '#f0f0ff';
    ctx.font = '700 52px "Space Grotesk", sans-serif';
    ctx.fillText('ibloov', 540, 320);

    // AURA badge
    const aurGrad = ctx.createLinearGradient(480, 340, 600, 340);
    aurGrad.addColorStop(0, '#6c3ce9');
    aurGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = aurGrad;
    roundRect(ctx, 490, 340, 100, 32, 16);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '600 14px "Inter", sans-serif';
    ctx.fillText('AURA', 540, 362);

    // User name
    ctx.fillStyle = '#f0f0ff';
    ctx.font = '700 48px "Space Grotesk", sans-serif';
    ctx.fillText(data.full_name || 'Explorer', 540, 880);

    // Position
    const posGrad = ctx.createLinearGradient(340, 950, 740, 950);
    posGrad.addColorStop(0, '#6c3ce9');
    posGrad.addColorStop(0.5, '#a855f7');
    posGrad.addColorStop(1, '#ec4899');
    ctx.fillStyle = posGrad;
    ctx.font = '700 120px "Space Grotesk", sans-serif';
    ctx.fillText(`#${data.queue_position.toLocaleString()}`, 540, 1060);

    // Position label
    ctx.fillStyle = 'rgba(240, 240, 255, 0.5)';
    ctx.font = '500 22px "Inter", sans-serif';
    ctx.fillText('P O S I T I O N   I N   L I N E', 540, 1120);

    // Divider
    ctx.strokeStyle = 'rgba(108, 60, 233, 0.3)';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(100, 1200);
    ctx.lineTo(980, 1200);
    ctx.stroke();
    ctx.setLineDash([]);

    // Info section
    const interestLabels = {
        get_hired: 'Get Hired — Ibloov Learning',
        host_events: 'Host Events — Organizer Tools',
        explore: 'Explore & Party — General User',
    };

    ctx.fillStyle = 'rgba(240, 240, 255, 0.4)';
    ctx.font = '500 18px "Inter", sans-serif';
    ctx.fillText('DESTINATION', 540, 1280);

    ctx.fillStyle = '#f0f0ff';
    ctx.font = '500 28px "Inter", sans-serif';
    ctx.fillText(interestLabels[data.interest] || 'The Orbit', 540, 1320);

    ctx.fillStyle = 'rgba(240, 240, 255, 0.4)';
    ctx.font = '500 18px "Inter", sans-serif';
    ctx.fillText('REFERRAL CODE', 540, 1410);

    ctx.fillStyle = '#a855f7';
    ctx.font = '600 32px monospace';
    ctx.fillText(data.referral_code, 540, 1460);

    // CTA
    ctx.fillStyle = 'rgba(240, 240, 255, 0.35)';
    ctx.font = '400 20px "Inter", sans-serif';
    ctx.fillText('Join the orbit → ibloov.com', 540, 1600);

    // Tagline
    ctx.fillStyle = 'rgba(240, 240, 255, 0.2)';
    ctx.font = '400 16px "Inter", sans-serif';
    ctx.fillText('The Life & Leisure OS for Africa', 540, 1780);

    // Download
    const link = document.createElement('a');
    link.download = `ibloov-ticket-${data.referral_code}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('Your boarding pass is downloading.');
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ===== CONFETTI =====
function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti = [];
    const colors = ['#6c3ce9', '#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#f59e0b'];

    for (let i = 0; i < 120; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: 8 + Math.random() * 6,
            h: 4 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 3,
            vy: 2 + Math.random() * 4,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10,
            opacity: 1,
        });
    }

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frame++;

        confetti.forEach(c => {
            c.x += c.vx;
            c.y += c.vy;
            c.rotation += c.rotSpeed;
            c.vy += 0.05; // gravity

            if (frame > 80) c.opacity -= 0.015;

            if (c.opacity <= 0) return;

            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate((c.rotation * Math.PI) / 180);
            ctx.globalAlpha = c.opacity;
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            ctx.restore();
        });

        if (frame < 200) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    animate();
}

// ===== TOAST =====
function showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}
