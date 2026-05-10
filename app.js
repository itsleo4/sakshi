import {
    SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET,
    SUPABASE_PHOTO_FOLDER, SUPABASE_FEATURED_PHOTO,
    CORRECT_PASSCODE, MUSIC_URL, CHEERS_URL, YOUTUBE_API_KEY,
    YOUTUBE_PLAYLIST_ID, LOVE_LETTERS
} from './config.js';

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
const elSigninBack      = document.getElementById('signin-back-btn');
const elSigninSubmit    = document.getElementById('signin-submit-btn');
const elPassToggle      = document.getElementById('toggle-password-btn');
const elPassIcon        = document.getElementById('toggle-password-icon');

// ================================================================
// 3. SUPABASE INIT
// ================================================================
let sb;
try {
    if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_KEY) {
        sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) { console.error('Supabase init failed:', e); }

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
    State.currentView = view;
    closeSidebar();
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));

    const restricted = ['photos', 'videos', 'letters'];
    if (restricted.includes(view) && !State.sbLoggedIn) {
        openSignin(view);
        return;
    }

    const isHero = view === 'hero';

    if (isHero) {
        document.body.classList.add('view-hero');
    } else {
        document.body.classList.remove('view-hero');
        const searchWrap = document.getElementById('search-input-container');
        if (searchWrap) searchWrap.style.display = 'none';
    }

    elHeroSection.style.display = isHero ? 'flex' : 'none';
    elContentArea.style.display = isHero ? 'none' : 'block';
    elFooter.style.display = isHero ? 'flex' : 'none';

    if (isHero) {
        elContentArea.innerHTML = '';
        if (typeof init3DHero === 'function') init3DHero();
        return;
    }

    if (State.catchRAF) cancelAnimationFrame(State.catchRAF);

    const renderers = {
        photos:   renderPhotosView,
        videos:   renderVideosView,
        letters:  renderLettersView,
        games:    renderGamesView,
        settings: renderSettingsView,
    };
    if (renderers[view]) renderers[view]();
}

// ================================================================
// 7. SUPABASE AUTH
// ================================================================
let pendingView = null;
function openSignin(view) {
    pendingView = view;
    elSigninOverlay.classList.remove('hidden');
    elSigninError.classList.add('hidden');
}
elSigninBack.onclick = () => elSigninOverlay.classList.add('hidden');

elPassToggle.onclick = () => {
    const isPass = elSigninPass.type === 'password';
    elSigninPass.type = isPass ? 'text' : 'password';
    elPassIcon.className = isPass ? 'fas fa-eye' : 'fas fa-eye-slash';
};

