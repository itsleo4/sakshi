import {
    SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET,
    SUPABASE_PHOTO_FOLDER, SUPABASE_FEATURED_PHOTO,
    CORRECT_PASSCODE, MUSIC_URL, CHEERS_URL, YOUTUBE_API_KEY,
    YOUTUBE_PLAYLIST_ID, LOVE_LETTERS
} from './config.js';
import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights();

/* =============================================================
   app.js  —  The Gravity of Us (Ultimate Unified Version)
   ============================================================= */

document.addEventListener('DOMContentLoaded', () => {

// ================================================================
// 1. STATE
// ================================================================
const State = {
    loggedIn:      false,
    sbLoggedIn:    false,
    currentView:   'hero',
    musicOn:       false,
    starsOn:       true,
    catchRAF:      null,
    memLocked:     false,
    memMatched:    0,
    memInitDone:   false,
    pinnedPhotos:  JSON.parse(localStorage.getItem('pinned_photos') || '[]'),
    favoritePhotos: JSON.parse(localStorage.getItem('favorite_photos') || '[]'),
    photoList: [],
    photoIndex: 0,
    ytNextPageToken: null,
    notes: [],
    activeNote: null
};

// ================================================================
// 2. ELEMENT REFERENCES
// ================================================================
const elGatekeeper      = document.getElementById('gatekeeper');
const elBdayReveal      = document.getElementById('birthday-reveal');
const elCloseReveal     = document.getElementById('close-reveal');
const elMainApp         = document.getElementById('main-app');
const elPassDots        = document.getElementById('pass-dots');
const elKeypad          = document.getElementById('keypad');
const elHamburger       = document.getElementById('hamburger-btn');
const elSidebarOverlay  = document.getElementById('sidebar-overlay');
const elSidebar         = document.getElementById('sidebar-menu');
const elContentArea     = document.getElementById('content-area');
const elHeroSection     = document.getElementById('hero-section');
const elFooter          = document.getElementById('footer');
const elLightbox        = document.getElementById('lightbox');
const elLbImg           = document.getElementById('lb-img');
const elLbClose         = document.getElementById('lb-close');
const elLbFav           = document.getElementById('lb-fav');
const elAudio           = document.getElementById('bg-audio');
const elBhCanvas        = document.getElementById('bh-canvas');
const elHeroHeading     = document.getElementById('hero-heading');
const elHeroSubheading  = document.getElementById('hero-subheading');

// Note Editor Elements
const elNoteEditorModal = document.getElementById('note-editor-modal');
const elNoteEditTitle   = document.getElementById('note-edit-title');
const elNoteEditBody    = document.getElementById('note-edit-body');
const elNoteEditDate    = document.getElementById('note-edit-date');
const elNoteSaveBtn     = document.getElementById('note-editor-save');
const elNoteBackBtn     = document.getElementById('note-editor-back');
const elNotePinBtn      = document.getElementById('note-editor-pin');
const elNoteOptionsBtn  = document.getElementById('note-editor-options');
const elNoteContextMenu = document.getElementById('note-context-menu');
const elNoteOptionsMenu = document.getElementById('note-options-menu');
const elGlobalSettingsMenu = document.getElementById('global-settings-menu');

// Sign In Elements
const elSigninOverlay   = document.getElementById('signin-overlay');
const elSigninForm      = document.getElementById('signin-form');
const elSigninEmail     = document.getElementById('signin-email');
const elSigninPass      = document.getElementById('signin-password');
const elSigninError     = document.getElementById('signin-error');
const elSigninSubmit    = document.getElementById('signin-submit-btn');
const elPassToggle      = document.getElementById('toggle-password-btn');
const elPassIcon        = document.getElementById('toggle-password-icon');

// New 2-Step Elements
const elSigninStep1     = document.getElementById('signin-step-1');
const elSigninStep2     = document.getElementById('signin-step-2');
const elSigninNextBtn   = document.getElementById('signin-next-btn');
const elSigninBackStep  = document.getElementById('signin-back-step');
const elDisplayEmail    = document.getElementById('display-entered-email');
const elSigninCancel    = document.getElementById('signin-cancel-btn');

// ================================================================
// 3. SUPABASE INIT
// ================================================================
let sb;
try {
    // Robust check for supabase client
    if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_KEY) {
        sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase initialized successfully");
    } else {
        console.warn("Supabase configuration missing or library not loaded");
    }
} catch (e) { 
    console.error('Supabase init failed:', e); 
}

// ================================================================
// 4. PASSCODE & UNLOCK
// ================================================================
let passBuffer = '';
let unlockInProgress = false;

function updatePassDisplay() {
    if (!elPassDots) return;
    elPassDots.innerHTML = '';
    for (let i = 0; i < passBuffer.length; i++) {
        const dot = document.createElement('span');
        dot.textContent = '●';
        dot.className = 'dot-pop';
        elPassDots.appendChild(dot);
    }
}

function handlePassKey(key) {
    if (unlockInProgress) return;
    if (key === 'clear') {
        passBuffer = passBuffer.slice(0, -1);
    } else if (key === 'enter') {
        attemptUnlock();
    } else if (passBuffer.length < 6) {
        passBuffer += key;
        if (navigator.vibrate) navigator.vibrate(20);
        if (passBuffer.length === 6) setTimeout(attemptUnlock, 250);
    }
    updatePassDisplay();
}

function attemptUnlock() {
    if (unlockInProgress) return;
    if (passBuffer === CORRECT_PASSCODE) {
        unlockInProgress = true;
        successUnlock();
    } else {
        passBuffer = '';
        updatePassDisplay();
        const card = elGatekeeper?.querySelector('.pass-card');
        if (card) {
            card.classList.remove('shake');
            void card.offsetWidth;
            card.classList.add('shake');
            if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
        }
    }
}

function successUnlock() {
    State.loggedIn = true;
    if (elAudio) {
        elAudio.src = MUSIC_URL;
        elAudio.volume = 0.3;
        elAudio.play().catch(() => {});
        State.musicOn = true;
    }
    if (elGatekeeper) {
        gsap.to(elGatekeeper, { opacity: 0, duration: 0.6, onComplete: () => elGatekeeper.classList.add('hidden') });
    }
    if (window._explodeBlackHole) window._explodeBlackHole();

    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:white;z-index:999;pointer-events:none';
    document.body.appendChild(flash);
    gsap.to(flash, { opacity: 0, duration: 1.2, onComplete: () => flash.remove() });

    setTimeout(() => {
        if (elMainApp) {
            elMainApp.classList.remove('hidden');
            elMainApp.classList.add('visible');
            elMainApp.removeAttribute('aria-hidden');
        }
        navigateTo('hero');
    }, 800);
}

// ================================================================
// 5. BLACK HOLE (INTRO)
// ================================================================
;(function initBlackHole() {
    if (!elBhCanvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas: elBhCanvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;

    const singularity = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 48), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    scene.add(singularity);

    const rim = new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 32), new THREE.MeshBasicMaterial({ color: 0xF7C6C7, transparent: true, opacity: 0.3, side: THREE.BackSide }));
    scene.add(rim);

    const COUNT = window.innerWidth < 480 ? 600 : 1000;
    const diskGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 1.4 + Math.random() * 2.5;
        posArr[i*3] = Math.cos(a) * r;
        posArr[i*3+1] = (Math.random() - 0.5) * 0.15;
        posArr[i*3+2] = Math.sin(a) * r;
        speeds[i] = 0.004 + Math.random() * 0.006;
    }
    diskGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const diskMesh = new THREE.Points(diskGeo, new THREE.PointsMaterial({ size: 0.04, color: 0xF7C6C7, transparent: true, blending: THREE.AdditiveBlending }));
    scene.add(diskMesh);

    function tick() {
        requestAnimationFrame(tick);
        const positions = diskGeo.attributes.position.array;
        for (let i = 0; i < COUNT; i++) {
            const x = positions[i*3], z = positions[i*3+2];
            const a = Math.atan2(z, x) + speeds[i];
            const r = Math.sqrt(x*x + z*z);
            positions[i*3] = Math.cos(a) * r;
            positions[i*3+2] = Math.sin(a) * r;
        }
        diskGeo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }
    tick();

    window._explodeBlackHole = () => {
        gsap.to(singularity.scale, { x: 0, y: 0, z: 0, duration: 0.8, ease: 'power3.in' });
        gsap.to(diskMesh.material, { opacity: 0, duration: 1 });
        gsap.to(rim.material, { opacity: 0, duration: 0.8 });
    };

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();

