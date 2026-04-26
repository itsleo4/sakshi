import { 
    SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET, 
    SUPABASE_PHOTO_FOLDER, SUPABASE_FEATURED_PHOTO,
    CORRECT_PASSCODE, MUSIC_URL, VIDEOS, LOVE_LETTERS 
} from './config.js';

/* =============================================================
   app.js  —  The Gravity of Us
   ============================================================= */

// ================================================================
// 0. WAIT FOR DOM
// ================================================================
document.addEventListener('DOMContentLoaded', () => {

// ================================================================
// 2. STATE (Initialize before services)
// ================================================================
const State = {
    loggedIn:      false,
    currentView:   'hero',
    musicOn:       false,
    starsOn:       true,
    catchRAF:      null,   
    memLocked:     false,
    memMatched:    0,
    memInitDone:   false,
    pinnedPhotos:  JSON.parse(localStorage.getItem('pinned_photos') || '[]'),
};

// ================================================================
// 1. SUPABASE INIT (Safe initialization)
// ================================================================
let sb;
try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.warn('Supabase keys missing. Site will run in limited mode.');
    } else {
        sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.error('Supabase init failed:', e);
}

// ================================================================
// 3. ELEMENT REFERENCES
// ================================================================
const elGatekeeper    = document.getElementById('gatekeeper');
const elBdayReveal    = document.getElementById('birthday-reveal');
const elMainApp       = document.getElementById('main-app');
const elPassDots      = document.getElementById('pass-dots');
const elKeypad        = document.getElementById('keypad');
const elHamburger     = document.getElementById('hamburger-btn');
const elSidebarOverlay= document.getElementById('sidebar-overlay');
const elSidebar       = document.getElementById('sidebar-menu');
const elContentArea   = document.getElementById('content-area');
const elHeroSection   = document.getElementById('hero-section');
const elFooter        = document.getElementById('footer');
const elLightbox      = document.getElementById('lightbox');
const elLbImg         = document.getElementById('lb-img');
const elLbCaption     = document.getElementById('lb-caption');
const elLbClose       = document.getElementById('lb-close');
const elAudio         = document.getElementById('bg-audio');
const elBhCanvas      = document.getElementById('bh-canvas');
const elLetterModal   = document.getElementById('letter-modal');
const elModalTitle   = document.getElementById('modal-letter-title');
const elModalBody    = document.getElementById('modal-letter-body');
const elLetterClose   = document.getElementById('letter-close');
const elCake          = document.getElementById('birthday-cake');
const elCakeFlame     = document.getElementById('cake-flame');
const elHeroTitle     = document.getElementById('hero-title');

// ================================================================
// 4. THREE.JS — Black Hole
// ================================================================
;(function initBlackHole() {
    const renderer = new THREE.WebGLRenderer({
        canvas: elBhCanvas, alpha: true, antialias: true
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1000);
    camera.position.z = 6;

    const BH_R = 1.1;

    // — Singularity (dark sphere) —
    const singularity = new THREE.Mesh(
        new THREE.SphereGeometry(BH_R, 48, 48),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    scene.add(singularity);

    // — Glowing rim —
    const rim = new THREE.Mesh(
        new THREE.SphereGeometry(BH_R * 1.15, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0xff88dd, transparent: true, opacity: 0.3, side: THREE.BackSide
        })
    );
    scene.add(rim);

    // — Accretion disk (orbit particles) —
    const COUNT = innerWidth < 480 ? 700 : 1100;
    const diskGeo = new THREE.BufferGeometry();
    const pos     = new Float32Array(COUNT * 3);
    const col     = new Float32Array(COUNT * 3);
    const speeds  = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = BH_R * 1.3 + Math.random() * 2.8;
        pos[i*3]   = Math.cos(a) * r;
        pos[i*3+1] = (Math.random() - 0.5) * 0.16;
        pos[i*3+2] = Math.sin(a) * r;
        const t   = (r - BH_R * 1.3) / 2.8;
        col[i*3]   = 1.0 - t * 0.3;
        col[i*3+1] = 0.55 + t * 0.45;
        col[i*3+2] = 0.95;
        speeds[i]  = 0.003 + Math.random() * 0.006;
    }
    diskGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    diskGeo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    const diskMesh = new THREE.Points(diskGeo, new THREE.PointsMaterial({
        size: 0.04, vertexColors: true, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(diskMesh);

    // — Star field (invisible until explosion) —
    const starGeo  = new THREE.BufferGeometry();
    const starPos  = new Float32Array(1800 * 3);
    for (let i = 0; i < 1800 * 3; i++) starPos[i] = (Math.random() - 0.5) * 28;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat  = new THREE.PointsMaterial({ size: 0.018, color: 0xffffff, transparent: true, opacity: 0 });
    const starMesh = new THREE.Points(starGeo, starMat);
    scene.add(starMesh);

    // — Shockwave ring —
    const shockMat  = new THREE.MeshBasicMaterial({ color: 0xb3e5ff, side: THREE.DoubleSide, transparent: true, opacity: 0 });
    const shockMesh = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.35, 64), shockMat);
    shockMesh.rotation.x = Math.PI / 2;
    scene.add(shockMesh);

    // — Render loop —
    const posArr = diskGeo.attributes.position.array;
    function tick() {
        requestAnimationFrame(tick);
        for (let i = 0; i < COUNT; i++) {
            const x = posArr[i*3], z = posArr[i*3+2];
            const a = Math.atan2(z, x) + speeds[i];
            const r = Math.sqrt(x*x + z*z);
            posArr[i*3]   = Math.cos(a) * r;
            posArr[i*3+2] = Math.sin(a) * r;
        }
        diskGeo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }
    tick();

    window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });

    // — Toggle stars from settings —
    window._setStarsVisible = (on) => { starMesh.visible = on; };

    // — Explosion API (called by passcode success) —
    window._explodeBlackHole = () => {
        // Shockwave
        shockMat.opacity = 0.85;
        gsap.to(shockMesh.scale, { x: 35, y: 35, z: 35, duration: 1.8, ease: 'power2.out' });
        gsap.to(shockMat, { opacity: 0, duration: 1.8, ease: 'power2.out' });

        // Stars fade in
        gsap.to(starMat, { opacity: 0.8, duration: 2 });

        // Black hole implodes
        gsap.to(singularity.scale, { x: 0, y: 0, z: 0, duration: 0.7, ease: 'power4.in' });
        gsap.to(rim.material,      { opacity: 0, duration: 0.7 });
        gsap.to(diskMesh.material, { opacity: 0, duration: 1 });

        // Gentle star rotation
        setTimeout(() => {
            gsap.to(starMesh.rotation, { y: Math.PI * 2, duration: 200, repeat: -1, ease: 'linear' });
        }, 2000);
    };
})();

