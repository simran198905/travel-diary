let worldMapInstance = null;

async function renderWorldMapPage() {
  if (!AppState.user) { Router.navigate('/'); return; }

  document.getElementById('app').innerHTML = `
    <nav id="main-nav"></nav>
    <div class="page">
      <div class="page-content fade-in">
        <div class="section-header">
          <h2>World Map <em>all your adventures</em></h2>
          <span style="color:var(--ink-4);font-size:13px;font-weight:500" id="map-count">Loading…</span>
        </div>
        <div id="map-container">
          <div id="trip-map" class="map-full"></div>
        </div>
        <div id="map-legend"></div>
      </div>
    </div>
  `;
  renderNav();

  try {
    const trips = await api.get('/api/trips');
    // Fetch all trip details in parallel
    const details = await Promise.all(trips.map(t => api.get(`/api/trips/${t.id}`)));
    renderWorldMap(details);
  } catch (err) {
    toast('Error loading map data', 'error');
  }
}

function renderWorldMap(trips) {
  if (worldMapInstance) { worldMapInstance.remove(); worldMapInstance = null; }

  worldMapInstance = L.map('trip-map').setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(worldMapInstance);

  const tripColors = ['#c4622d', '#2a7a6f', '#d4a853', '#8b5cf6', '#e74c3c', '#3498db', '#27ae60'];
  let totalPlaces = 0;
  const bounds = [];

  const legend = document.getElementById('map-legend');
  legend.innerHTML = '';

  trips.forEach((trip, idx) => {
    const color = tripColors[idx % tripColors.length];
    const places = trip.places.filter(p => p.latitude && p.longitude);
    totalPlaces += places.length;

    if (places.length === 0) return;

    // Legend item
    legend.innerHTML += `
      <div class="legend-item" onclick="focusTripOnMap(${idx})">
        <span class="legend-dot" style="background:${color}"></span>
        <span style="color:var(--cream)">${trip.title}</span>
        <span style="color:var(--cream-dim)">(${places.length})</span>
      </div>`;

    // Draw polyline
    if (places.length > 1) {
      L.polyline(places.map(p => [p.latitude, p.longitude]), {
        color, weight: 2.5, opacity: 0.55, dashArray: '8 6'
      }).addTo(worldMapInstance);
    }

    // Markers
    places.forEach((p, i) => {
      bounds.push([p.latitude, p.longitude]);
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25)">${i + 1}</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14]
      });
      L.marker([p.latitude, p.longitude], { icon })
        .addTo(worldMapInstance)
        .bindPopup(`
          <div style="font-family:'DM Sans',sans-serif;min-width:160px">
            <div style="font-size:11px;color:${color};font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">${trip.title}</div>
            <div style="font-size:15px;font-weight:700;margin-bottom:4px">${p.name}</div>
            ${p.address ? `<div style="font-size:12px;color:#666">${p.address}</div>` : ''}
            ${p.description ? `<div style="font-size:12px;margin-top:6px;color:#333">${p.description}</div>` : ''}
            ${p.rating ? `<div style="margin-top:6px;color:#d4a853;font-size:14px">${'★'.repeat(p.rating)}${'☆'.repeat(5-p.rating)}</div>` : ''}
            <div style="margin-top:8px">
              <a href="#/trips/${trip.id}" style="color:${color};font-size:12px;font-weight:600">View trip →</a>
            </div>
          </div>`);
    });
  });

  document.getElementById('map-count').textContent = `◈ ${totalPlaces} places across ${trips.length} trips`;

  if (bounds.length > 0) {
    worldMapInstance.fitBounds(bounds, { padding: [40, 40] });
  }

  // Store trips for legend focus
  window._mapTrips = trips.map((t, idx) => ({
    ...t,
    places: t.places.filter(p => p.latitude && p.longitude),
    color: tripColors[idx % tripColors.length]
  }));
}

function focusTripOnMap(idx) {
  if (!window._mapTrips || !worldMapInstance) return;
  const trip = window._mapTrips[idx];
  if (!trip || trip.places.length === 0) return;
  const bounds = trip.places.map(p => [p.latitude, p.longitude]);
  worldMapInstance.fitBounds(bounds, { padding: [60, 60] });
}