// ================================================================
// 6. NAVIGATION & SIDEBAR
// ================================================================
function openSidebar() {
    elSidebar.classList.add('open');
    elSidebarOverlay.classList.add('visible');
    elHamburger.setAttribute('aria-expanded', 'true');
}
function closeSidebar() {
    elSidebar.classList.remove('open');
    elSidebarOverlay.classList.remove('visible');
    elHamburger.setAttribute('aria-expanded', 'false');
}

elHamburger.onclick = openSidebar;
elSidebarOverlay.onclick = closeSidebar;

document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.onclick = () => navigateTo(btn.dataset.view);
});

function navigateTo(view) {
    console.log("Navigating to view:", view);
    State.currentView = view;
    closeSidebar();
    
    // Update active button state
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.view === view);
    });

    // Check if section is restricted
    const restricted = ['photos', 'videos', 'streamtape', 'letters'];
    if (restricted.includes(view) && !State.sbLoggedIn) {
        openSignin(view);
        return;
    } else {
        // ALWAYS hide sign-in overlay when entering safe sections
        if (elSigninOverlay) elSigninOverlay.classList.add('hidden');
    }

    const isHero = view === 'hero';

    // Global layout switching
    if (isHero) {
        document.body.classList.add('view-hero');
    } else {
        document.body.classList.remove('view-hero');
        const searchWrap = document.getElementById('search-input-container');
        if (searchWrap) searchWrap.style.display = 'none';
    }

    if (elHeroSection) elHeroSection.style.display = isHero ? 'flex' : 'none';
    if (elContentArea) elContentArea.style.display = isHero ? 'none' : 'block';
    if (elFooter) elFooter.style.display = isHero ? 'flex' : 'none';

    if (isHero) {
        if (elContentArea) elContentArea.innerHTML = '';
        if (typeof init3DHero === 'function') init3DHero();
        return;
    }

    // Stop background animations if needed
    if (State.catchRAF) cancelAnimationFrame(State.catchRAF);

    // Call the appropriate renderer
    const renderers = {
        photos:     renderPhotosView,
        videos:     renderVideosView,
        streamtape: renderStreamTapeView,
        letters:    renderLettersView,
        settings:   renderSettingsView,
    };

    if (renderers[view]) {
        console.log("Executing renderer for:", view);
        renderers[view]();
    } else {
        console.warn("No renderer found for view:", view);
    }
}

// ================================================================
// 7. SUPABASE AUTH
// ================================================================
let pendingView = null;
function openSignin(view) {
    pendingView = view;
    elSigninOverlay.classList.remove('hidden');
    elSigninError.classList.add('hidden');
    
    // Reset to step 1
    elSigninStep1.classList.remove('hidden-step');
    elSigninStep2.classList.add('hidden-step');
    elSigninEmail.value = '';
    elSigninPass.value = '';
    elSigninEmail.focus();
}

function closeSignin() {
    elSigninOverlay.classList.add('hidden');
    pendingView = null;
}

if (elSigninCancel) elSigninCancel.onclick = closeSignin;

if (elSigninNextBtn) {
    elSigninNextBtn.onclick = () => {
        const email = elSigninEmail.value.trim();
        if (!email) {
            elSigninError.textContent = 'Please enter a valid email address.';
            elSigninError.classList.remove('hidden');
            return;
        }
        elSigninError.classList.add('hidden');
        elDisplayEmail.textContent = email;
        
        // Slide up step 1, show step 2
        elSigninStep1.classList.add('hidden-step');
        elSigninStep2.classList.remove('hidden-step');
        
        // Auto focus passcode
        setTimeout(() => elSigninPass.focus(), 300);
    };
}

if (elSigninBackStep) {
    elSigninBackStep.onclick = () => {
        elSigninStep2.classList.add('hidden-step');
        elSigninStep1.classList.remove('hidden-step');
        elSigninError.classList.add('hidden');
    };
}

if (elPassToggle) {
    elPassToggle.onclick = () => {
        const isPass = elSigninPass.type === 'password';
        elSigninPass.type = isPass ? 'text' : 'password';
        elPassIcon.className = isPass ? 'fas fa-eye' : 'fas fa-eye-slash';
    };
}

if (elSigninForm) {
    elSigninForm.onsubmit = async (e) => {
        e.preventDefault();
        
        // Check if we accidentally submitted on Step 1 (e.g. by hitting Enter)
        if (!elSigninStep1.classList.contains('hidden-step')) {
            elSigninNextBtn.click();
            return;
        }

        elSigninSubmit.disabled = true;
        elSigninSubmit.querySelector('.btn-loader').classList.remove('hidden');
        try {
            const email = elSigninEmail.value.trim();
            const allowedEmail = import.meta.env.VITE_ALLOWED_EMAIL;
            
            // Ensure only the specific email from .env is allowed to attempt login
            if (allowedEmail && email.toLowerCase() !== allowedEmail.toLowerCase()) {
                throw new Error("Unauthorized email address");
            }

            const { error } = await sb.auth.signInWithPassword({ email: email, password: elSigninPass.value });
            if (error) throw error;
            State.sbLoggedIn = true;
            closeSignin();
            if (pendingView) navigateTo(pendingView);
        } catch (err) {
            elSigninError.textContent = 'Incorrect Passcode or Email';
            elSigninError.classList.remove('hidden');
        } finally {
            elSigninSubmit.disabled = false;
            elSigninSubmit.querySelector('.btn-loader').classList.add('hidden');
        }
    };
}

async function logout() {
    if (!confirm('Lock the site?')) return;
    State.loggedIn = false;
    State.sbLoggedIn = false;
    if (sb) await sb.auth.signOut();
    elAudio.pause();
    location.reload();
}
document.getElementById('logout-btn').onclick = logout;

