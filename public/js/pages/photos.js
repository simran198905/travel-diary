function renderPhotosPage() {
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
            Photos <span style="font-size:24px;font-style:italic;color:#7d7397;">your memories</span>
          </h1>
        </section>

        <section id="photosGrid" class="trips-grid" style="margin-top:28px;"></section>
      </main>
    </div>
  `;

  renderNav();

  const grid = document.getElementById('photosGrid');

  api.get('/api/photos')
    .then((photos) => {
      if (!photos.length) {
        grid.innerHTML = `
          <div class="empty-state">
            <h3>No photos yet</h3>
            <p>Upload trip photos to see them here.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = photos.map((photo) => `
        <div class="trip-card">
          <div class="trip-cover" style="background-image:url('${photo.filename}'); background-size:cover; background-position:center;"></div>
          <div class="trip-body">
            <h3>${photo.caption || 'Untitled photo'}</h3>
            <div class="trip-meta" style="display:flex;flex-direction:column;align-items:flex-start;gap:8px;">
              <span>🧳 Trip: ${photo.trip_title || 'Unknown trip'}</span>
              <span>📍 Place: ${photo.place_name || 'No place linked'}</span>
            </div>
          </div>
        </div>
      `).join('');
    })
    .catch(() => {
      grid.innerHTML = `<p>Failed to load photos.</p>`;
    });
}