const AppState = { user: null };

function getDisplayName() {
  if (!AppState.user) return '';
  return AppState.user.username || AppState.user.name || 'User';
}

function renderNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  if (!AppState.user) {
    nav.innerHTML = `
      <div class="nav-brand" onclick="Router.navigate('/')">
        <div class="nav-brand-mark">W</div>
        Wanderlust
      </div>
      <div class="nav-links">
        <button class="nav-link" onclick="Router.navigate('/login')">Sign in</button>
        <button class="nav-cta" onclick="Router.navigate('/register')">Get started</button>
      </div>
    `;
    return;
  }

  const displayName = getDisplayName();
  const initial = displayName.charAt(0).toUpperCase();

  nav.innerHTML = `
    <div class="nav-brand" onclick="Router.navigate('/dashboard')">
      <div class="nav-brand-mark">W</div>
      Wanderlust
    </div>

    <div class="nav-links">
      <button class="nav-link" onclick="Router.navigate('/dashboard')">Home</button>
      <button class="nav-link" onclick="Router.navigate('/trips')">Trips</button>
      <button class="nav-link" onclick="Router.navigate('/places')">Places</button>
      <button class="nav-link" onclick="Router.navigate('/photos')">Photos</button>
      <button class="nav-link" onclick="Router.navigate('/locations')">Locations</button>
      <button class="nav-link" onclick="Router.navigate('/map')">World Map</button>
      <button class="nav-cta" onclick="Router.navigate('/trips/new')">+ New Trip</button>
      <div class="nav-avatar">${initial}</div>
      <button class="nav-link" onclick="handleLogout()" style="color:var(--rose)">Sign out</button>
    </div>
  `;
}

async function handleLogout() {
  try {
    await api.post('/api/logout', {});
  } catch (e) {}

  AppState.user = null;
  toast('Logged out. Safe travels! ✈️');
  Router.navigate('/');
}

async function initApp() {
  document.getElementById('app').innerHTML = `
    <div style="position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;gap:16px">
      <div style="width:42px;height:42px;border-radius:50%;border:3px solid var(--lav-200);border-top-color:var(--rose);animation:spin 0.75s linear infinite"></div>
      <div style="font-family:'DM Serif Display',serif;font-size:22px;color:var(--ink);letter-spacing:-0.3px">Wanderlust</div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;

  try {
    AppState.user = await api.get('/api/me');
  } catch (e) {
    AppState.user = null;
  }

  Router.register('/', () => {
    if (AppState.user) Router.navigate('/dashboard', false);
    else renderLandingPage();
  });

  Router.register('/login', renderLoginPage);
  Router.register('/register', renderRegisterPage);

  Router.register('/dashboard', renderDashboard);

  Router.register('/trips', renderTripsPage);
  Router.register('/trips/new', renderAddTripPage);
  Router.register('/trips/:id', renderTripDetail);
  Router.register('/trips/:id/add-place', renderAddPlacePage);
  Router.register('/trips/:id/add-photo', renderAddPhotoPage);

  Router.register('/places', renderPlacesPage);
  Router.register('/photos', renderPhotosPage);
  Router.register('/locations', renderLocationsPage);

  Router.register('/map', renderWorldMapPage);

  let tc = document.getElementById('toast-container');
  if (!tc) {
    tc = document.createElement('div');
    tc.id = 'toast-container';
    document.body.appendChild(tc);
  }

  Router.init();
}

document.addEventListener('DOMContentLoaded', initApp);