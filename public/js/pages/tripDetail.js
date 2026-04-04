let currentTrip = null, currentTab = 'places', tripMapInstance = null;

async function renderTripDetail({ id }) {
  if (!AppState.user) { Router.navigate('/'); return; }
  document.getElementById('app').innerHTML = `
    <nav id="main-nav"></nav>
    <div class="page">
      <div class="page-content fade-in">
        <a class="back-btn" onclick="Router.navigate('/trips')">← Back to trips</a>
        <div id="trip-header"></div>
        <div class="tabs" id="trip-tabs">
          <button class="tab active" data-tab="places">📍 Places</button>
          <button class="tab" data-tab="photos">📷 Photos</button>
          <button class="tab" data-tab="map">🗺 Map</button>
        </div>
        <div id="tab-content"></div>
      </div>
    </div>`;
  renderNav();
  try {
    currentTrip = await api.get(`/api/trips/${id}`);
    renderTripHeader(currentTrip); renderTab('places');
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active'); currentTab = tab.dataset.tab; renderTab(currentTab);
      });
    });
  } catch(e) { toast('Trip not found','error'); Router.navigate('/trips'); }
}

function renderTripHeader(trip) {
  const cover = trip.cover_photo ? `<img src="${trip.cover_photo}" alt="${trip.title}">` : '';
  const dates = trip.start_date
    ? `${new Date(trip.start_date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}${trip.end_date?' — '+new Date(trip.end_date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):''}`
    : 'Dates not set';
  document.getElementById('trip-header').innerHTML = `
    <div class="trip-detail-hero">
      ${cover}
      <div class="trip-detail-overlay">
        <div class="trip-detail-label">${trip.status}</div>
        <h1>${trip.title}</h1>
        <div class="trip-detail-meta">
          <span>🗓 ${dates}</span>
          <span>📍 ${trip.places.length} places</span>
          <span>📷 ${trip.photos.length} photos</span>
        </div>
        <div class="trip-detail-actions">
          <button class="trip-btn-glass" onclick="Router.navigate('/trips/${trip.id}/add-photo')">+ Photos</button>
          <button class="trip-btn-glass" onclick="Router.navigate('/trips/${trip.id}/add-place')">+ Place</button>
          <button class="trip-btn-glass trip-btn-glass-danger" onclick="deleteTrip(${trip.id})">Delete Trip</button>
        </div>
      </div>
    </div>
    ${trip.description ? `<p style="color:var(--ink-3);margin-bottom:30px;font-size:15px;line-height:1.8;font-weight:400">${trip.description}</p>` : ''}`;
}

function renderTab(t) {
  if (t==='places') renderPlacesTab();
  else if (t==='photos') renderPhotosTab();
  else renderMapTab();
}

