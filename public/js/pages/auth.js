function renderLandingPage() {
  document.getElementById('app').innerHTML = `
    <div class="hero-landing">
      <div class="hero-blob hero-blob-1"></div>
      <div class="hero-blob hero-blob-2"></div>

      <div class="hero-content fade-in">
        <div class="hero-chip">Travel Diary</div>
        <h1 class="hero-title">Every journey,<br><em>beautifully</em><br>remembered.</h1>
        <p class="hero-sub">
          Capture adventures with photos, maps and stories. Build a living record of every place you've been and every moment that mattered.
        </p>

        <div class="hero-btns">
          <button class="btn-hero-primary" onclick="Router.navigate('/register')">Start your diary</button>
          <button class="btn-hero-secondary" onclick="Router.navigate('/login')">Sign in</button>
        </div>
      </div>
    </div>
  `;
}

function renderLoginPage() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-panel-left">
        <div class="auth-card fade-in">
          <div class="auth-card-label">Welcome back</div>
          <h2>Sign in</h2>
          <p>Continue your travel diary</p>

          <div class="form-group">
            <label>Email</label>
            <input type="email" id="login-email" class="form-control" placeholder="you@example.com">
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" id="login-password" class="form-control" placeholder="••••••••">
          </div>

          <button class="btn btn-primary" id="login-btn" onclick="handleLogin()">Sign in</button>

          <div class="auth-switch">
            No account? <a onclick="Router.navigate('/register')">Create one →</a>
          </div>
        </div>
      </div>

      <div class="auth-panel-right">
        <div class="auth-panel-right-glow"></div>
        <div class="auth-panel-right-tag">Wanderlust</div>
        <h2 class="auth-panel-right-title">Your stories<br>are <em>waiting</em></h2>
        <p class="auth-panel-right-desc">
          Pick up where you left off. Your travel diary is right where you left it.
        </p>
      </div>
    </div>
  `;

  document.getElementById('login-email').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  document.getElementById('login-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');

  if (!email || !password) {
    alert('Please fill all fields');
    return;
  }

  btn.textContent = 'Signing in…';
  btn.disabled = true;

  try {
    const data = await api.post('/api/login', { email, password });
    AppState.user = data;

    alert('Welcome back!');
    Router.navigate('/dashboard');
    renderNav();
  } catch (err) {
    alert(err.message || 'Login failed');
    btn.textContent = 'Sign in';
    btn.disabled = false;
  }
}

function renderRegisterPage() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-panel-left">
        <div class="auth-card fade-in">
          <div class="auth-card-label">New to Wanderlust</div>
          <h2>Create account</h2>
          <p>Your travel diary awaits</p>

          <div class="form-group">
            <label>Username</label>
            <input type="text" id="reg-username" class="form-control" placeholder="adventurer">
          </div>

          <div class="form-group">
            <label>Email</label>
            <input type="email" id="reg-email" class="form-control" placeholder="you@example.com">
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" id="reg-password" class="form-control" placeholder="At least 6 characters">
          </div>

          <button class="btn btn-primary" id="reg-btn" onclick="handleRegister()">Create account</button>

          <div class="auth-switch">
            Already have an account? <a onclick="Router.navigate('/login')">Sign in →</a>
          </div>
        </div>
      </div>

      <div class="auth-panel-right">
        <div class="auth-panel-right-glow"></div>
        <div class="auth-panel-right-tag">Join thousands</div>
        <h2 class="auth-panel-right-title">Start your<br><em>journey</em><br>today</h2>
        <p class="auth-panel-right-desc">
          Join thousands of travellers documenting their adventures with Wanderlust.
        </p>
      </div>
    </div>
  `;

  document.getElementById('reg-username').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });

  document.getElementById('reg-email').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });

  document.getElementById('reg-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
}

async function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const btn = document.getElementById('reg-btn');

  if (!username || !email || !password) {
    alert('Please fill all fields');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  btn.textContent = 'Creating…';
  btn.disabled = true;

  try {
    const data = await api.post('/api/register', { username, email, password });
    AppState.user = data;

    alert('Welcome to Wanderlust!');
    Router.navigate('/dashboard');
    renderNav();
  } catch (err) {
    alert(err.message || 'Registration failed');
    btn.textContent = 'Create account';
    btn.disabled = false;
  }
}