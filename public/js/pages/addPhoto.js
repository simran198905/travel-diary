let selectedFiles = [];
let photoTripPlaces = [];

async function renderAddPhotoPage({ id: tripId }) {
  if (!AppState.user) {
    Router.navigate('/');
    return;
  }

  document.getElementById('app').innerHTML = `
    <nav id="main-nav"></nav>
    <div class="page">
      <div class="page-content fade-in">
        <a class="back-btn" onclick="Router.navigate('/trips/${tripId}')">← Back to trip</a>

        <div class="form-page" style="max-width:760px">
          <div class="form-card">
            <div class="form-card-label">Add memories</div>
            <h2>Add Photos</h2>
            <p class="subtitle">Upload and organise photos from this trip</p>

            <div class="form-group">
              <label>Photos *</label>
              <div class="upload-zone" id="photo-upload-zone">
                <div class="upload-zone-icon">📸</div>
                <h3>Drag & drop photos here</h3>
                <p>or click to browse — JPG, PNG, WEBP up to 10MB each</p>
                <p style="font-size:12px; margin-top:6px; opacity:0.6">
                  You can select multiple photos at once
                </p>
                <input type="file" id="photo-input" accept="image/*" multiple style="display:none">
              </div>
              <div class="preview-grid" id="preview-grid"></div>
            </div>

            <div class="form-group">
              <label>Caption (applied to all photos)</label>
              <input
                type="text"
                id="photo-caption"
                class="form-control"
                placeholder="A short description of these photos..."
              >
            </div>

            <div class="form-group">
              <label>Link to a Place</label>
              <select id="photo-place" class="form-control">
                <option value="">— Not linked to a specific place —</option>
              </select>
            </div>

            <div class="form-group">
              <label>Photo Location (optional)</label>
              <p class="map-picker-hint">Tag these photos with a GPS location</p>
              <div class="map-picker-wrap">
                <div id="photo-map-picker" style="height:250px"></div>
              </div>
              <div class="coords-display" id="photo-coords">No location tagged</div>

              <div style="display:flex; gap:8px; margin-top:8px">
                <input
                  type="text"
                  id="photo-search-loc"
                  class="form-control"
                  placeholder="Search for location..."
                  style="flex:1"
                >
                <button class="btn btn-ghost btn-sm" onclick="searchPhotoLocation()">Search</button>
                <button class="btn btn-ghost btn-sm" onclick="useMyLocationForPhoto()">📍 Me</button>
              </div>
            </div>

            <div style="display:flex; gap:12px; align-items:center">
              <button
                class="btn btn-primary"
                id="upload-btn"
                onclick="uploadPhotos(${tripId})"
                style="flex:1"
              >
                Upload Photos →
              </button>
              <div id="upload-progress" style="font-size:13px; color:var(--ink-3)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  renderNav();

  selectedFiles = [];
  photoTripPlaces = [];
  photoLat = null;
  photoLng = null;

  try {
    photoTripPlaces = await api.get(`/api/trips/${tripId}/places`);
    const sel = document.getElementById('photo-place');

    photoTripPlaces.forEach((place) => {
      const opt = document.createElement('option');
      opt.value = place.id;
      opt.textContent = place.name;
      sel.appendChild(opt);
    });
  } catch (e) {
    photoTripPlaces = [];
  }

  setTimeout(() => initPhotoPickerMap(), 100);

  const input = document.getElementById('photo-input');
  const zone = document.getElementById('photo-upload-zone');

  zone.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    addFiles(Array.from(input.files));
    input.value = '';
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );

    addFiles(files);
  });
}

let photoPickerMap = null;
let photoPickerMarker = null;
let photoLat = null;
let photoLng = null;

function initPhotoPickerMap() {
  if (photoPickerMap) {
    photoPickerMap.remove();
    photoPickerMap = null;
  }

  photoPickerMap = L.map('photo-map-picker').setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(photoPickerMap);

  photoPickerMap.on('click', (e) => {
    photoLat = Number(e.latlng.lat).toFixed(6);
    photoLng = Number(e.latlng.lng).toFixed(6);

    if (photoPickerMarker) {
      photoPickerMap.removeLayer(photoPickerMarker);
    }

    photoPickerMarker = L.marker([photoLat, photoLng]).addTo(photoPickerMap);
    document.getElementById('photo-coords').textContent = `Lat: ${photoLat}, Lng: ${photoLng}`;
  });

  setTimeout(() => {
    photoPickerMap.invalidateSize();
  }, 200);
}

async function searchPhotoLocation() {
  const q = document.getElementById('photo-search-loc').value.trim();
  if (!q) return;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
    );
    const result = await response.json();

    if (result.length > 0) {
      photoLat = Number(result[0].lat).toFixed(6);
      photoLng = Number(result[0].lon).toFixed(6);

      if (photoPickerMarker) {
        photoPickerMap.removeLayer(photoPickerMarker);
      }

      photoPickerMarker = L.marker([photoLat, photoLng]).addTo(photoPickerMap);
      photoPickerMap.setView([photoLat, photoLng], 10);

      document.getElementById('photo-coords').textContent = `Lat: ${photoLat}, Lng: ${photoLng}`;
    } else {
      toast('Location not found', 'error');
    }
  } catch (err) {
    toast('Search failed', 'error');
  }
}

function useMyLocationForPhoto() {
  if (!navigator.geolocation) {
    toast('Geolocation is not supported on this device', 'error');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      photoLat = Number(pos.coords.latitude).toFixed(6);
      photoLng = Number(pos.coords.longitude).toFixed(6);

      if (photoPickerMarker) {
        photoPickerMap.removeLayer(photoPickerMarker);
      }

      photoPickerMarker = L.marker([photoLat, photoLng]).addTo(photoPickerMap);
      photoPickerMap.setView([photoLat, photoLng], 12);

      document.getElementById('photo-coords').textContent = `Lat: ${photoLat}, Lng: ${photoLng}`;
    },
    () => {
      toast('Could not get location', 'error');
    }
  );
}

function addFiles(files) {
  files.forEach((file) => {
    if (!file.type.startsWith('image/')) return;

    const currentIndex = selectedFiles.length;
    selectedFiles.push(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const grid = document.getElementById('preview-grid');
      const div = document.createElement('div');

      div.className = 'preview-item';
      div.id = `preview-${currentIndex}`;
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <span class="preview-remove" onclick="removeFile(${currentIndex})">✕</span>
      `;

      grid.appendChild(div);
    };

    reader.readAsDataURL(file);
  });

  updateZoneText();
}

