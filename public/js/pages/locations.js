function renderLocationsPage() {
  if (!AppState.user) {
    Router.navigate('/login');
    return;
  }

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="shell">
      <header id="main-nav"></header>

      <main class="container">
        <section style="margin-top:40px;">
          <h1 style="font-family:'DM Serif Display',serif;font-size:64px;margin:0;">
            Locations <span style="font-size:24px;font-style:italic;color:#7d7397;">your footprints</span>
          </h1>
        </section>

        <section id="locationsGrid" class="trips-grid" style="margin-top:28px;"></section>
      </main>
    </div>
  `;

  renderNav();

  const grid = document.getElementById('locationsGrid');

  api.get('/api/locations')
    .then((locations) => {
      if (!locations.length) {
        grid.innerHTML = `
          <div class="empty-state">
            <h3>No locations yet</h3>
            <p>Add places with address or coordinates to see them here.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = locations.map((loc) => `
        <div class="trip-card">
          <div class="trip-body">
            <h3>${loc.name || 'Unnamed location'}</h3>
            <div class="trip-meta" style="display:flex;flex-direction:column;align-items:flex-start;gap:8px;">
              <span>📍 Address: ${loc.address || 'No address available'}</span>
              <span>🌐 Latitude: ${loc.latitude ?? '-'}</span>
              <span>🌐 Longitude: ${loc.longitude ?? '-'}</span>
              <span>🗓️ Visit Date: ${loc.visit_date || 'Not visited yet'}</span>
            </div>
          </div>
        </div>
      `).join('');
    })
    .catch(() => {
      grid.innerHTML = `<p>Failed to load locations.</p>`;
    });
}