// ================================================================
// 8. PHOTOS VIEW
// ================================================================
async function renderPhotosView(folder = null) {
    // First, fetch data
    const { data } = await sb.storage.from(SUPABASE_BUCKET).list(SUPABASE_PHOTO_FOLDER);
    let files = (data || []).filter(f => f.name !== '.emptyFolderPlaceholder');
    
    // Sort logic
    files.sort((a, b) => {
        const pinA = State.pinnedPhotos.includes(a.name) ? 1 : 0;
        const pinB = State.pinnedPhotos.includes(b.name) ? 1 : 0;
        if (pinA !== pinB) return pinB - pinA;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    const favFiles = files.filter(f => State.favoritePhotos.includes(f.name));

    const getCoverUrl = (fileArray) => {
        if (fileArray.length > 0) {
            return sb.storage.from(SUPABASE_BUCKET).getPublicUrl(`${SUPABASE_PHOTO_FOLDER}/${fileArray[0].name}`).data.publicUrl;
        }
        return 'https://via.placeholder.com/400x400/111111/444444?text=Empty'; // fallback
    };

    if (folder === null) {
        // Show Album Dashboard
        elContentArea.innerHTML = `
            <div class="section-wrap view-enter antigravity-photos">
                <h2 class="section-title text-center" style="margin-top:20px; font-weight:800; font-size:2.2rem; color:#fff;">Galleries</h2>
                
                <!-- Upload Button Top Center -->
                <button class="ag-upload-fab" id="upload-fab">
                    <i class="fas fa-plus"></i>
                </button>
                <input type="file" id="photo-file-input" accept="image/*" style="display:none">
                <div class="upload-toast" id="upload-toast"></div>

                <div class="ag-albums-grid">
                    <div class="ag-album-card" data-folder="ALBUM">
                        <div class="ag-album-cover" style="background-image: url('${getCoverUrl(files)}')"></div>
                        <h3 class="album-title">All Photos</h3>
                        <p class="album-count">${files.length} items</p>
                    </div>
                    <div class="ag-album-card" data-folder="Favorites">
                        <div class="ag-album-cover" style="background-image: url('${getCoverUrl(favFiles)}')"></div>
                        <h3 class="album-title">Favorites <i class="fas fa-heart" style="color:#ff0033;font-size:0.8rem;"></i></h3>
                        <p class="album-count">${favFiles.length} items</p>
                    </div>
                </div>
            </div>
        `;

        document.querySelectorAll('.ag-album-card').forEach(card => {
            card.onclick = () => renderPhotosView(card.dataset.folder);
        });

        const fab = document.getElementById('upload-fab');
        const input = document.getElementById('photo-file-input');
        fab.onclick = () => input.click();

        input.onchange = async () => {
            if (!input.files[0]) return;
            showToast("Uploading...", "info");
            const file = input.files[0];
            const path = `${SUPABASE_PHOTO_FOLDER}/${Date.now()}_${file.name}`;
            const { error } = await sb.storage.from(SUPABASE_BUCKET).upload(path, file);
            if (!error) { showToast("Uploaded!", "success"); renderPhotosView(null); }
        };

        return;
    }

    // Render Grid for specific folder
    const displayFiles = folder === 'Favorites' ? favFiles : files;
    
    State.photoList = displayFiles.map(f => {
        return { 
            name: f.name, 
            url: sb.storage.from(SUPABASE_BUCKET).getPublicUrl(`${SUPABASE_PHOTO_FOLDER}/${f.name}`).data.publicUrl 
        };
    });

    elContentArea.innerHTML = `
        <div class="section-wrap view-enter antigravity-photos">
            <div class="ag-folder-header">
                <button class="ag-back-btn" id="back-to-albums"><i class="fas fa-arrow-left"></i></button>
                <h2 class="section-title" style="margin:0; font-weight:800; font-size:2rem; color:#fff;">${folder === 'ALBUM' ? 'All Photos' : 'Favorites'}</h2>
            </div>

            <!-- Upload Button Top Center -->
            <button class="ag-upload-fab" id="upload-fab">
                <i class="fas fa-plus"></i>
            </button>
            <input type="file" id="photo-file-input" accept="image/*" style="display:none">
            <div class="upload-toast" id="upload-toast"></div>

            <div class="ag-photos-grid" id="photos-grid"></div>

            <div id="photo-context-menu" class="note-context-menu hidden" style="z-index: 9999;">
                <div class="context-menu-item" id="photo-ctx-pin"><i class="fas fa-thumbtack"></i> Pin</div>
                <div class="context-menu-item" id="photo-ctx-fav"><i class="fas fa-heart"></i> Favorite</div>
                <div class="context-menu-item delete" id="photo-ctx-delete"><i class="fas fa-trash"></i> Delete</div>
            </div>
        </div>
    `;

    document.getElementById('back-to-albums').onclick = () => renderPhotosView(null);

    const fab = document.getElementById('upload-fab');
    const input = document.getElementById('photo-file-input');
    fab.onclick = () => input.click();
    input.onchange = async () => {
        if (!input.files[0]) return;
        showToast("Uploading...", "info");
        const file = input.files[0];
        const path = `${SUPABASE_PHOTO_FOLDER}/${Date.now()}_${file.name}`;
        const { error } = await sb.storage.from(SUPABASE_BUCKET).upload(path, file);
        if (!error) { showToast("Uploaded!", "success"); renderPhotosView(folder); }
    };

    const grid = document.getElementById('photos-grid');
    const contextMenu = document.getElementById('photo-context-menu');
    let activePhotoName = null;

    displayFiles.forEach((f, idx) => {
        const url = State.photoList[idx].url;
        const img = document.createElement('div');
        img.className = 'ag-photo-item';

        const isPinned = State.pinnedPhotos.includes(f.name);

        img.innerHTML = `
            <div class="photo-img-wrap">
                <img src="${url}" loading="lazy">
            </div>
            ${isPinned ? '<div class="ag-pin-badge"><i class="fas fa-thumbtack"></i></div>' : ''}
            <button class="ag-photo-dots"><i class="fas fa-ellipsis-v"></i></button>
        `;

        img.querySelector('.photo-img-wrap').onclick = () => openLightboxGallery(idx);

        const dots = img.querySelector('.ag-photo-dots');
        dots.onclick = (e) => {
            e.stopPropagation();
            activePhotoName = f.name;
            const rect = dots.getBoundingClientRect();

            document.getElementById('photo-ctx-fav').innerHTML = State.favoritePhotos.includes(f.name)
                ? '<i class="fas fa-heart-broken"></i> Unfavorite'
                : '<i class="fas fa-heart"></i> Favorite';
            document.getElementById('photo-ctx-pin').innerHTML = State.pinnedPhotos.includes(f.name)
                ? '<i class="fas fa-thumbtack" style="opacity:0.5"></i> Unpin'
                : '<i class="fas fa-thumbtack"></i> Pin';

            contextMenu.style.top = `${rect.bottom + 5}px`;
            contextMenu.style.left = `${rect.left - 120}px`;
            contextMenu.classList.remove('hidden');
        };

        grid.appendChild(img);
    });

    // Hide context menu globally
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.ag-photo-dots') && !e.target.closest('#photo-context-menu')) {
            contextMenu?.classList.add('hidden');
        }
    }, { once: false });

    document.getElementById('photo-ctx-fav').onclick = () => {
        if (!activePhotoName) return;
        if (State.favoritePhotos.includes(activePhotoName)) {
            State.favoritePhotos = State.favoritePhotos.filter(n => n !== activePhotoName);
        } else {
            State.favoritePhotos.push(activePhotoName);
        }
        localStorage.setItem('favorite_photos', JSON.stringify(State.favoritePhotos));
        contextMenu.classList.add('hidden');
        renderPhotosView(folder);
    };

    document.getElementById('photo-ctx-pin').onclick = () => {
        if (!activePhotoName) return;
        if (State.pinnedPhotos.includes(activePhotoName)) {
            State.pinnedPhotos = State.pinnedPhotos.filter(n => n !== activePhotoName);
        } else {
            State.pinnedPhotos.push(activePhotoName);
        }
        localStorage.setItem('pinned_photos', JSON.stringify(State.pinnedPhotos));
        contextMenu.classList.add('hidden');
        renderPhotosView(folder);
    };

    document.getElementById('photo-ctx-delete').onclick = async () => {
        if (!activePhotoName) return;
        if (confirm("Delete this photo?")) {
            await sb.storage.from(SUPABASE_BUCKET).remove([`${SUPABASE_PHOTO_FOLDER}/${activePhotoName}`]);
            State.favoritePhotos = State.favoritePhotos.filter(n => n !== activePhotoName);
            State.pinnedPhotos = State.pinnedPhotos.filter(n => n !== activePhotoName);
            localStorage.setItem('favorite_photos', JSON.stringify(State.favoritePhotos));
            localStorage.setItem('pinned_photos', JSON.stringify(State.pinnedPhotos));
            contextMenu.classList.add('hidden');
            renderPhotosView(folder);
        }
    };
}