// ================================================================
// 5. PASSCODE
// ================================================================
let passBuffer = '';

function updatePassDisplay() {
    elPassDots.textContent = '●'.repeat(passBuffer.length);
}

function handlePassKey(key) {
    if (key === 'clear') {
        passBuffer = passBuffer.slice(0, -1);
        updatePassDisplay();
    } else if (key === 'enter') {
        attemptUnlock();
    } else if (passBuffer.length < 6) {
        passBuffer += key;
        updatePassDisplay();
        if (navigator.vibrate) navigator.vibrate(22);
    }
}

function attemptUnlock() {
    if (passBuffer === CORRECT_PASSCODE) {
        successUnlock();
    } else {
        passBuffer = '';
        updatePassDisplay();
        const card = elGatekeeper.querySelector('.pass-card');
        card.classList.remove('shake');
        void card.offsetWidth; // reflow to restart animation
        card.classList.add('shake');
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
        card.addEventListener('animationend', () => card.classList.remove('shake'), { once: true });
    }
}

// Unified key handler (works for click & touch)
function bindKeypad() {
    function onKey(e) {
        const btn = e.target.closest('.key');
        if (!btn) return;
        if (e.type === 'touchstart') e.preventDefault();
        handlePassKey(btn.dataset.key);
    }
    elKeypad.addEventListener('click',      onKey);
    elKeypad.addEventListener('touchstart', onKey, { passive: false });
}
bindKeypad();

// ================================================================
// 6. UNLOCK SEQUENCE
// ================================================================
function successUnlock() {
    State.loggedIn = true;

    // Play music
    elAudio.src = MUSIC_URL;
    elAudio.volume = 0.3;
    elAudio.play().catch(() => {}); // silent fail if autoplay blocked
    State.musicOn = true;

    // Hide gatekeeper
    gsap.to(elGatekeeper, { opacity: 0, duration: 0.5, onComplete: () => {
        elGatekeeper.classList.add('hidden');
    }});

    // 3D Explosion
    _explodeBlackHole();

    // Flash the screen white
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:white;z-index:999;pointer-events:none';
    document.body.appendChild(flash);
    gsap.to(flash, { opacity: 0, duration: 1.2, onComplete: () => flash.remove() });

    // Birthday reveal text materialises
    setTimeout(() => {
        gsap.to(elBdayReveal, { opacity: 1, duration: 0.8 });
        gsap.from(elBdayReveal.querySelector('.bday-title'), {
            scale: 0, duration: 1.3, ease: 'elastic.out(1, 0.5)'
        });
        gsap.from(elBdayReveal.querySelector('.bday-sub'), {
            y: 18, opacity: 0, duration: 0.8, delay: 0.9
        });
    }, 400);

    // Show main app after 2.8s
    setTimeout(() => {
        gsap.to(elBdayReveal, { opacity: 0, duration: 0.7 });
        elMainApp.classList.add('visible');
        elMainApp.removeAttribute('aria-hidden');
        elFooter.classList.add('visible');
        gsap.from(elHeroSection, { opacity: 0, y: 24, duration: 0.9 });
    }, 2800);
}

