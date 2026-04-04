const Router = {
  routes: {},
  currentPage: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path, pushState = true) {
    if (pushState) {
      window.location.hash = path;
    }
    this.resolve(path);
  },

  resolve(hash) {
    const path = hash.replace('#', '') || '/';
    let handler = this.routes[path];
    let params = {};

    if (!handler) {
      for (const [route, fn] of Object.entries(this.routes)) {
        const routeParts = route.split('/');
        const pathParts = path.split('/');

        if (routeParts.length !== pathParts.length) continue;

        const match = routeParts.every((part, i) => {
          return part.startsWith(':') || part === pathParts[i];
        });

        if (match) {
          handler = fn;
          routeParts.forEach((part, i) => {
            if (part.startsWith(':')) {
              params[part.slice(1)] = pathParts[i];
            }
          });
          break;
        }
      }
    }

    if (handler) {
      handler(params);
    } else {
      this.navigate('/');
    }
  },

  init() {
    window.addEventListener('hashchange', () => {
      this.resolve(window.location.hash);
    });

    this.resolve(window.location.hash);
  }
};