// ================================================================
// 9. VIDEOS VIEW
// ================================================================
async function renderVideosView() {
    elContentArea.innerHTML = `
        <div class="section-wrap view-enter">
            <h2 class="section-title">Video Stories</h2>
            <div class="videos-list" id="v-list"></div>
            <button id="load-more-v" class="btn-more hidden">Load More Stories</button>
        </div>`;
    const list = document.getElementById('v-list');
    await fetchVideos(list);
}

async function fetchVideos(container) {
    try {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${YOUTUBE_PLAYLIST_ID}&key=${YOUTUBE_API_KEY}${State.ytNextPageToken ? '&pageToken='+State.ytNextPageToken : ''}`;
        const res = await fetch(url);
        const data = await res.json();

        data.items.forEach(item => {
            const id = item.snippet.resourceId.videoId;
            const title = item.snippet.title;
            const div = document.createElement('div');
            div.className = 'video-card';
            div.innerHTML = `
                <div class="v-frame">
                    <iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen loading="lazy"></iframe>
                </div>
                <div class="v-info">
                    <h3>${escHtml(title)}</h3>
                </div>`;
            container.appendChild(div);
        });

        State.ytNextPageToken = data.nextPageToken;
        const btn = document.getElementById('load-more-v');
        if (btn) btn.classList.toggle('hidden', !State.ytNextPageToken);
    } catch (e) {
        container.innerHTML = `<p class="error">Error connecting to the stars: ${e.message}</p>`;
    }
}

// ================================================================
// 9.5. STREAMTAPE VIDEOS VIEW
// ================================================================
let stLogin = import.meta.env.VITE_STREAMTAPE_LOGIN;
let stKey = import.meta.env.VITE_STREAMTAPE_KEY;
let stAllFiles = [];
let stCurrentPage = 0;
const ST_ITEMS_PER_PAGE = 5;

function stApiUrl(path) {
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    // Use deployed URL as fallback on local so it works during development too
    const proxyBase = isLocal ? 'https://sakshi-phi.vercel.app/api/streamtape' : '/api/streamtape';

    const parsed = new URL(path, 'http://dummy.com');
    const pathname = parsed.pathname;
    const params = parsed.searchParams;

    // Extract action (e.g. dlticket, dl, rename, delete, listfolder, ul)
    const action = pathname.replace('/file/', '');

    const proxyUrl = new URL(proxyBase, window.location.origin);
    proxyUrl.searchParams.set('action', action);

    // Forward the key params
    if (params.has('file')) proxyUrl.searchParams.set('file', params.get('file'));
    if (params.has('ticket')) proxyUrl.searchParams.set('ticket', params.get('ticket'));
    if (params.has('name')) proxyUrl.searchParams.set('name', params.get('name'));

    return proxyUrl.toString();
}

async function renderStreamTapeView() {
    elContentArea.innerHTML = `
        <div class="section-wrap view-enter antigravity-photos" style="position: relative; padding:0;">
            <h2 class="section-title text-center" style="margin-top:20px; font-weight:800; font-size:2.2rem; color:#fff;">Videos</h2>
            
            <button class="ag-upload-fab" id="st-upload-fab" style="position:fixed; top:20px; right:20px; left:auto; transform:none; width:50px; height:50px; z-index:9000;">
                <i class="fas fa-plus"></i>
            </button>

            <!-- The Modal is now handled globally below to fix mobile scroll issues -->

            <div class="yt-mobile-feed" id="st-list" style="display:flex; flex-direction:column; gap:20px; margin-top:20px;"></div>
            
            <div id="st-load-more-trigger" style="height:20px; margin:10px 0; display:flex; justify-content:center; align-items:center;">
                <i class="fas fa-spinner fa-spin hidden" id="st-load-spinner" style="color:#ff0033; font-size:1.5rem;"></i>
            </div>

            <!-- Back to Top Button -->
            <button id="st-back-to-top" class="hidden" style="position:fixed; bottom:20px; left:20px; width:45px; height:45px; border-radius:50%; background:rgba(20,20,20,0.8); border:1px solid #ff0033; color:#ff0033; font-size:1.2rem; display:flex; align-items:center; justify-content:center; z-index:9000; cursor:pointer; transition:all 0.3s;">
                <i class="fas fa-arrow-up"></i>
            </button>

            <div class="upload-toast" id="st-toast"></div>
        </div>
    `;

    // GLOBAL MODAL TELEPORT (Fix for Mobile Fixed Positioning)
    let modal = document.getElementById('st-upload-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'st-upload-modal';
        modal.className = 'hidden';
        modal.style.cssText = 'position:fixed; inset:0; z-index:999999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.9); backdrop-filter:blur(15px); transition:all 0.3s ease; padding:20px;';
        modal.innerHTML = `
            <div class="signin-screen" style="width:100%; max-width:450px; background:#111; border-radius:20px; padding:35px 25px; box-shadow:0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(229,9,20,0.3); transform-origin: top right; transform: scale(0); opacity:0; transition:all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                    <h1 style="color:#fff; font-size:1.5rem; font-weight:800; margin:0; text-transform:uppercase; letter-spacing:1px;">Upload Video</h1>
                    <button id="st-close-btn" style="background:none; border:none; color:#ff0033; font-size:1.5rem; cursor:pointer;"><i class="fas fa-times"></i></button>
                </div>
                <div style="display:flex; flex-direction:column; gap:20px;">
                    <input type="text" id="st-title-input" placeholder="Title your memory..." style="width:100%; background:#222; border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; padding:15px; font-size:1rem; outline:none;">
                    <input type="file" id="st-file-input" accept="video/*" style="display:none;">
                    <button id="st-select-file-btn" style="width:100%; height:120px; background:rgba(229,9,20,0.05); border:2px dashed rgba(229,9,20,0.3); border-radius:15px; color:#ff0033; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; transition:all 0.2s;">
                        <i class="fas fa-film" style="font-size:2rem;"></i>
                        <span>Tap to Select Video</span>
                        <small id="st-selected-filename" style="color:#aaa; font-size:0.8rem; margin-top:5px;"></small>
                    </button>
                    <div id="st-progress-wrapper" class="hidden" style="height:8px; background:#333; border-radius:4px; overflow:hidden;">
                        <div id="st-progress-bar" style="width:0%; height:100%; background:#ff0033; transition:width 0.1s;"></div>
                    </div>
                    <p id="st-progress-text" class="hidden" style="color:#ff0033; font-size:0.8rem; text-align:center; margin:0;">Uploading... 0%</p>
                    <button id="st-submit-btn" style="width:100%; background:#ff0033; color:#fff; border:none; padding:16px; border-radius:12px; font-weight:800; font-size:1.1rem; cursor:pointer; box-shadow:0 10px 20px rgba(229,9,20,0.3);">UPLOAD TO TIME CAPSULE</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    }

    const fab = document.getElementById('st-upload-fab');
    const closeBtn = document.getElementById('st-close-btn');
    const submitBtn = document.getElementById('st-submit-btn');
    const titleInput = document.getElementById('st-title-input');
    const fileInput = document.getElementById('st-file-input');
    const selectFileBtn = modal.querySelector('#st-select-file-btn');
    const filenameDisplay = modal.querySelector('#st-selected-filename');

    selectFileBtn.onclick = () => fileInput.click();
    fileInput.onchange = () => {
        if (fileInput.files.length > 0) {
            filenameDisplay.textContent = "Selected: " + fileInput.files[0].name;
        }
    };

    fab.onclick = () => {
        modal.classList.remove('hidden');
        const contentArea = document.getElementById('content-area');
        if (contentArea) contentArea.style.overflow = 'hidden';

        const screen = modal.querySelector('.signin-screen');
        setTimeout(() => {
            screen.style.transform = 'scale(1)';
            screen.style.opacity = '1';
        }, 10);
    };
    
    closeBtn.onclick = () => {
        const contentArea = document.getElementById('content-area');
        if (contentArea) contentArea.style.overflow = 'auto';

        const screen = modal.querySelector('.signin-screen');
        screen.style.transform = 'scale(0)';
        screen.style.opacity = '0';
        setTimeout(() => modal.classList.add('hidden'), 400);
    };

    selectFileBtn.onclick = () => fileInput.click();
    fileInput.onchange = () => {
        if (fileInput.files.length > 0) {
            filenameDisplay.textContent = fileInput.files[0].name;
            filenameDisplay.style.display = 'block';
        }
    };

    submitBtn.onclick = async () => {
        const title = titleInput.value.trim();
        const file = fileInput.files[0];
        if (!title || !file) {
            alert('Please provide a title and select a video file.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        
        const progWrapper = document.getElementById('st-progress-wrapper');
        const progBar = document.getElementById('st-progress-bar');
        const progText = document.getElementById('st-progress-text');
        
        progWrapper.classList.remove('hidden');
        progText.classList.remove('hidden');
        progBar.style.width = '0%';
        progText.innerText = 'Uploading... 0%';

        try {
            const result = await uploadToStreamTapeWithProgress(file, title, (percent) => {
                progBar.style.width = percent + '%';
                progText.innerText = `Uploading... ${Math.round(percent)}%`;
            });
            
            // Success cleanup
            modal.classList.add('hidden');
            titleInput.value = '';
            fileInput.value = '';
            filenameDisplay.style.display = 'none';
            progWrapper.classList.add('hidden');
            progText.classList.add('hidden');
            
            // UNLOCK SCROLL
            const contentArea = document.getElementById('content-area');
            if (contentArea) contentArea.style.overflow = 'auto';

            // Immediately prepend card
            prependNewVideoCard(result.id, title, new Date().toISOString());
            showSTToast("Video Uploaded Successfully!");
            
            // Silently sync with server
            fetchStreamTapeList(true);
        } catch (e) {
            alert('Upload failed: ' + e.message);
            progText.innerText = 'Error: ' + e.message;
        } finally {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        }
    };

    // Close menus globally
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.st-dots-btn') && !e.target.closest('.st-menu')) {
            document.querySelectorAll('.st-menu').forEach(m => m.classList.add('hidden'));
        }
    });

    // Back to top logic
    const btt = document.getElementById('st-back-to-top');
    const contentArea = document.getElementById('content-area');
    if (btt && contentArea) {
        contentArea.onscroll = () => {
            if (contentArea.scrollTop > 1000) btt.classList.remove('hidden');
            else btt.classList.add('hidden');
        };
        btt.onclick = () => contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Initial load
    await fetchStreamTapeList();

    // Intersection Observer for Infinite Scroll
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && stCurrentPage * ST_ITEMS_PER_PAGE < stAllFiles.length) {
            renderMoreStreamTapeVideos();
        }
    }, { threshold: 0.1 });
    
    observer.observe(document.getElementById('st-load-more-trigger'));
}

