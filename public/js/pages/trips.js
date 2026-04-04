async function renderTripsPage() {
  if (!AppState.user) {
    Router.navigate('/login');
    return;
  }

  renderNav();

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="shell">
      <header id="main-nav"></header>

      <main class="container">
        <section style="margin-top:40px;">
          <h1 style="font-family:'DM Serif Display',serif;font-size:64px;margin:0;">
            All Trips <span style="font-size:24px;font-style:italic;color:#7d7397;">your collection</span>
          </h1>
        </section>

        <section style="display:flex;justify-content:space-between;align-items:center;margin:28px 0 18px;">
          <div id="tripFilters" style="display:flex;gap:14px;flex-wrap:wrap;">
            <button class="filter-btn active" data-filter="all">ALL</button>
            <button class="filter-btn" data-filter="planned">PLANNED</button>
            <button class="filter-btn" data-filter="ongoing">ONGOING</button>
            <button class="filter-btn" data-filter="completed">COMPLETED</button>
          </div>

          <button class="nav-cta" onclick="Router.navigate('/trips/new')">+ New Trip</button>
        </section>

        <section id="tripsGrid" class="trips-grid"></section>
      </main>
    </div>
  `;

  renderNav();
  await loadTripsPageData();
}

async function loadTripsPageData() {
  const grid = document.getElementById('tripsGrid');
  const filterWrap = document.getElementById('tripFilters');

  try {
    const allTrips = await api.get('/api/trips');
    let activeFilter = 'all';

    function renderTrips() {
      const trips = activeFilter === 'all'
        ? allTrips
        : allTrips.filter(t => t.status === activeFilter);

      if (!trips.length) {
        grid.innerHTML = `
          <div class="empty-state">
            <h3>No trips found</h3>
            <p>No trips in this category yet.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = trips.map(trip => `
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
    }

    filterWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      activeFilter = btn.dataset.filter;

      [...filterWrap.querySelectorAll('.filter-btn')].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      renderTrips();
    });

    renderTrips();
  } catch (err) {
    grid.innerHTML = `<p>Failed to load trips.</p>`;
  }
}