function renderPlacesTab() {
  const el = document.getElementById('tab-content');
  if (!currentTrip.places.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📍</div><h3>No places yet</h3>
        <p>Add the places you visited on this trip</p>
        <button class="btn btn-primary" style="width:auto;margin:0 auto" onclick="Router.navigate('/trips/${currentTrip.id}/add-place')">+ Add Place</button>
      </div>`; return;
  }
  el.innerHTML = `
    <div style="margin-bottom:14px;display:flex;justify-content:flex-end">
      <button class="btn btn-lav btn-sm" onclick="Router.navigate('/trips/${currentTrip.id}/add-place')">+ Add Place</button>
    </div>
    <div class="places-list">
      ${currentTrip.places.map((p,i) => `
        <div class="place-card">
          <div class="place-pin">${i+1}</div>
          <div class="place-info">
            <div class="place-name">${p.name}</div>
            ${p.address ? `<div class="place-address">📍 ${p.address}</div>` : ''}
            ${p.description ? `<div class="place-desc">${p.description}</div>` : ''}
            ${p.visit_date ? `<div class="place-date">🗓 ${new Date(p.visit_date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>` : ''}
            ${p.rating ? `<div class="place-rating">${Array.from({length:5},(_,j) => `<span class="star${j>=p.rating?' empty':''}"">★</span>`).join('')}</div>` : ''}
          </div>
          <div class="place-actions">
            ${p.latitude&&p.longitude ? `<button class="btn-icon" onclick="switchToMapAndFocus(${p.latitude},${p.longitude})">🗺</button>` : ''}
            <button class="btn-icon" onclick="deletePlace(${p.id})">🗑</button>
          </div>
        </div>`).join('')}
    </div>`;
}

function renderPhotosTab() {
  const el = document.getElementById('tab-content');
  if (!currentTrip.photos.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📷</div><h3>No photos yet</h3>
        <p>Upload memories from this trip</p>
        <button class="btn btn-primary" style="width:auto;margin:0 auto" onclick="Router.navigate('/trips/${currentTrip.id}/add-photo')">+ Add Photos</button>
      </div>`; return;
  }
  el.innerHTML = `
    <div style="margin-bottom:14px;display:flex;justify-content:flex-end">
      <button class="btn btn-rose-outline btn-sm" onclick="Router.navigate('/trips/${currentTrip.id}/add-photo')">+ Add Photos</button>
    </div>
    <div class="photos-grid">
      ${currentTrip.photos.map(p => `
        <div class="photo-card">
          <img src="${p.filename}" alt="${p.caption||''}" loading="lazy" onclick="openLightbox('${p.filename}','${(p.caption||'').replace(/'/g,"\\'")}')">
          <div class="photo-overlay">${p.caption?`<div class="photo-caption">${p.caption}</div>`:''}</div>
          <button class="photo-delete" onclick="event.stopPropagation();deletePhoto(${p.id})">✕</button>
        </div>`).join('')}
    </div>`;
}

function renderMapTab() {
  const el = document.getElementById('tab-content');
  el.innerHTML = `
    <div id="map-container"><div id="trip-map"></div></div>
    <p style="margin-top:12px;text-align:center;font-size:12px;color:var(--ink-4);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">
      ${currentTrip.places.filter(p=>p.latitude&&p.longitude).length} places pinned on map
    </p>`;
  if (tripMapInstance) { tripMapInstance.remove(); tripMapInstance = null; }
  setTimeout(() => {
    const places = currentTrip.places.filter(p=>p.latitude&&p.longitude);
    const center = places.length ? [places[0].latitude, places[0].longitude] : [20,0];
    tripMapInstance = L.map('trip-map').setView(center, places.length ? 8 : 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(tripMapInstance);
    if (!places.length) return;
    const markers = places.map((p,i) => {
      const icon = L.divIcon({
        className:'',
        html:`<div style="background:linear-gradient(135deg,#e0587a,#7c6bbf);color:#fff;width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;border:2px solid #fff;box-shadow:0 3px 12px rgba(224,88,122,0.45);font-family:Manrope,sans-serif">${i+1}</div>`,
        iconSize:[32,32],iconAnchor:[16,16]
      });
      return L.marker([p.latitude,p.longitude],{icon}).addTo(tripMapInstance)
        .bindPopup(`<div style="font-family:Manrope,sans-serif;min-width:150px"><strong style="font-size:14px;color:#1a1625">${p.name}</strong>${p.address?`<br><span style="color:#6352a8;font-size:12px;font-weight:600">${p.address}</span>`:''}${p.description?`<br><span style="font-size:12px;color:#6e6485;margin-top:4px;display:block">${p.description}</span>`:''}</div>`);
    });
    if (markers.length>1) {
      tripMapInstance.fitBounds(L.featureGroup(markers).getBounds().pad(0.25));
      L.polyline(places.map(p=>[p.latitude,p.longitude]),{color:'#e0587a',weight:2,opacity:0.4,dashArray:'6 8'}).addTo(tripMapInstance);
    }
  },100);
}

function switchToMapAndFocus(lat,lng) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelector('[data-tab="map"]').classList.add('active');
  currentTab='map'; renderMapTab();
  setTimeout(()=>{ if(tripMapInstance) tripMapInstance.flyTo([lat,lng],12); },300);
}

function openLightbox(src,caption) {
  const lb = document.createElement('div'); lb.className='lightbox';
  lb.innerHTML=`<div class="lightbox-close" onclick="this.parentElement.remove()">✕</div><div style="text-align:center"><img src="${src}" alt="${caption}">${caption?`<p style="color:rgba(255,255,255,0.6);margin-top:14px;font-size:13px;font-weight:500">${caption}</p>`:''}</div>`;
  lb.addEventListener('click',e=>{if(e.target===lb)lb.remove();});
  document.body.appendChild(lb);
}

async function deleteTrip(id) {
  if(!confirm('Delete this trip and all its data?')) return;
  try { await api.delete(`/api/trips/${id}`); toast('Trip deleted','success'); Router.navigate('/trips'); }
  catch(e) { toast('Error','error'); }
}
async function deletePlace(id) {
  if(!confirm('Remove this place?')) return;
  try { await api.delete(`/api/places/${id}`); currentTrip.places=currentTrip.places.filter(p=>p.id!==id); toast('Place removed','success'); renderPlacesTab(); }
  catch(e) { toast('Error','error'); }
}
async function deletePhoto(id) {
  if(!confirm('Delete this photo?')) return;
  try { await api.delete(`/api/photos/${id}`); currentTrip.photos=currentTrip.photos.filter(p=>p.id!==id); toast('Photo deleted','success'); renderPhotosTab(); }
  catch(e) { toast('Error','error'); }
}