async function fetchStreamTapeList(silent = false) {
    const list = document.getElementById('st-list');
    if (!silent) list.innerHTML = '<p style="text-align:center; color:#888;">Loading videos...</p>';
    
    try {
        const url = stApiUrl(`/file/listfolder?login=${stLogin}&key=${stKey}`);
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.status !== 200) throw new Error(data.msg);
        
        stAllFiles = data.result.files || [];
        stAllFiles.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)); // newest first
        
        if (!silent) {
            stCurrentPage = 0;
            list.innerHTML = '';
            renderMoreStreamTapeVideos();
        }
    } catch(e) {
        if (!silent) list.innerHTML = `<p style="text-align:center; color:#ff0033;">Error: ${e.message}</p>`;
    }
}

function renderMoreStreamTapeVideos() {
    const list = document.getElementById('st-list');
    const spinner = document.getElementById('st-load-spinner');
    if (!list) return;
    
    spinner.classList.remove('hidden');
    
    setTimeout(() => {
        const start = stCurrentPage * ST_ITEMS_PER_PAGE;
        const end = start + ST_ITEMS_PER_PAGE;
        const pageFiles = stAllFiles.slice(start, end);
        
        pageFiles.forEach(f => {
            const el = createVideoCardElement(f);
            list.appendChild(el);
        });
        
        stCurrentPage++;
        spinner.classList.add('hidden');
        
        if (stCurrentPage * ST_ITEMS_PER_PAGE >= stAllFiles.length) {
            spinner.parentElement.innerHTML = '<p style="color:#666; font-size:0.9rem;">You have reached the end.</p>';
        }
    }, 500); 
}

function prependNewVideoCard(id, title, created_at) {
    const list = document.getElementById('st-list');
    const f = { linkid: id, name: title, created_at: created_at };
    const el = createVideoCardElement(f);
    list.prepend(el);
}

function createVideoCardElement(f) {
    const list = document.getElementById('st-list');
    const div = document.createElement('div');
    div.className = 'yt-mobile-card';
    div.dataset.id = f.linkid;
    
    div.style.background = '#050505';
    div.style.borderBottom = '1px solid rgba(255,0,51,0.15)';
    div.style.paddingBottom = '20px';
    div.style.position = 'relative';

    const fileSize = f.size ? (f.size / 1048576).toFixed(1) + ' MB' : '';
    const dateStr = new Date(f.created_at).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'});
    const metaText = fileSize ? `Memory Earth • ${fileSize} • ${dateStr}` : `Memory Earth • ${dateStr}`;

    div.innerHTML = `
        <div class="st-video-container" style="position:relative; width:100%; aspect-ratio:16/9; background:#000; cursor:pointer; overflow:hidden;" onclick="loadStreamtapeIframe(this, '${f.linkid}')">
            <!-- Placeholder before iframe loads -->
            <div class="st-placeholder" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:linear-gradient(45deg, #050505, #1a0005);">
                <div style="width:60px; height:60px; border-radius:50%; background:rgba(255,0,51,0.2); border:2px solid #ff0033; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(255,0,51,0.5); transition:transform 0.3s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                    <i class="fas fa-play" style="color:#ff0033; font-size:1.5rem; margin-left:5px;"></i>
                </div>
            </div>
            <button class="st-dots-btn" style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,0,51,0.3); color:#fff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; transition:all 0.2s;" onclick="event.stopPropagation()"><i class="fas fa-ellipsis-v"></i></button>
            
            <div class="st-menu hidden" style="position:absolute; top:40px; right:8px; background:#111; border:1px solid #ff0033; border-radius:8px; padding:5px 0; z-index:20; box-shadow:0 5px 15px rgba(255,0,51,0.3); width:150px;" onclick="event.stopPropagation()">
                <div class="st-menu-item st-pin" style="padding:10px 20px; color:#fff; cursor:pointer; font-size:0.9rem; transition:background 0.2s;"><i class="fas fa-thumbtack" style="margin-right:8px; color:#ff0033;"></i> Pin to Top</div>
                <div class="st-menu-item st-rename" style="padding:10px 20px; color:#fff; cursor:pointer; font-size:0.9rem; transition:background 0.2s;"><i class="fas fa-edit" style="margin-right:8px; color:#ff0033;"></i> Rename</div>
                <div class="st-menu-item st-delete" style="padding:10px 20px; color:#fff; cursor:pointer; font-size:0.9rem; transition:background 0.2s;"><i class="fas fa-trash" style="margin-right:8px; color:#ff0033;"></i> Delete</div>
            </div>
        </div>
        <div style="display:flex; gap:12px; padding:12px 10px 0 10px; align-items:flex-start;">
            <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, #ff0033, #b30024); flex-shrink:0; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; box-shadow:0 0 10px rgba(255,0,51,0.3);">M</div>
            <div style="flex-grow:1; padding-right:10px;">
                <h3 style="font-size:1.05rem; margin:0 0 5px 0; color:#fff; font-weight:600; line-height:1.3; font-family:var(--font-body);">${escHtml(f.name)}</h3>
                <p style="font-size:0.8rem; color:#aaa; margin:0;">${metaText}</p>
            </div>
        </div>
    `;
    
    const dotsBtn = div.querySelector('.st-dots-btn');
    const menu = div.querySelector('.st-menu');
    const deleteBtn = div.querySelector('.st-delete');
    const pinBtn = div.querySelector('.st-pin');
    const renameBtn = div.querySelector('.st-rename');
    
    dotsBtn.onmouseover = () => dotsBtn.style.background = 'rgba(255,0,51,0.8)';
    dotsBtn.onmouseout = () => dotsBtn.style.background = 'rgba(0,0,0,0.6)';

    div.querySelectorAll('.st-menu-item').forEach(item => {
        item.onmouseover = () => item.style.background = 'rgba(255,0,51,0.1)';
        item.onmouseout = () => item.style.background = 'transparent';
    });
    
    dotsBtn.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.st-menu').forEach(m => {
            if (m !== menu) m.classList.add('hidden');
        });
        menu.classList.toggle('hidden');
    };
    
    renameBtn.onclick = async (e) => {
        e.stopPropagation();
        menu.classList.add('hidden');
        const newName = prompt("Enter new title for the video:", f.name);
        if (newName && newName !== f.name) {
            try {
                const url = stApiUrl(`/file/rename?login=${stLogin}&key=${stKey}&file=${f.linkid}&name=${encodeURIComponent(newName)}`);
                const res = await fetch(url);
                const data = await res.json();
                if (data.status === 200) {
                    div.querySelector('h3').textContent = newName;
                    f.name = newName;
                    showSTToast("Video renamed! ✨");
                } else {
                    alert("Rename failed: " + data.msg);
                }
            } catch (err) {
                alert("Error renaming: " + err.message);
            }
        }
    };
    
    deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        menu.classList.add('hidden');
        if (confirm("Delete this video permanently?")) {
            try {
                const delUrl = stApiUrl(`/file/delete?login=${stLogin}&key=${stKey}&file=${f.linkid}`);
                const delRes = await fetch(delUrl);
                const delData = await delRes.json();
                if (delData.status === 200) {
                    div.style.transition = "opacity 0.3s, transform 0.3s";
                    div.style.opacity = "0";
                    div.style.transform = "scale(0.9)";
                    setTimeout(() => div.remove(), 300);
                    showSTToast("Video Deleted");
                } else {
                    alert("Failed: " + delData.msg);
                }
            } catch(err) {
                alert("Error: " + err.message);
            }
        }
    };
    
    pinBtn.onclick = (e) => {
        e.stopPropagation();
        menu.classList.add('hidden');
        list.prepend(div);
        showSTToast("Pinned to top!");
    };

    return div;
}