function removeFile(idx) {
  selectedFiles[idx] = null;

  const el = document.getElementById(`preview-${idx}`);
  if (el) el.remove();

  updateZoneText();
}

function updateZoneText() {
  const count = selectedFiles.filter(Boolean).length;
  const zone = document.getElementById('photo-upload-zone');

  if (!zone) return;

  const heading = zone.querySelector('h3');
  const firstP = zone.querySelector('p');

  if (count > 0) {
    heading.textContent = `${count} photo${count > 1 ? 's' : ''} selected`;
    firstP.textContent = 'Click or drop more to add';
  } else {
    heading.textContent = 'Drag & drop photos here';
    firstP.textContent = 'or click to browse — JPG, PNG, WEBP up to 10MB each';
  }
}

async function uploadPhotos(tripId) {
  const files = selectedFiles.filter(Boolean);

  if (files.length === 0) {
    toast('Please select at least one photo', 'error');
    return;
  }

  const btn = document.getElementById('upload-btn');
  const progress = document.getElementById('upload-progress');

  btn.textContent = 'Uploading...';
  btn.disabled = true;

  try {
    const batchSize = 5;
    let uploaded = 0;

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const formData = new FormData();

      batch.forEach((file) => formData.append('photos', file));

      formData.append('caption', document.getElementById('photo-caption').value);

      const placeId = document.getElementById('photo-place').value;
      if (placeId) formData.append('place_id', placeId);

      if (photoLat) formData.append('latitude', photoLat);
      if (photoLng) formData.append('longitude', photoLng);

      await api.postForm(`/api/trips/${tripId}/photos`, formData);

      uploaded += batch.length;
      progress.textContent = `${uploaded}/${files.length} uploaded`;
    }

    toast(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded! 📸`, 'success');
    Router.navigate(`/trips/${tripId}`);
  } catch (err) {
    toast(err.message || 'Upload failed', 'error');
    btn.textContent = 'Upload Photos →';
    btn.disabled = false;
    progress.textContent = '';
  }
}