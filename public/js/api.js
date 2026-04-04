const api = {
  async request(method, url, data = null, isFormData = false) {
    const options = {
      method,
      credentials: 'include'
    };

    if (data) {
      if (isFormData) {
        options.body = data;
      } else {
        options.headers = {
          'Content-Type': 'application/json'
        };
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(url, options);

    let json = {};
    try {
      json = await response.json();
    } catch (e) {
      json = {};
    }

    if (!response.ok) {
      throw new Error(json.error || 'Request failed');
    }

    return json;
  },

  get(url) {
    return api.request('GET', url);
  },

  post(url, data) {
    return api.request('POST', url, data);
  },

  postForm(url, formData) {
    return api.request('POST', url, formData, true);
  },

  put(url, data) {
    return api.request('PUT', url, data);
  },

  putForm(url, formData) {
    return api.request('PUT', url, formData, true);
  },

  delete(url) {
    return api.request('DELETE', url);
  }
};

// Toast system
function toast(message, type = 'default', duration = 3000) {
  let container = document.getElementById('toast-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toastEl = document.createElement('div');
  toastEl.className = `toast ${type}`;
  toastEl.textContent = message;
  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(20px)';
    toastEl.style.transition = '0.3s';

    setTimeout(() => {
      toastEl.remove();
    }, 300);
  }, duration);
}

function showLoader(show) {
  const loader = document.getElementById('global-loader');
  if (!loader) return;
  loader.style.display = show ? 'flex' : 'none';
}