// ================================================================
// 7. SIDEBAR & NAVIGATION
// ================================================================
function openSidebar() {
    elSidebar.classList.add('open');
    elSidebarOverlay.classList.add('visible');
    elHamburger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('sidebar-open');
}

function closeSidebar() {
    elSidebar.classList.remove('open');
    elSidebarOverlay.classList.remove('visible');
    elHamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('sidebar-open');
}

// Hamburger — click + touch
function bindHamburger() {
    function open(e) {
        if (e.type === 'touchend') e.preventDefault();
        openSidebar();
    }
    elHamburger.addEventListener('click',    open);
    elHamburger.addEventListener('touchend', open, { passive: false });
}
bindHamburger();

elSidebarOverlay.addEventListener('click',    closeSidebar);
elSidebarOverlay.addEventListener('touchend', (e) => { e.preventDefault(); closeSidebar(); }, { passive: false });

// Nav buttons
document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    function nav(e) {
        if (e.type === 'touchend') e.preventDefault();
        navigateTo(btn.dataset.view);
    }
    btn.addEventListener('click',    nav);
    btn.addEventListener('touchend', nav, { passive: false });
});

function navigateTo(view) {
    State.currentView = view;
    closeSidebar();

    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));

    // Toggle hero visibility
    const isHero = view === 'hero';
    elHeroSection.style.display = isHero ? 'flex' : 'none';
    elFooter.classList.toggle('visible', isHero);

    if (isHero) {
        elContentArea.innerHTML = '';
        return;
    }

    // Stop catch game loop if leaving games
    if (State.catchRAF) { cancelAnimationFrame(State.catchRAF); State.catchRAF = null; }

    // Render requested view
    const renderers = {
        photos:   renderPhotosView,
        videos:   renderVideosView,
        letters:  renderLettersView,
        games:    renderGamesView,
        settings: renderSettingsView,
    };
    if (renderers[view]) renderers[view]();
}

// Logout button
document.getElementById('logout-btn').addEventListener('click', logout);

function logout() {
    if (!confirm('Lock the site and return to the passcode screen?')) return;
    State.loggedIn = false;

    elAudio.pause();
    State.musicOn = false;

    elMainApp.classList.remove('visible');
    elMainApp.setAttribute('aria-hidden', 'true');

    elGatekeeper.classList.remove('hidden');
    gsap.fromTo(elGatekeeper, { opacity: 0 }, { opacity: 1, duration: 0.5 });

    passBuffer = '';
    updatePassDisplay();
}

// ================================================================
// 8. PHOTOS VIEW  — Supabase fetch + inline upload
// ================================================================
async function renderPhotosView() {
    elContentArea.innerHTML = `
        <div class="section-wrap view-enter">
            <h2 class="section-title">Photo Galaxy</h2>
            <p class="section-subtitle">Tap a photo to view · ＋ to upload</p>
            <div class="photos-grid" id="photos-grid">
                <p class="photo-loader" id="photo-loader">
                    <i class="fas fa-spinner fa-spin"></i> Loading memories…
                </p>
            </div>
        </div>

        <!-- Hidden file input -->
        <input type="file" id="photo-file-input" accept="image/*" multiple
               style="display:none" aria-label="Select photos to upload">

        <!-- Floating upload button -->
        <button class="upload-fab" id="upload-fab" aria-label="Upload photos">
            <i class="fas fa-plus"></i>
        </button>

        <!-- Upload toast -->
        <div class="upload-toast" id="upload-toast" aria-live="polite"></div>`;

    // Wire the FAB → file input
    const fab       = document.getElementById('upload-fab');
    const fileInput = document.getElementById('photo-file-input');

    function triggerUpload(e) {
        if (e.type === 'touchend') e.preventDefault();
        fileInput.click();
    }
    fab.addEventListener('click',    triggerUpload);
    fab.addEventListener('touchend', triggerUpload, { passive: false });

    // Handle file selection → upload
    fileInput.addEventListener('change', async () => {
        const files = Array.from(fileInput.files);
        if (!files.length) return;
        fileInput.value = ''; // reset so same file can be re-selected

        // Disable FAB during upload
        fab.disabled = true;
        fab.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        let successCount = 0;
        let failCount    = 0;

        for (const file of files) {
            showToast(`Uploading ${file.name}…`, 'info');
            try {
                // Use timestamp prefix to avoid name collisions
                const ext      = file.name.split('.').pop().toLowerCase();
                const safeName = `photo_${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`;
                const path     = `${SUPABASE_PHOTO_FOLDER}/${safeName}`;

                const { error } = await sb.storage
                    .from(SUPABASE_BUCKET)
                    .upload(path, file, { cacheControl: '3600', upsert: false });

                if (error) throw error;
                successCount++;
            } catch (err) {
                console.error('Upload error:', err);
                failCount++;
                showToast(`❌ Failed: ${file.name}`, 'error');
            }
        }

        // Re-enable FAB
        fab.disabled = false;
        fab.innerHTML = '<i class="fas fa-plus"></i>';

        if (successCount > 0) {
            showToast(`✅ ${successCount} photo${successCount > 1 ? 's' : ''} uploaded!`, 'success');
            // Refresh the grid
            setTimeout(() => renderPhotosView(), 900);
        }
    });

    // Load existing photos into grid
    await loadPhotosGrid();
}