elSigninForm.onsubmit = async (e) => {
    e.preventDefault();
    elSigninSubmit.disabled = true;
    elSigninSubmit.querySelector('.btn-loader').classList.remove('hidden');
    try {
        const { error } = await sb.auth.signInWithPassword({ email: elSigninEmail.value, password: elSigninPass.value });
        if (error) throw error;
        State.sbLoggedIn = true;
        elSigninOverlay.classList.add('hidden');
        if (pendingView) navigateTo(pendingView);
    } catch (err) {
        elSigninError.textContent = 'Invalid credentials';
        elSigninError.classList.remove('hidden');
    } finally {
        elSigninSubmit.disabled = false;
        elSigninSubmit.querySelector('.btn-loader').classList.add('hidden');
    }
};

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
async function renderPhotosView(folder = 'ALBUM') {
    elContentArea.innerHTML = `
        <div class="section-wrap view-enter photos-section-wrapper">
            <h2 class="section-title">Illustrations</h2>
            <div class="photos-sub">CURATED GALLERIES</div>

            <div class="folder-tabs">
                <div class="folder-tab ${folder === 'ALBUM' ? 'active' : ''}" data-folder="ALBUM">
                    <div class="folder-thumb album-thumb"></div>
                    <span>ALBUM</span>
                </div>
                <div class="folder-tab ${folder === 'Favorites' ? 'active' : ''}" data-folder="Favorites">
                    <div class="folder-thumb fav-thumb"></div>
                    <span>Favorites</span>
                </div>
            </div>

            <div class="photos-masonry" id="photos-grid"></div>

            <!-- Bottom Navigation / Upload -->
            <div class="photos-bottom-nav">
                <div class="bottom-nav-inner">
                    <i class="fas fa-compass nav-icon"></i>
                    <i class="fas fa-th-large nav-icon active"></i>
                    <button class="upload-fab center-fab" id="upload-fab"><i class="fas fa-plus"></i></button>
                    <i class="fas fa-pen nav-icon"></i>
                    <i class="fas fa-user nav-icon"></i>
                </div>
            </div>

            <div class="upload-toast" id="upload-toast"></div>
            <input type="file" id="photo-file-input" accept="image/*" style="display:none">

            <div id="photo-context-menu" class="note-context-menu hidden">
                <div class="context-menu-item" id="photo-ctx-pin"><i class="fas fa-thumbtack"></i> Pin</div>
                <div class="context-menu-item" id="photo-ctx-fav"><i class="fas fa-heart"></i> Favorite</div>
                <div class="context-menu-item delete" id="photo-ctx-delete"><i class="fas fa-trash"></i> Delete</div>
            </div>
        </div>`;

    document.querySelectorAll('.folder-tab').forEach(t => {
        t.onclick = () => renderPhotosView(t.dataset.folder);
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
        if (!error) { showToast("Uploaded!", "success"); renderPhotosView(folder); }
    };

    const grid = document.getElementById('photos-grid');
    const { data } = await sb.storage.from(SUPABASE_BUCKET).list(SUPABASE_PHOTO_FOLDER);

    State.photoList = [];

    let files = (data || []).filter(f => f.name !== '.emptyFolderPlaceholder');

    // Sort: Pinned first, then by date
    files.sort((a, b) => {
        const pinA = State.pinnedPhotos.includes(a.name) ? 1 : 0;
        const pinB = State.pinnedPhotos.includes(b.name) ? 1 : 0;
        if (pinA !== pinB) return pinB - pinA;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    if (folder === 'Favorites') {
        files = files.filter(f => State.favoritePhotos.includes(f.name));
    }

    const contextMenu = document.getElementById('photo-context-menu');
    let activePhotoName = null;

    files.forEach((f, idx) => {
        const url = sb.storage.from(SUPABASE_BUCKET).getPublicUrl(`${SUPABASE_PHOTO_FOLDER}/${f.name}`).data.publicUrl;
        State.photoList.push({ name: f.name, url: url });

        const img = document.createElement('div');
        img.className = 'photo-card-masonry';

        const isPinned = State.pinnedPhotos.includes(f.name);

        img.innerHTML = `
            <img src="${url}" loading="lazy">
            ${isPinned ? '<div class="photo-pin-badge"><i class="fas fa-thumbtack"></i></div>' : ''}
            <button class="photo-dots"><i class="fas fa-ellipsis-v"></i></button>
        `;

        img.querySelector('img').onclick = () => openLightboxGallery(idx);

        const dots = img.querySelector('.photo-dots');
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
        if (!e.target.closest('.photo-dots') && !e.target.closest('#photo-context-menu')) {
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
    const container = document.getElementById('earth-container');
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

function updateLightboxUI() {
    const photo = State.photoList[State.photoIndex];
    elLbImg.src = photo.url;
    elLbFav.innerHTML = State.favoritePhotos.includes(photo.name)
        ? '<i class="fas fa-heart" style="color:var(--netflix-red);"></i>'
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

    // Refresh photos view in background if it's currently active
    if (State.currentView === 'photos') {
        const activeTab = document.querySelector('.folder-tab.active');
        if (activeTab) renderPhotosView(activeTab.dataset.folder);
    }
};

elLbClose.onclick = () => elLightbox.classList.remove('open');

// Swipe support for Lightbox
let touchStartX = 0;
elLightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
elLightbox.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - 40) {
        // swipe left (next)
        if (State.photoIndex < State.photoList.length - 1) {
            State.photoIndex++;
            updateLightboxUI();
        }
    } else if (touchEndX > touchStartX + 40) {
        // swipe right (prev)
        if (State.photoIndex > 0) {
            State.photoIndex--;
            updateLightboxUI();
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
