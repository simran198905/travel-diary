function renderAddTripPage() {
  if (!AppState.user) {
    Router.navigate('/');
    return;
  }

  document.getElementById('app').innerHTML = `
    <nav id="main-nav"></nav>
    <div class="page">
      <div class="page-content fade-in">
        <a class="back-btn" onclick="Router.navigate('/trips')">← Back to trips</a>

        <div class="form-page">
          <div class="form-card">
            <div class="form-card-label">New adventure</div>
            <h2>Create Trip</h2>
            <p class="subtitle">Every great journey starts with a single entry</p>

            <div class="form-group">
              <label>Trip Title *</label>
              <input
                type="text"
                id="trip-title"
                class="form-control"
                placeholder="e.g. Summer in Japan"
              >
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea
                id="trip-desc"
                class="form-control"
                placeholder="What's this trip about?"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Start Date</label>
                <input type="date" id="trip-start" class="form-control">
              </div>

              <div class="form-group">
                <label>End Date</label>
                <input type="date" id="trip-end" class="form-control">
              </div>
            </div>

            <div class="form-group">
              <label>Status</label>
              <select id="trip-status" class="form-control">
                <option value="planned">Planned</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div class="form-group">
              <label>Cover Photo</label>
              <div
                class="upload-zone"
                id="cover-zone"
                onclick="document.getElementById('cover-input').click()"
              >
                <div class="upload-zone-icon">🖼️</div>
                <h3>Click to upload a cover image</h3>
                <p>JPG, PNG, WEBP — up to 10MB</p>
                <input
                  type="file"
                  id="cover-input"
                  accept="image/*"
                  style="display:none"
                  onchange="previewCover(this)"
                >
              </div>

              <div id="cover-preview" style="margin-top:12px"></div>
            </div>

            <button class="btn btn-primary" id="save-trip-btn" onclick="saveTrip()">
              Create Trip →
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  renderNav();

  const zone = document.getElementById('cover-zone');

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

    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast('Please drop a valid image file', 'error');
      return;
    }

    const input = document.getElementById('cover-input');
    input.files = e.dataTransfer.files;
    previewCover(input);
  });
}

function previewCover(input) {
  const file = input.files ? input.files[0] : input;
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    toast('Please select a valid image file', 'error');
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    document.getElementById('cover-preview').innerHTML = `
      <div style="position:relative;display:inline-block">
        <img
          src="${e.target.result}"
          style="height:160px;border-radius:var(--r-sm);object-fit:cover;display:block;border:1.5px solid var(--border)"
          alt="Cover preview"
        >
        <button
          onclick="removeCover()"
          style="position:absolute;top:8px;right:8px;background:rgba(201,43,80,0.88);color:#fff;border:none;border-radius:var(--r-xs);padding:4px 12px;cursor:pointer;font-size:11px;font-weight:700"
        >
          ✕ Remove
        </button>
      </div>
    `;
  };

  reader.readAsDataURL(file);
}

function removeCover() {
  document.getElementById('cover-input').value = '';
  document.getElementById('cover-preview').innerHTML = '';
}

async function saveTrip() {
  const title = document.getElementById('trip-title').value.trim();
  const description = document.getElementById('trip-desc').value.trim();
  const startDate = document.getElementById('trip-start').value;
  const endDate = document.getElementById('trip-end').value;
  const status = document.getElementById('trip-status').value;

  if (!title) {
    toast('Please enter a trip title', 'error');
    return;
  }

  if (startDate && endDate && startDate > endDate) {
    toast('End date cannot be before start date', 'error');
    return;
  }

  const btn = document.getElementById('save-trip-btn');
  btn.textContent = 'Creating…';
  btn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);
    formData.append('status', status);

    const coverFile = document.getElementById('cover-input').files[0];
    if (coverFile) {
      formData.append('cover_photo', coverFile);
    }

    const result = await api.postForm('/api/trips', formData);

    toast('Trip created! 🎉', 'success');
    Router.navigate(`/trips/${result.tripId}`);
  } catch (e) {
    toast(e.message || 'Failed to create trip', 'error');
    btn.textContent = 'Create Trip →';
    btn.disabled = false;
  }
}