async function loadPhotosGrid() {
    const grid = document.getElementById('photos-grid');
    if (!grid) return;

    try {
        const { data, error } = await sb.storage
            .from(SUPABASE_BUCKET)
            .list(SUPABASE_PHOTO_FOLDER, { limit: 150, sortBy: { column: 'name', order: 'asc' } });

        if (error) throw error;

        const files = (data || []).filter(f => f.id && f.name && !f.name.startsWith('.'));

        if (!files.length) {
            grid.innerHTML = '<p class="photo-loader">No photos yet. Tap ＋ to upload! 📸</p>';
            return;
        }

        // — Sort Logic —
        files.sort((a, b) => {
            // 1. Pinned photos always first
            const aPinned = State.pinnedPhotos.includes(a.name);
            const bPinned = State.pinnedPhotos.includes(b.name);
            if (aPinned && !bPinned) return -1;
            if (bPinned && !aPinned) return 1;

            // 2. Featured photo (specified in config) second
            if (a.name === SUPABASE_FEATURED_PHOTO) return -1;
            if (b.name === SUPABASE_FEATURED_PHOTO) return 1;

            // 3. Rest by name (numeric sort)
            return a.name.localeCompare(b.name, undefined, { numeric: true });
        });

        grid.innerHTML = '';

        files.forEach((file, idx) => {
            const isPinned = State.pinnedPhotos.includes(file.name);
            const url  = sb.storage.from(SUPABASE_BUCKET).getPublicUrl(`${SUPABASE_PHOTO_FOLDER}/${file.name}`).data.publicUrl;
            
            const card = document.createElement('div');
            card.className = 'photo-card' + (idx === 0 ? ' photo-card--featured' : '') + (isPinned ? ' is-pinned' : '');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Open photo ${idx + 1}`);
            card.setAttribute('tabindex', '0');
            
            card.innerHTML = `
                <img src="${url}" alt="Memory ${idx + 1}" loading="lazy">
                ${isPinned ? '<div class="pin-indicator"><i class="fas fa-thumbtack"></i></div>' : ''}
                <button class="photo-menu-btn" aria-label="Photo Options">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            `;

            // — Main Action (Open Lightbox) —
            function open(e) {
                // Ignore if clicking the menu button
                if (e.target.closest('.photo-menu-btn')) return;
                if (e.type === 'touchend') e.preventDefault();
                openLightbox(url, `Memory #${idx + 1}`);
            }
            card.addEventListener('click',    open);
            card.addEventListener('touchend', open, { passive: false });

            // — Options Menu (Three Dots) —
            const menuBtn = card.querySelector('.photo-menu-btn');
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showPhotoMenu(e, file, card);
            });

            // — Long Press (Mobile) —
            let pressTimer;
            card.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    if (navigator.vibrate) navigator.vibrate(50);
                    showPhotoMenu(e.touches[0], file, card);
                }, 700);
            }, { passive: true });
            card.addEventListener('touchend', () => clearTimeout(pressTimer));
            card.addEventListener('touchmove', () => clearTimeout(pressTimer));

            grid.appendChild(card);
            gsap.from(card, { opacity: 0, y: 16, duration: 0.45, delay: idx * 0.05 });
        });

    } catch (err) {
        console.error('loadPhotosGrid error:', err);
        if (grid) grid.innerHTML = `<p class="photo-loader" style="color:var(--red)">⚠️ Could not load photos.<br><small>${err.message}</small></p>`;
    }
}

// — Photo Action Menu (Pin / Delete) —
function showPhotoMenu(e, file, card) {
    // Remove existing menus
    document.querySelectorAll('.photo-context-menu').forEach(m => m.remove());

    const isPinned = State.pinnedPhotos.includes(file.name);
    const menu = document.createElement('div');
    menu.className = 'photo-context-menu';
    menu.innerHTML = `
        <button class="menu-item" data-action="pin">
            <i class="fas fa-thumbtack"></i> ${isPinned ? 'Unpin' : 'Pin to Top'}
        </button>
        <button class="menu-item menu-item--danger" data-action="delete">
            <i class="fas fa-trash"></i> Delete Photo
        </button>
    `;

    // Positioning
    const x = e.clientX || e.pageX;
    const y = e.clientY || e.pageY;
    menu.style.left = `${Math.min(x, window.innerWidth - 160)}px`;
    menu.style.top  = `${y}px`;
    document.body.appendChild(menu);

    // Event handlers
    menu.addEventListener('click', async (e) => {
        const btn = e.target.closest('.menu-item');
        if (!btn) return;
        const action = btn.dataset.action;
        menu.remove();
        handlePhotoAction(action, file, card);
    });

    // Close menu when clicking away
    setTimeout(() => {
        const close = () => { menu.remove(); document.removeEventListener('click', close); };
        document.addEventListener('click', close);
    }, 10);
}

