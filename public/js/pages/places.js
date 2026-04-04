function renderPlacesPage() {
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
            Places <span style="font-size:24px;font-style:italic;color:#7d7397;">where you’ve been</span>
          </h1>
        </section>

        <section id="placesGrid" class="trips-grid" style="margin-top:28px;"></section>
      </main>
    </div>
  `;

  renderNav();

  const grid = document.getElementById('placesGrid');

  api.get('/api/places')
    .then((places) => {
      if (!places.length) {
        grid.innerHTML = `
          <div class="empty-state">
            <h3>No places yet</h3>
            <p>Add places inside a trip to see them here.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = places.map((place) => `
        <div class="trip-card">
          <div class="trip-body">
            <h3>${place.name}</h3>
            <p>${place.description || 'No description added yet.'}</p>
            <div class="trip-meta" style="display:flex;flex-direction:column;align-items:flex-start;gap:8px;">
              <span>🧳 Trip: ${place.trip_title || 'Unknown trip'}</span>
              <span>📍 Address: ${place.address || 'No address'}</span>
              <span>🗓️ Visit Date: ${place.visit_date || 'Not visited yet'}</span>
              <span>⭐ Rating: ${place.rating || 'No rating'}</span>
            </div>
          </div>
        </div>
      `).join('');
    })
    .catch(() => {
      grid.innerHTML = `<p>Failed to load places.</p>`;
    });
}