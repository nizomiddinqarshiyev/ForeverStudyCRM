window.AuthPage = {
  render(container) {
    container.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="login-logo">🇰🇷 EDU CRM</div>
          <div class="login-subtitle">Koreya tili o'quv markazi tizimi</div>
          
          <form id="login-form">
            <div class="form-group">
              <label>Login</label>
              <input type="text" id="username" class="form-control" placeholder="admin" required>
            </div>
            <div class="form-group">
              <label>Parol</label>
              <input type="password" id="password" class="form-control" placeholder="••••••••" required>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
              Tizimga kirish
            </button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', this.handleLogin.bind(this));
  },

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const btn = e.target.querySelector('button');
    const origText = btn.innerText;

    try {
      btn.innerText = 'Kutilmoqda...';
      btn.disabled = true;

      const res = await API.post('/auth/login', { username, password });
      API.setToken(res.data.token);
      Toast.success('Tizimga kirdingiz');
      App.init(); // Reload app state
    } catch (error) {
      Toast.error(error.message);
      btn.innerText = origText;
      btn.disabled = false;
    }
  }
};