async function handlePhotoAction(action, file, card) {
    if (action === 'pin') {
        const idx = State.pinnedPhotos.indexOf(file.name);
        if (idx > -1) State.pinnedPhotos.splice(idx, 1);
        else State.pinnedPhotos.push(file.name);
        
        localStorage.setItem('pinned_photos', JSON.stringify(State.pinnedPhotos));
        showToast(idx > -1 ? 'Photo unpinned' : 'Photo pinned to top', 'success');
        renderPhotosView(); 
    } 
    else if (action === 'delete') {
        // Create custom deletion modal
        const overlay = document.createElement('div');
        overlay.className = 'delete-dialog-overlay';
        overlay.innerHTML = `
            <div class="delete-dialog">
                <h3>Delete Memory?</h3>
                <p style="margin-bottom:1rem; opacity:0.8">Enter secret passcode to erase from universe:</p>
                <input type="password" id="del-pass" placeholder="······" maxlength="6" inputmode="numeric">
                <div class="btns">
                    <button class="btn-cancel" id="del-cancel">Cancel</button>
                    <button class="btn-confirm" id="del-confirm">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const input   = overlay.querySelector('input');
        const confirm = overlay.querySelector('#del-confirm');
        const cancel  = overlay.querySelector('#del-cancel');

        input.focus();

        const close = () => overlay.remove();
        cancel.onclick = close;

        const doDelete = async () => {
            if (input.value === CORRECT_PASSCODE) {
                close();
                showToast('Deleting from universe...', 'info');
                try {
                    const path = `${SUPABASE_PHOTO_FOLDER}/${file.name}`;
                    const { error } = await sb.storage.from(SUPABASE_BUCKET).remove([path]);
                    if (error) throw error;
                    
                    showToast('Memory vanished ✨', 'success');
                    card.style.transform = 'scale(0.5)';
                    card.style.opacity = '0';
                    setTimeout(() => renderPhotosView(), 500);
                } catch (err) {
                    console.error('Delete failed:', err);
                    showToast('Delete failed ⚠️', 'error');
                }
            } else {
                input.style.borderColor = 'var(--red)';
                input.style.animation = 'shake 0.4s';
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                setTimeout(() => { input.style.animation = ''; input.value = ''; }, 400);
            }
        };

        confirm.onclick = doDelete;
        input.onkeydown = (e) => { if (e.key === 'Enter') doDelete(); };
    }
}

// Toast helper — show a small notification at bottom of screen
let _toastTimer = null;
function showToast(msg, type = 'info') {
    const toast = document.getElementById('upload-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className   = `upload-toast upload-toast--${type} visible`;
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => {
        toast.classList.remove('visible');
    }, type === 'success' ? 3000 : 2000);
}

// ================================================================
// 9. VIDEOS VIEW  — YouTube embeds from config.js VIDEOS array
// ================================================================
function renderVideosView() {
    const html = VIDEOS.map(v => `
        <div class="video-card">
            <p class="video-card__title">
                <i class="fab fa-youtube" aria-hidden="true"></i>${v.title}
            </p>
            <div class="video-embed">
                <iframe
                    src="https://www.youtube.com/embed/${v.id}?rel=0&playsinline=1&modestbranding=1"
                    title="${v.title}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    loading="lazy">
                </iframe>
            </div>
        </div>`).join('');

    elContentArea.innerHTML = `
        <div class="section-wrap view-enter">
            <h2 class="section-title">Our Stories</h2>
            <p class="section-subtitle">Moments captured in motion</p>
            <div class="videos-list">${html || '<p style="text-align:center;opacity:.4">No videos yet.</p>'}</div>
        </div>`;
}

// ================================================================
// 10. LETTERS VIEW
// ================================================================
function renderLettersView() {
    const envelopesArr = LOVE_LETTERS.map((letter, i) => `
        <div class="envelope" data-letter="${i}" role="button" aria-label="Open letter ${i+1}" tabindex="0">
            <div class="envelope__flap"></div>
            <div class="envelope__body">
                <p class="letter__number">Letter ${toRoman(i + 1)}</p>
                <h3 class="letter__title">${escHtml(letter.title)}</h3>
                <p class="envelope__hint">tap to read</p>
            </div>
        </div>`).join('');

    elContentArea.innerHTML = `
        <div class="section-wrap view-enter">
            <h2 class="section-title">Love Letters</h2>
            <p class="section-subtitle">Heartfelt notes just for you</p>
            <div class="letters-list">${envelopesArr}</div>
        </div>`;

    // Open modal on click
    elContentArea.querySelectorAll('.envelope').forEach(env => {
        function open(e) {
            if (e.type === 'touchend') e.preventDefault();
            const i = env.dataset.letter;
            const letter = LOVE_LETTERS[i];
            
            elModalTitle.textContent = letter.title;
            elModalBody.textContent = letter.content;
            if (letter.isPoem) elModalBody.classList.add('letter__text--poem');
            else elModalBody.classList.remove('letter__text--poem');

            elLetterModal.classList.add('visible');
            elLetterModal.setAttribute('aria-hidden', 'false');
        }
        env.addEventListener('click',    open);
        env.addEventListener('touchend', open, { passive: false });
    });
}

// Close Letter Modal
elLetterClose.addEventListener('click', () => {
    elLetterModal.classList.remove('visible');
    elLetterModal.setAttribute('aria-hidden', 'true');
});
elLetterModal.addEventListener('click', (e) => {
    if (e.target === elLetterModal) {
        elLetterModal.classList.remove('visible');
        elLetterModal.setAttribute('aria-hidden', 'true');
    }
});

// ================================================================
// 12. BIRTHDAY CAKE & CONFETTI
// ================================================================

function launchConfetti() {
    const colors = ['#ffccf2', '#b3e5ff', '#ffd700', '#69db7c', '#ff6b6b'];
    const shapes = ['★', '❤', '●', '✦'];
    
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-p';
        p.textContent = shapes[Math.floor(Math.random() * shapes.length)];
        p.style.color = colors[Math.floor(Math.random() * colors.length)];
        p.style.fontSize = (Math.random() * 20 + 10) + 'px';
        p.style.left = '50%';
        p.style.top = '50%';
        document.body.appendChild(p);

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 500 + 200;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        gsap.to(p, {
            x: tx,
            y: ty,
            rotation: Math.random() * 720,
            opacity: 0,
            duration: Math.random() * 2 + 1.5,
            ease: 'power2.out',
            onComplete: () => p.remove()
        });
    }
}

function initCakeLogic() {
    let cakeTapped = false;
    
    function onCakeTap(e) {
        if (cakeTapped) return;
        if (e.type === 'touchstart') e.preventDefault();
        cakeTapped = true;

        // 1. Light candle
        elCakeFlame.classList.add('flame-active');
        
        // 2. Confetti explosion
        setTimeout(launchConfetti, 300);

        // 3. Reveal text
        setTimeout(() => {
            elHeroTitle.classList.add('revealed');
        }, 500);

        // 4. Cake Fades Out after 4 seconds
        setTimeout(() => {
            gsap.to(elCake, {
                opacity: 0,
                y: -50,
                duration: 1.5,
                ease: 'power2.in',
                onComplete: () => {
                    elCake.style.display = 'none';
                    // Show menu tip if not already seen
                    gsap.to('.hero-cta', { opacity: 1, duration: 1 });
                }
            });
        }, 4000);
    }

    elCake.addEventListener('click', onCakeTap);
    elCake.addEventListener('touchstart', onCakeTap, { passive: false });
}

// ================================================================
// 11. GAMES VIEW
// ================================================================
function renderGamesView() {
    elContentArea.innerHTML = `
        <div class="section-wrap view-enter">
            <h2 class="section-title">Games Zone</h2>
            <p class="section-subtitle">Let's play, birthday girl!</p>

            <div class="games-tabs" role="tablist">
                <button class="game-tab active" data-game="memory" role="tab" aria-selected="true">Memory Match</button>
                <button class="game-tab" data-game="catch"  role="tab" aria-selected="false">Catch the Love</button>
                <button class="game-tab" data-game="secret" role="tab" aria-selected="false">Secret Code</button>
            </div>

            <!-- Memory Match -->
            <div class="game-panel active" id="gp-memory" role="tabpanel">
                <div class="memory-grid" id="memory-grid"></div>
                <p class="memory-status" id="memory-status"></p>
            </div>

            <!-- Catch the Love -->
            <div class="game-panel" id="gp-catch" role="tabpanel">
                <canvas id="catch-canvas"></canvas>
                <p class="catch-status" id="catch-status">Move / drag to catch falling hearts ❤️</p>
            </div>

            <!-- Secret Code -->
            <div class="game-panel" id="gp-secret" role="tabpanel">
                <div class="secret-wrap">
                    <p class="secret-hint">
                        What is our special number?<br>
                        <small style="opacity:.45">(Hint: you used it to get in here 😉)</small>
                    </p>
                    <input type="password" id="secret-input" class="secret-input"
                           maxlength="6" inputmode="numeric" placeholder="······"
                           autocomplete="off">
                    <br>
                    <button class="btn-unlock" id="btn-unlock">Unlock ✨</button>
                    <p class="secret-reveal" id="secret-reveal">
                        "Every moment with you defies gravity. — Nitin"
                    </p>
                </div>
            </div>
        </div>`;

    // Tab switching
    elContentArea.querySelectorAll('.game-tab').forEach(tab => {
        function switchTab(e) {
            if (e.type === 'touchend') e.preventDefault();
            const id = tab.dataset.game;
            elContentArea.querySelectorAll('.game-tab').forEach(t => {
                t.classList.toggle('active', t === tab);
                t.setAttribute('aria-selected', String(t === tab));
            });
            elContentArea.querySelectorAll('.game-panel').forEach(p => p.classList.remove('active'));
            document.getElementById('gp-' + id).classList.add('active');

            if (id === 'memory') initMemoryGame();
            if (id === 'catch')  initCatchGame();
        }
        tab.addEventListener('click',    switchTab);
        tab.addEventListener('touchend', switchTab, { passive: false });
    });

    // Secret unlock
    document.getElementById('btn-unlock').addEventListener('click', checkSecret);
    document.getElementById('btn-unlock').addEventListener('touchend', (e) => { e.preventDefault(); checkSecret(); }, { passive: false });
    document.getElementById('secret-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkSecret(); });

    // Init default tab
    State.memInitDone = false;
    State.memMatched  = 0;
    initMemoryGame();
}

/* ─── Memory Match ─── */
const EMOJIS = ['❤️','🌟','🚀','🍰','💍','🌸','🦋','🎂'];

function initMemoryGame() {
    if (State.memInitDone) return;
    State.memInitDone = true;
    State.memMatched  = 0;
    State.memLocked   = false;

    const grid  = document.getElementById('memory-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const pairs = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
    let flipped = [];

    pairs.forEach(emoji => {
        const card = document.createElement('div');
        card.className = 'mem-card';
        card.dataset.emoji = emoji;
        card.innerHTML = `<span class="mem-face">${emoji}</span>`;

        function flip(e) {
            if (e.type === 'touchend') e.preventDefault();
            if (State.memLocked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
            card.classList.add('flipped');
            flipped.push(card);
            if (flipped.length === 2) checkMemoryPair();
        }
        card.addEventListener('click',    flip);
        card.addEventListener('touchend', flip, { passive: false });
        grid.appendChild(card);
    });
}

function checkMemoryPair() {
    State.memLocked = true;
    const [a, b] = document.querySelectorAll('.mem-card.flipped:not(.matched)');
    if (!a || !b) { State.memLocked = false; return; }

    if (a.dataset.emoji === b.dataset.emoji) {
        a.classList.add('matched'); b.classList.add('matched');
        a.classList.remove('flipped'); b.classList.remove('flipped');
        State.memMatched += 2;
        State.memLocked = false;
        if (State.memMatched === EMOJIS.length * 2) {
            const status = document.getElementById('memory-status');
            if (status) status.textContent = '🎉 You matched them all! You know us best! 💖';
            launchConfetti();
        }
    } else {
        setTimeout(() => {
            a.classList.remove('flipped'); b.classList.remove('flipped');
            State.memLocked = false;
        }, 820);
    }
}

/* ─── Catch the Love ─── */
const REASONS = ['Your laugh 😄','Your kindness 💗','Our shared dreams ✨','Your smile 🌸','Everything about you! 💖','Your hugs 🤗','Just… you 🌟'];

function initCatchGame() {
    if (State.catchRAF) { cancelAnimationFrame(State.catchRAF); State.catchRAF = null; }

    const canvas = document.getElementById('catch-canvas');
    if (!canvas) return;

    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');

    let catcherX = canvas.width / 2;
    let catches  = 0;
    let hearts   = [];

    const rect = canvas.getBoundingClientRect();

    function updateCatcher(clientX) {
        catcherX = clientX - canvas.getBoundingClientRect().left;
    }
    canvas.addEventListener('mousemove', (e) => updateCatcher(e.clientX));
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); updateCatcher(e.touches[0].clientX); }, { passive: false });

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Catcher
        ctx.font = '26px serif';
        ctx.textAlign = 'center';
        ctx.fillText('👐', catcherX, canvas.height - 14);

        // Spawn
        if (Math.random() < 0.04) {
            hearts.push({ x: Math.random() * canvas.width, y: -20, speed: 1.6 + Math.random() * 1.8 });
        }

        hearts.forEach((h, i) => {
            h.y += h.speed;
            ctx.fillText('❤️', h.x, h.y);
            // Catch check
            if (h.y > canvas.height - 55 && Math.abs(h.x - catcherX) < 26) {
                hearts.splice(i, 1);
                catches++;
                const st = document.getElementById('catch-status');
                if (st) st.textContent = `Caught! I love you for: ${REASONS[(catches - 1) % REASONS.length]}`;
                if (catches === 7) {
                    if (st) st.textContent = '🎉 Surprise Unlocked! You are my universe! 💖';
                    launchConfetti();
                }
            } else if (h.y > canvas.height) {
                hearts.splice(i, 1);
            }
        });

        State.catchRAF = requestAnimationFrame(loop);
    }
    loop();
}

/* ─── Secret Code ─── */
function checkSecret() {
    const input  = document.getElementById('secret-input');
    const reveal = document.getElementById('secret-reveal');
    if (input.value.trim() === CORRECT_PASSCODE) {
        reveal.classList.add('visible');
        launchConfetti();
    } else {
        input.style.borderColor = 'var(--red)';
        setTimeout(() => { input.style.borderColor = ''; }, 800);
        if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
    }
}

// ================================================================
// 12. SETTINGS VIEW
// ================================================================
function renderSettingsView() {
    elContentArea.innerHTML = `
        <div class="section-wrap view-enter">
            <h2 class="section-title">Settings</h2>
            <p class="section-subtitle">Personalise your universe</p>
            <div class="settings-list">
                <div class="setting-row">
                    <span class="setting-label"><i class="fas fa-music" aria-hidden="true"></i>Cosmic Music</span>
                    <button class="toggle ${State.musicOn ? 'on' : ''}" id="music-toggle" aria-label="Toggle music" aria-pressed="${State.musicOn}"></button>
                </div>
                <div class="setting-row">
                    <span class="setting-label"><i class="fas fa-star" aria-hidden="true"></i>Particle Stars</span>
                    <button class="toggle ${State.starsOn ? 'on' : ''}" id="stars-toggle" aria-label="Toggle stars" aria-pressed="${State.starsOn}"></button>
                </div>
                <button class="btn-logout" id="settings-logout">
                    <i class="fas fa-lock" aria-hidden="true"></i> Lock Site
                </button>
                <div class="settings-credit">
                    The Gravity of Us &mdash; built with love &amp; code<br>
                    by <a href="https://instagram.com/odincalm0" target="_blank" rel="noopener">@odincalm0</a>
                </div>
            </div>
        </div>`;

    // Music toggle
    const musicBtn = document.getElementById('music-toggle');
    musicBtn.addEventListener('click', () => {
        State.musicOn = !State.musicOn;
        musicBtn.classList.toggle('on', State.musicOn);
        musicBtn.setAttribute('aria-pressed', String(State.musicOn));
        if (State.musicOn) {
            if (!elAudio.src || elAudio.src === window.location.href) elAudio.src = MUSIC_URL;
            elAudio.play().catch(() => {});
        } else {
            elAudio.pause();
        }
    });

    // Stars toggle
    const starsBtn = document.getElementById('stars-toggle');
    starsBtn.addEventListener('click', () => {
        State.starsOn = !State.starsOn;
        starsBtn.classList.toggle('on', State.starsOn);
        starsBtn.setAttribute('aria-pressed', String(State.starsOn));
        _setStarsVisible(State.starsOn);
    });

    // Logout
    document.getElementById('settings-logout').addEventListener('click', logout);
}

// ================================================================
// 13. LIGHTBOX
// ================================================================
function openLightbox(url, caption) {
    elLbImg.src = url;
    elLbCaption.textContent = caption || '';
    elLightbox.classList.add('open');
    elLightbox.removeAttribute('aria-hidden');
}
function closeLightbox() {
    elLightbox.classList.remove('open');
    elLightbox.setAttribute('aria-hidden', 'true');
    elLbImg.src = '';
}

elLbClose.addEventListener('click',    closeLightbox);
elLbClose.addEventListener('touchend', (e) => { e.preventDefault(); closeLightbox(); }, { passive: false });
elLightbox.addEventListener('click', (e) => { if (e.target === elLightbox) closeLightbox(); });

// Confetti logic moved to Section 12 for unified management.

// ================================================================
// 15. HELPERS
// ================================================================
function escHtml(str) {
    return str
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}

function toRoman(n) {
    const map = [['VI','6'],['V','5'],['IV','4'],['III','3'],['II','2'],['I','1']];
    for (const [r, v] of map) if (n >= parseInt(v)) return r;
    return n;
}

// ================================================================
// 16. BOOT
// ================================================================
// The canvas sits at z-index -1 so the gatekeeper overlay is clickable.
// We attach the tap-to-gatekeeper on the intro overlay (which overlaps everything
// until the user logs in).
elGatekeeper.addEventListener('click', (e) => {
    // Only trigger if clicking the backdrop, not the card itself
    if (e.target === elGatekeeper) {
        /* No-op: user must use the keypad */
    }
});

// Done — all listeners are in place, gatekeeper is visible by default.
initCakeLogic();

}); // end DOMContentLoaded
