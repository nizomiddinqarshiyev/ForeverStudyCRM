window.App = {
  user: null,

  async init() {
    this.initTheme();
    const token = API.getToken();
    if (!token) {
      this.showLogin();
      return;
    }

    try {
      const res = await API.get('/auth/me');
      this.user = res.data;
      this.renderLayout();
      this.setupRouter();
    } catch (error) {
      this.showLogin();
    }
  },

  initTheme() {
    const savedTheme = localStorage.getItem('edu_crm_theme') || 'dark';
    const body = document.body;
    const btn = document.getElementById('theme-toggle');
    if (savedTheme === 'light') {
      body.classList.add('light-theme');
      if (btn) btn.innerText = '☀️';
    } else {
      body.classList.remove('light-theme');
      if (btn) btn.innerText = '🌙';
    }
  },

  toggleTheme() {
    const body = document.body;
    body.classList.toggle('light-theme');
    const isLight = body.classList.contains('light-theme');
    localStorage.setItem('edu_crm_theme', isLight ? 'light' : 'dark');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerText = isLight ? '☀️' : '🌙';
  },

  showLogin() {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = '';
    AuthPage.render(appDiv);
  },

  logout() {
    API.removeToken();
    this.user = null;
    this.showLogin();
  },

  renderLayout() {
    document.getElementById('app').innerHTML = `
      <div class="app-layout">
        <aside class="sidebar" id="sidebar"></aside>
        <main class="main-content">
          <header class="page-header" id="page-header">
            <div class="flex gap-2" style="align-items: center">
              <button class="btn btn-secondary btn-sm" id="theme-toggle" onclick="App.toggleTheme()" style="padding: 8px 12px; font-size: 16px;">
                🌙
              </button>
            </div>
            <div id="header-notifications"></div>
          </header>
          <div id="page-content"></div>
        </main>
      </div>
    `;

    this.initTheme();

    Sidebar.render('sidebar', {
      activeRoute: location.hash.replace('#', '') || 'dashboard',
      user: this.user,
      notificationCount: 0,
      onNavigate: (route) => {
        window.location.hash = '#' + route;
      }
    });

    // Mock notifications if not loaded
    if(!window.Notifications) window.Notifications = { init() {} };

    Notifications.init('header-notifications');
  },

  setupRouter() {
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  route() {
    let hash = window.location.hash.replace('#', '');
    if (!hash) {
      window.location.hash = '#dashboard';
      return;
    }

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-item[data-id="${hash}"]`);
    if (activeLink) activeLink.classList.add('active');

    const contentDiv = document.getElementById('page-content');
    contentDiv.innerHTML = ''; // clear

    const pages = {
      'dashboard': DashboardPage,
      'pipeline': PipelinePage,
      'leads': LeadsPage,
      'courses': CoursesPage,
      'managers': ManagersPage,
      'reports': ReportsPage
    };

    const page = pages[hash];
    if (page && page.render) {
      page.render(contentDiv);
    } else {
      contentDiv.innerHTML = '<h2>Sahifa topilmadi</h2>';
    }
  }
};

// Start the app when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
