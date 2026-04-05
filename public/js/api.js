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

function toast(message, type = 'default', duration = 3000) {
  alert(message);
}

function showLoader(show) {
  const loader = document.getElementById('global-loader');
  if (!loader) return;
  loader.style.display = show ? 'flex' : 'none';
}