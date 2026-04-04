async function renderDashboard() {
  if (!AppState.user) {
    Router.navigate('/login');
    return;
  }

  renderNav();

  const app = document.getElementById('app');
  const displayName = AppState.user.name || AppState.user.username || 'Traveler';

  app.innerHTML = `
    <div class="shell">
      <header id="main-nav"></header>

      <main class="container">
        <section class="hero-card">
          <div class="eyebrow">GOOD TO SEE YOU</div>
          <h1 class="hero-title">Hello, <span>${displayName}</span>👋</h1>
          <p class="hero-subtitle">Where are you headed next?</p>
        </section>

        <section class="stats-grid">
          <div class="stat-card" onclick="Router.navigate('/trips')" style="cursor:pointer">
            <div class="stat-icon">✈️</div>
            <div class="stat-number" id="tripsCount">0</div>
            <div class="stat-label">TRIPS</div>
          </div>

          <div class="stat-card" onclick="Router.navigate('/places')" style="cursor:pointer">
            <div class="stat-icon">📍</div>
            <div class="stat-number" id="placesCount">0</div>
            <div class="stat-label">PLACES</div>
          </div>

          <div class="stat-card" onclick="Router.navigate('/photos')" style="cursor:pointer">
            <div class="stat-icon">📷</div>
            <div class="stat-number" id="photosCount">0</div>
            <div class="stat-label">PHOTOS</div>
          </div>

          <div class="stat-card" onclick="Router.navigate('/locations')" style="cursor:pointer">
            <div class="stat-icon">🌍</div>
            <div class="stat-number" id="locationsCount">0</div>
            <div class="stat-label">LOCATIONS</div>
          </div>
        </section>

        <section class="section-head" style="display:flex;justify-content:space-between;align-items:center;margin-top:48px;">
          <div>
            <h2 style="margin:0;font-family:'DM Serif Display',serif;font-size:52px;">Recent Trips <span style="font-size:22px;font-style:italic;color:#7d7397;">your adventures</span></h2>
          </div>
          <button class="nav-cta" onclick="Router.navigate('/trips/new')">+ New Trip</button>
        </section>

        <section id="recentTripsGrid" class="trips-grid" style="margin-top:24px;"></section>
      </main>
    </div>
  `;

  renderNav();

  await loadDashboardStats();
  await loadRecentTrips();
}

async function loadDashboardStats() {
  try {
    const stats = await api.get('/api/stats');

    document.getElementById('tripsCount').textContent = stats.trips || 0;
    document.getElementById('placesCount').textContent = stats.places || 0;
    document.getElementById('photosCount').textContent = stats.photos || 0;
    document.getElementById('locationsCount').textContent = stats.locations || 0;
  } catch (err) {
    toast(err.message || 'Failed to load stats', 'error');
  }
}

async function loadRecentTrips() {
  const grid = document.getElementById('recentTripsGrid');

  try {
    const trips = await api.get('/api/trips');

    if (!trips.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No trips yet</h3>
          <p>Create your first trip and start building your travel diary.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = trips.slice(0, 3).map(trip => `
      <div class="trip-card" onclick="Router.navigate('/trips/${trip.id}')" style="cursor:pointer">
        <div class="trip-cover" style="background-image:url('${trip.cover_photo || ''}'); background-size:cover; background-position:center;">
          <span class="trip-badge ${trip.status}">${trip.status}</span>
          ${!trip.cover_photo ? `<div class="trip-cover-fallback">🗺️</div>` : ''}
        </div>
        <div class="trip-body">
          <h3>${trip.title}</h3>
          <p>${trip.description || 'No description added yet.'}</p>
          <div class="trip-meta">
            <span>📍 ${trip.place_count || 0} places</span>
            <span>📷 ${trip.photo_count || 0} photos</span>
            <span>🗓️ ${formatMonthYear(trip.start_date || trip.created_at)}</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<p>Failed to load trips.</p>`;
  }
}

function formatMonthYear(dateValue) {
  if (!dateValue) return 'No date';
  const date = new Date(dateValue);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}