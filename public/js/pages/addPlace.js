let pickerMap = null;
let pickerMarker = null;
let selectedLat = null;
let selectedLng = null;
let selectedRating = 0;

function renderAddPlacePage({ id: tripId }) {
  if (!AppState.user) {
    Router.navigate('/');
    return;
  }

  document.getElementById('app').innerHTML = `
    <nav id="main-nav"></nav>
    <div class="page">
      <div class="page-content fade-in">
        <a class="back-btn" onclick="Router.navigate('/trips/${tripId}')">← Back to trip</a>

        <div class="form-page">
          <div class="form-card">
            <div class="form-card-label">Pin a location</div>
            <h2>Add a Place</h2>
            <p class="subtitle">Mark everywhere you visited on this trip</p>

            <div class="form-group">
              <label>Place Name *</label>
              <input
                type="text"
                id="place-name"
                class="form-control"
                placeholder="e.g. Fushimi Inari Shrine"
              >
            </div>

            <div class="form-group">
              <label>Address / Location</label>
              <input
                type="text"
                id="place-address"
                class="form-control"
                placeholder="e.g. Kyoto, Japan"
              >
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea
                id="place-desc"
                class="form-control"
                placeholder="What was special about this place?"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Visit Date</label>
              <input type="date" id="place-date" class="form-control">
            </div>

            <div class="form-group">
              <label>Your Rating</label>
              <div class="star-input" id="star-input">
                ${[1, 2, 3, 4, 5]
                  .map(
                    (n) =>
                      `<button type="button" data-val="${n}" onclick="setRating(${n})">★</button>`
                  )
                  .join('')}
              </div>
            </div>

            <div class="form-group">
              <label>Pin on Map</label>
              <p class="map-picker-hint">Click anywhere on the map to drop a pin for this place</p>

              <div class="map-picker-wrap">
                <div id="map-picker"></div>
              </div>

              <div class="coords-display" id="coords-display">
                No location selected — click map to pin
              </div>

              <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap">
                <input
                  type="text"
                  id="search-location"
                  class="form-control"
                  placeholder="Search for a location..."
                  style="flex:1"
                >
                <button class="btn btn-ghost btn-sm" onclick="searchLocation()">Search</button>
                <button class="btn btn-ghost btn-sm" onclick="useMyLocation()">📍 My Location</button>
              </div>
            </div>

            <button class="btn btn-primary" id="save-place-btn" onclick="savePlace(${tripId})">
              Add Place →
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderNav();

  selectedLat = null;
  selectedLng = null;
  selectedRating = 0;

  setTimeout(() => initPickerMap(), 100);
}

function initPickerMap() {
  if (pickerMap) {
    pickerMap.remove();
    pickerMap = null;
    pickerMarker = null;
  }

  pickerMap = L.map('map-picker').setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(pickerMap);

  pickerMap.on('click', (e) => {
    const { lat, lng } = e.latlng;
    placePin(lat, lng);
    reverseGeocode(lat, lng);
  });

  setTimeout(() => {
    pickerMap.invalidateSize();
  }, 200);
}

function placePin(lat, lng) {
  selectedLat = Number(lat).toFixed(6);
  selectedLng = Number(lng).toFixed(6);

  const icon = L.divIcon({
    className: '',
    html: `
      <div style="
        background:#c4622d;
        color:white;
        width:36px;
        height:36px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;
        align-items:center;
        justify-content:center;
        border:2px solid white;
        box-shadow:0 3px 10px rgba(0,0,0,0.3)
      ">
        <span style="transform:rotate(45deg);font-size:16px">📍</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36]
  });

  if (pickerMarker) {
    pickerMap.removeLayer(pickerMarker);
  }

  pickerMarker = L.marker([lat, lng], { icon }).addTo(pickerMap);
  pickerMap.setView([lat, lng], Math.max(pickerMap.getZoom(), 10));

  document.getElementById('coords-display').textContent =
    `Lat: ${selectedLat}, Lng: ${selectedLng}`;
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await response.json();

    if (data && data.display_name) {
      const addrField = document.getElementById('place-address');
      const nameField = document.getElementById('place-name');

      if (!addrField.value) {
        addrField.value = data.display_name.split(',').slice(0, 3).join(',').trim();
      }

      if (!nameField.value && data.name) {
        nameField.value = data.name;
      }
    }
  } catch (e) {}
}

async function searchLocation() {
  const query = document.getElementById('search-location').value.trim();
  if (!query) return;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    );
    const results = await response.json();

    if (results.length > 0) {
      const { lat, lon, display_name } = results[0];

      placePin(parseFloat(lat), parseFloat(lon));

      const addrField = document.getElementById('place-address');
      if (!addrField.value) {
        addrField.value = display_name.split(',').slice(0, 3).join(',').trim();
      }
    } else {
      toast('Location not found', 'error');
    }
  } catch (e) {
    toast('Search failed', 'error');
  }
}

function useMyLocation() {
  if (!navigator.geolocation) {
    toast('Geolocation not supported', 'error');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      placePin(pos.coords.latitude, pos.coords.longitude);
      reverseGeocode(pos.coords.latitude, pos.coords.longitude);
    },
    () => {
      toast('Could not get your location', 'error');
    }
  );
}

function setRating(val) {
  selectedRating = val;

  document.querySelectorAll('#star-input button').forEach((btn, i) => {
    btn.classList.toggle('active', i < val);
  });
}

async function savePlace(tripId) {
  const name = document.getElementById('place-name').value.trim();

  if (!name) {
    toast('Place name is required', 'error');
    return;
  }

  const btn = document.getElementById('save-place-btn');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    await api.post(`/api/trips/${tripId}/places`, {
      name,
      description: document.getElementById('place-desc').value.trim(),
      address: document.getElementById('place-address').value.trim(),
      visit_date: document.getElementById('place-date').value || null,
      rating: selectedRating || null,
      latitude: selectedLat,
      longitude: selectedLng
    });

    toast('Place added! 📍', 'success');
    Router.navigate(`/trips/${tripId}`);
  } catch (err) {
    toast(err.message || 'Failed to save place', 'error');
    btn.textContent = 'Add Place →';
    btn.disabled = false;
  }
}