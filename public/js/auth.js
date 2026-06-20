window.AuthPage = {
  render(container) {
    container.innerHTML = `
      <div class="login-page">
        <div class="login-card" style="text-align: center;">
          <div style="display: flex; justify-content: center; margin-bottom: 16px; animation: logoFadeIn 0.8s ease-out;">
            <img src="/logo.png" alt="ForeverStudy Logo" style="height: 110px; max-width: 100%; object-fit: contain; background: white; padding: 6px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.12);">
          </div>
          <div class="login-subtitle" style="margin-top: 8px;">O'quv markazi boshqaruv tizimi</div>
          
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