// Load StreamTape video via direct MP4 URL (2-step API: dlticket → dl)
// We use this approach because StreamTape blocks iframe embeds via X-Frame-Options.
window.loadStreamtapeIframe = function(container, linkid) {
    if (container.querySelector('iframe')) return; // already loaded

    const placeholder = container.querySelector('.st-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    // Create iframe using streamta.pe which is an adblock-resistant mirror
    const iframe = document.createElement('iframe');
    iframe.src = `https://streamta.pe/e/${linkid}`;
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    iframe.allowTransparency = true;
    iframe.allow = "autoplay";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.position = "absolute";
    iframe.style.inset = "0";
    iframe.style.zIndex = "1";
    iframe.style.background = "#000";

    // Ensure the dots/menu button stays on top of the iframe
    const dotsBtn = container.querySelector('.st-dots-btn');
    if (dotsBtn) dotsBtn.style.zIndex = "10";

    container.insertBefore(iframe, container.firstChild);
}

function showSTToast(msg) {
    const t = document.getElementById('st-toast');
    if (t) { 
        t.textContent = msg; 
        t.style.background = '#ff0033';
        t.style.boxShadow = '0 5px 15px rgba(255,0,51,0.4)';
        t.className = `upload-toast visible`; 
        setTimeout(() => t.classList.remove('visible'), 2000); 
    }
}

function uploadToStreamTapeWithProgress(file, title, onProgress) {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Get upload ticket URL (CORS-proxied on localhost)
            const ticketUrl = stApiUrl(`/file/ul?login=${stLogin}&key=${stKey}&name=${encodeURIComponent(title)}`);
            const ticketRes = await fetch(ticketUrl);
            const ticketData = await ticketRes.json();
            if (ticketData.status !== 200) throw new Error(ticketData.msg || 'Could not get upload ticket');

            // 2. Upload file using XMLHttpRequest
            const xhr = new XMLHttpRequest();
            xhr.open('POST', ticketData.result.url, true);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    onProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const uploadData = JSON.parse(xhr.responseText);
                    if (uploadData.status === 200) {
                        // After successful upload, force rename to the user's chosen title
                        const fileId = uploadData.result.id;
                        const renameUrl = stApiUrl(`/file/rename?login=${stLogin}&key=${stKey}&file=${fileId}&name=${encodeURIComponent(title)}`);
                        
                        // We fire the rename and then resolve. We don't necessarily need to wait for rename to finish
                        // but it's better to ensure the title is set before the UI refreshes.
                        fetch(renameUrl)
                            .then(() => resolve(uploadData.result))
                            .catch(() => resolve(uploadData.result)); // Resolve anyway even if rename fails
                    } else {
                        reject(new Error(uploadData.msg || 'Upload failed'));
                    }
                } else {
                    reject(new Error(`Server error: ${xhr.status}`));
                }
            };

            xhr.onerror = () => {
                reject(new Error("Network error during upload"));
            };

            const formData = new FormData();
            formData.append('file1', file);
            formData.append('title', title);

            xhr.send(formData);
        } catch (err) {
            reject(err);
        }
    });
}

// ================================================================
// 10. LETTERS VIEW
// ================================================================
async function renderLettersView() {
    elContentArea.innerHTML = `
        <div class="section-wrap view-enter">
            <header class="letters-header">
                <h2 class="section-title script-font">Love Letters</h2>
                <div class="letters-actions">
                    <div class="search-notes-wrap">
                        <i class="fas fa-search"></i>
                        <input type="text" id="notes-search" placeholder="Search our story...">
                    </div>
                    <button id="global-settings-trigger" class="icon-btn"><i class="fas fa-ellipsis-v"></i></button>
                </div>
            </header>
            <div id="notes-list" class="letters-container"></div>
            <div class="add-note-fab" id="add-n-btn"><i class="fas fa-plus"></i></div>
        </div>`;

    await fetchNotes();
    const list = document.getElementById('notes-list');
    const searchInp = document.getElementById('notes-search');
    const fab = document.getElementById('add-n-btn');
    const settingsBtn = document.getElementById('global-settings-trigger');

    function renderNotesGrid(filter = '') {
        list.innerHTML = '';
        const filtered = State.notes.filter(n =>
            n.title.toLowerCase().includes(filter.toLowerCase()) ||
            n.content.toLowerCase().includes(filter.toLowerCase())
        );

        filtered.forEach(n => {
            const div = document.createElement('div');
            div.className = `note-card ${n.color || 'default'}`;
            div.dataset.id = n.id;
            div.innerHTML = `
                <div class="note-card__pin ${n.is_pinned ? 'visible' : ''}"><i class="fas fa-thumbtack"></i></div>
                <div class="note-card__content">
                    <h3>${escHtml(n.title)}</h3>
                    <p>${escHtml(n.content)}</p>
                </div>
                <div class="note-card__footer">
                    <span>${new Date(n.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                    <button class="note-card__dots" data-id="${n.id}"><i class="fas fa-ellipsis-v"></i></button>
                </div>`;

            div.onclick = (e) => {
                if (e.target.closest('.note-card__dots')) return;
                openNoteEditor(n.id);
            };

            const dots = div.querySelector('.note-card__dots');
            dots.onclick = (e) => {
                e.stopPropagation();
                const rect = dots.getBoundingClientRect();
                State.activeNote = State.notes.find(note => note.id === n.id);
                elNoteContextMenu.style.top = `${rect.bottom + 5}px`;
                elNoteContextMenu.style.left = `${rect.left - 150}px`;
                elNoteContextMenu.classList.remove('hidden');
            };

            list.appendChild(div);
        });
    }

    renderNotesGrid();
    searchInp.oninput = (e) => renderNotesGrid(e.target.value);
    fab.onclick = () => openNoteEditor();
    settingsBtn.onclick = (e) => {
        e.stopPropagation();
        const rect = settingsBtn.getBoundingClientRect();
        elGlobalSettingsMenu.style.top = `${rect.bottom + 10}px`;
        elGlobalSettingsMenu.style.right = `${window.innerWidth - rect.right}px`;
        elGlobalSettingsMenu.classList.remove('hidden');
    };
}

async function fetchNotes() {
    if (!sb) return;
    const { data } = await sb.from('love_letters').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    State.notes = data || [];
}

function openNoteEditor(id = null) {
    const note = id ? State.notes.find(n => n.id === id) : {
        id: crypto.randomUUID(), title: '', content: '', color: 'default', is_pinned: false, created_at: new Date().toISOString()
    };
    State.activeNote = { ...note };
    elNoteEditTitle.value = note.title;
    elNoteEditBody.value = note.content;
    elNoteEditDate.textContent = id ? `Edited ${new Date(note.created_at).toLocaleDateString()}` : 'New Note';
    elNotePinBtn.classList.toggle('active', note.is_pinned);

    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.color === (note.color || 'default'));
    });

    elNoteEditorModal.classList.add('visible');
}

elNoteBackBtn.onclick = () => elNoteEditorModal.classList.remove('visible');
elNoteSaveBtn.onclick = async () => {
    const n = {
        ...State.activeNote,
        title: elNoteEditTitle.value.trim() || 'Untitled',
        content: elNoteEditBody.value.trim(),
        created_at: new Date().toISOString()
    };
    if (sb) await sb.from('love_letters').upsert(n);
    elNoteEditorModal.classList.remove('visible');
    renderLettersView();
    launchConfetti();
};

elNotePinBtn.onclick = async () => {
    State.activeNote.is_pinned = !State.activeNote.is_pinned;
    elNotePinBtn.classList.toggle('active', State.activeNote.is_pinned);
};

// ================================================================
// 12. MEMORY EARTH (3D)
// ================================================================
let earthScene, earthCamera, earthRenderer, earthGroup, memoryPins = [];
let isAnimatingToPin = false;

function init3DHero() {
    const container = document.getElementById('hero-3d-container');
    if (!container || earthRenderer) return;

    earthScene = new THREE.Scene();
    earthCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    earthCamera.position.z = 15;

    earthRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    earthRenderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(earthRenderer.domElement);

    const controls = new THREE.OrbitControls(earthCamera, earthRenderer.domElement);
    controls.autoRotate = true;

    earthScene.add(new THREE.AmbientLight(0xffffff, 0.8));
    earthGroup = new THREE.Group();
    earthScene.add(earthGroup);

    const tex = new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg');
    const earth = new THREE.Mesh(new THREE.SphereGeometry(5, 64, 64), new THREE.MeshPhongMaterial({ map: tex }));
    earthGroup.add(earth);

    fetchMemoryPins();

    function animate() {
        requestAnimationFrame(animate);
        if (!isAnimatingToPin) controls.update();
        earthRenderer.render(earthScene, earthCamera);
    }
    animate();

    bindEarthUI();
}

async function fetchMemoryPins() {
    if (!sb) return;
    const { data } = await sb.from('memories_map').select('*');
    (data || []).forEach(m => {
        const pin = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff4d4d }));
        const pos = latLngToVector3(m.lat, m.lng, 5.1);
        pin.position.copy(pos);
        pin.userData = m;
        earthGroup.add(pin);
        memoryPins.push(pin);
    });
}

function latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(-(radius * Math.sin(phi) * Math.cos(theta)), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

function bindEarthUI() {
    const fabBtn = document.getElementById('search-fab');
    const searchWrap = document.getElementById('search-input-container');
    const searchInp = document.getElementById('search-input');
    const closeFab = document.getElementById('close-search-fab');
    const stickyCls = document.getElementById('sticky-close');

    if (fabBtn) {
        fabBtn.onclick = () => {
            const isVisible = searchWrap.style.display === 'flex';
            searchWrap.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) searchInp.focus();
        };
    }

    if (closeFab) closeFab.onclick = () => searchWrap.style.display = 'none';

    if (searchInp) {
        searchInp.onkeydown = (e) => {
            if (e.key === 'Enter') {
                const keyword = searchInp.value.toLowerCase().trim();
                const match = memoryPins.find(p => p.userData.note.toLowerCase().includes(keyword));
                if (match) {
                    searchWrap.style.display = 'none';
                    focusOnPin(match.userData);
                } else {
                    showToast("Memory not found 🌌", "error");
                }
            }
        };
    }

    if (stickyCls) stickyCls.onclick = () => document.getElementById('sticky-note').classList.remove('active');

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    window.addEventListener('click', (e) => {
        if (!earthCamera || State.currentView !== 'hero') return;
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, earthCamera);
        const hits = raycaster.intersectObjects(memoryPins);
        if (hits.length > 0) showStickyNote(hits[0].object.userData);
    });
}

function focusOnPin(mem) {
    isAnimatingToPin = true;
    const pinPos = latLngToVector3(mem.lat, mem.lng, 12);
    gsap.to(earthCamera.position, { x: pinPos.x, y: pinPos.y, z: pinPos.z, duration: 2, onUpdate: () => earthCamera.lookAt(0,0,0), onComplete: () => { isAnimatingToPin = false; showStickyNote(mem); } });
}

function showStickyNote(mem) {
    const popup = document.getElementById('sticky-note');
    document.getElementById('sticky-img').src = mem.image_url;
    document.getElementById('sticky-text').textContent = mem.note;
    popup.classList.add('active');
}

// ================================================================
// 13. GAMES VIEW
// ================================================================
const EMOJIS = ['💖','💍','🏠','🌍','✨','🌹','👩‍❤️‍👨','🍕'];

function renderGamesView() {
    elContentArea.innerHTML = `
        <div class="section-wrap view-enter">
            <h2 class="section-title">Games Zone</h2>
            <div class="game-tabs">
                <button class="tab-btn active" data-game="memory">Memory Match</button>
                <button class="tab-btn" data-game="catch">Catch the Love</button>
                <button class="tab-btn" data-game="secret">Secret Vault</button>
            </div>
            <div id="game-container" class="game-display"></div>
        </div>`;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadGame(btn.dataset.game);
        };
    });

    loadGame('memory');
}

function loadGame(game) {
    const container = document.getElementById('game-container');
    if (game === 'memory') {
        container.innerHTML = `<div id="memory-status" class="game-status">Find the matching moments...</div><div class="memory-grid" id="m-grid"></div>`;
        initMemoryGame();
    } else if (game === 'catch') {
        container.innerHTML = `<div id="catch-status" class="game-status">Catch the falling hearts!</div><canvas id="catch-canvas"></canvas>`;
        initCatchGame();
    } else {
        container.innerHTML = `
            <div class="secret-game">
                <p>Enter the master code to reveal our secret...</p>
                <input type="password" id="secret-input" placeholder="••••••">
                <button onclick="window._checkSecret()">Unlock Vault</button>
                <div id="secret-reveal" class="hidden">
                    <p class="script-font">I love you more than all the stars in the gravity of us. 💖</p>
                </div>
            </div>`;
    }
}

function initMemoryGame() {
    const grid = document.getElementById('m-grid');
    const cards = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
    State.memMatched = 0;
    grid.innerHTML = '';
    cards.forEach(emoji => {
        const card = document.createElement('div');
        card.className = 'mem-card';
        card.dataset.emoji = emoji;
        card.innerHTML = `<div class="front">?</div><div class="back">${emoji}</div>`;
        card.onclick = () => {
            if (State.memLocked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
            card.classList.add('flipped');
            const flipped = document.querySelectorAll('.mem-card.flipped:not(.matched)');
            if (flipped.length === 2) {
                State.memLocked = true;
                setTimeout(() => {
                    if (flipped[0].dataset.emoji === flipped[1].dataset.emoji) {
                        flipped[0].classList.add('matched'); flipped[1].classList.add('matched');
                        State.memMatched += 2;
                        if (State.memMatched === cards.length) launchConfetti();
                    }
                    flipped[0].classList.remove('flipped'); flipped[1].classList.remove('flipped');
                    State.memLocked = false;
                }, 800);
            }
        };
        grid.appendChild(card);
    });
}

function initCatchGame() {
    const canvas = document.getElementById('catch-canvas');
    if (!canvas) return;
    canvas.width = canvas.offsetWidth; canvas.height = 400;
    const ctx = canvas.getContext('2d');
    let catcherX = canvas.width/2, score = 0, hearts = [];

    canvas.onmousemove = (e) => catcherX = e.offsetX;
    canvas.ontouchmove = (e) => { e.preventDefault(); catcherX = e.touches[0].clientX - canvas.offsetLeft; };

    function gameLoop() {
        if (State.currentView !== 'games') return;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.font = "30px Arial"; ctx.fillText("👐", catcherX - 15, canvas.height - 20);
        if (Math.random() < 0.03) hearts.push({x: Math.random()*canvas.width, y: 0, s: 2+Math.random()*3});
        hearts.forEach((h, i) => {
            h.y += h.s; ctx.fillText("❤️", h.x, h.y);
            if (h.y > canvas.height - 40 && Math.abs(h.x - catcherX) < 30) {
                hearts.splice(i,1); score++;
                document.getElementById('catch-status').textContent = `Score: ${score}`;
            } else if (h.y > canvas.height) hearts.splice(i,1);
        });
        State.catchRAF = requestAnimationFrame(gameLoop);
    }
    gameLoop();
}

window._checkSecret = () => {
    const val = document.getElementById('secret-input').value;
    if (val === CORRECT_PASSCODE) {
        document.getElementById('secret-reveal').classList.remove('hidden');
        launchConfetti();
    }
};

// ================================================================
// 14. SETTINGS VIEW
// ================================================================
function renderSettingsView() {
    elContentArea.innerHTML = `
        <div class="section-wrap view-enter">
            <h2 class="section-title">Settings</h2>
            <div class="settings-list">
                <div class="setting-row">
                    <span>Music</span>
                    <button class="toggle ${State.musicOn ? 'on' : ''}" id="music-toggle"></button>
                </div>
                <div class="setting-row">
                    <span>Particles</span>
                    <button class="toggle ${State.starsOn ? 'on' : ''}" id="stars-toggle"></button>
                </div>
                <button class="btn-logout" id="settings-logout">Lock Site</button>
            </div>
        </div>`;

    document.getElementById('music-toggle').onclick = (e) => {
        State.musicOn = !State.musicOn;
        e.target.classList.toggle('on', State.musicOn);
        State.musicOn ? elAudio.play() : elAudio.pause();
    };
    document.getElementById('settings-logout').onclick = logout;
}

// ================================================================
// 15. HELPERS
// ================================================================
function openLightboxGallery(index) {
    if (!State.photoList || State.photoList.length === 0) return;
    State.photoIndex = index;
    updateLightboxUI();
    elLightbox.classList.add('open');
}

function updateLightboxUI(direction = null) {
    const photo = State.photoList[State.photoIndex];
    
    if (direction) {
        elLbImg.style.transition = 'none';
        elLbImg.style.transform = `translateX(${direction === 'next' ? '50px' : '-50px'})`;
        elLbImg.style.opacity = '0';
        
        void elLbImg.offsetWidth; // Force reflow
        
        elLbImg.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        elLbImg.style.transform = 'translateX(0)';
        elLbImg.style.opacity = '1';
    } else {
        elLbImg.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        elLbImg.style.transform = 'translateX(0)';
        elLbImg.style.opacity = '1';
    }
    
    elLbImg.src = photo.url;
    elLbFav.innerHTML = State.favoritePhotos.includes(photo.name)
        ? '<i class="fas fa-heart" style="color:#ff0033;"></i>'
        : '<i class="far fa-heart"></i>';
}

elLbFav.onclick = () => {
    const photo = State.photoList[State.photoIndex];
    if (State.favoritePhotos.includes(photo.name)) {
        State.favoritePhotos = State.favoritePhotos.filter(n => n !== photo.name);
    } else {
        State.favoritePhotos.push(photo.name);
        launchConfetti();
    }
    localStorage.setItem('favorite_photos', JSON.stringify(State.favoritePhotos));
    updateLightboxUI();

    if (State.currentView === 'photos') {
        const activeTab = document.querySelector('.ag-back-btn');
        if (activeTab) renderPhotosView(document.querySelector('.section-title').textContent === 'All Photos' ? 'ALBUM' : 'Favorites');
    }
};

elLbClose.onclick = () => {
    elLightbox.classList.remove('open');
};

// Swipe support for Lightbox
let touchStartX = 0;
let touchStartY = 0;
elLightbox.addEventListener('touchstart', e => { 
    touchStartX = e.changedTouches[0].screenX; 
    touchStartY = e.changedTouches[0].screenY;
}, {passive: true});

elLightbox.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    // Check vertical swipe down to close
    if (touchEndY > touchStartY + 60 && Math.abs(touchEndX - touchStartX) < 50) {
        elLightbox.classList.remove('open');
        return;
    }
    
    // Check horizontal swipe
    if (touchEndX < touchStartX - 40 && Math.abs(touchEndY - touchStartY) < 60) {
        // swipe left (next)
        if (State.photoIndex < State.photoList.length - 1) {
            State.photoIndex++;
            updateLightboxUI('next');
        }
    } else if (touchEndX > touchStartX + 40 && Math.abs(touchEndY - touchStartY) < 60) {
        // swipe right (prev)
        if (State.photoIndex > 0) {
            State.photoIndex--;
            updateLightboxUI('prev');
        }
    }
}, {passive: true});

function launchConfetti() {
    for (let i = 0; i < 50; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random()*100 + 'vw';
        c.style.backgroundColor = `hsl(${Math.random()*360}, 70%, 60%)`;
        c.style.animationDuration = 1 + Math.random()*2 + 's';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 3000);
    }
}

function showToast(msg, type) {
    const t = document.getElementById('upload-toast');
    if (t) { t.textContent = msg; t.className = `upload-toast visible ${type}`; setTimeout(() => t.classList.remove('visible'), 2000); }
}

function escHtml(str) {
    if (!str) return "";
    const d = document.createElement('div'); d.textContent = str; return d.innerHTML;
}

// ================================================================
// 16. BOOT
// ================================================================
document.body.onclick = () => {
    if (elNoteContextMenu) elNoteContextMenu.classList.add('hidden');
    if (elGlobalSettingsMenu) elGlobalSettingsMenu.classList.add('hidden');
};

const keypad = document.getElementById('keypad');
if (keypad) {
    keypad.onclick = (e) => {
        const key = e.target.closest('.key');
        if (key) handlePassKey(key.dataset.key);
    };
}

init3DHero();

}); // End DOMContentLoaded
